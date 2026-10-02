"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  Clock, 
  Truck, 
  MapPin, 
  ShieldCheck, 
  ArrowLeft, 
  Package, 
  ChevronRight, 
  RotateCcw, 
  Receipt, 
  PhoneCall,
  Loader2,
  Box,
  CheckCircle,
  Printer,
  X,
  ShoppingBag,
  Store
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { orderService } from "@/services/orders";
import { supabase } from "@/lib/supabase/client";
import { Order, CartItem } from "@/types";

export default function OrderDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [resolvedId, setResolvedId] = useState<string>(() => {
    if (params && typeof params === "object" && "id" in params && typeof (params as any).id === "string") {
      return (params as any).id;
    }
    return "";
  });

  useEffect(() => {
    if (!resolvedId) {
      Promise.resolve(params).then((p) => {
        if (p?.id) setResolvedId(p.id);
      });
    }
  }, [params, resolvedId]);

  const { orders, addToCart, stores, activeStore, user } = useApp();
  const [dbOrder, setDbOrder] = useState<Order | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Find order in AppContext or state or localStorage (only after mount to avoid hydration mismatch)
  let contextOrder: Order | undefined = undefined;
  if (isMounted) {
    contextOrder = orders.find(
      (o) => o.id === resolvedId || o.orderNumber === resolvedId
    );
    if (!contextOrder && typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("kmart_orders");
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) {
            contextOrder = parsed.find(
              (o: Order) => o.id === resolvedId || o.orderNumber === resolvedId
            );
          }
        }
      } catch {}
    }
  }
  const order = dbOrder || contextOrder;

  // Fetch directly from DB if not in AppContext
  const fetchOrderFromDb = useCallback(async (targetId: string) => {
    if (!targetId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              id, name, mrp, selling_price, weight_unit, image_url, brand, description,
              categories ( name )
            )
          )
        `)
        .or(`id.eq.${targetId},order_number.eq.${targetId}`)
        .maybeSingle();

      if (data && !error) {
        const items: CartItem[] = (data.order_items || []).map((it: any) => {
          const p = it.products || {};
          return {
            product: {
              id: it.product_id,
              name: it.product_name || p.name || 'Grocery Item',
              category: p.categories?.name || 'Groceries',
              weight: p.weight_unit || '1 unit',
              price: Number(it.unit_selling_price || it.price || 0),
              originalPrice: Number(it.unit_mrp || p.mrp || 0),
              discountPercent: 0,
              rating: 4.8,
              reviewCount: 24,
              image: p.image_url || 'https://placehold.co/400x400?text=K+MART',
              inStock: true,
              stockCount: 50,
              brand: p.brand || 'K MART',
              deliveryTime: 'Delivery on time',
              description: p.description || '',
            },
            quantity: it.quantity,
          };
        });

        const addressSnapshot = data.delivery_address_snapshot || {};
        const customerSnapshot = (data as any).customer_snapshot || {};

        setDbOrder({
          id: data.id,
          orderNumber: data.order_number || `KM-${data.id.slice(0, 6).toUpperCase()}`,
          orderType: (data.order_type as any) || 'DELIVERY',
          pickupStoreId: data.pickup_store_id || null,
          customerName: customerSnapshot.name || addressSnapshot.full_name || addressSnapshot.name || null,
          customerPhone: customerSnapshot.phone || addressSnapshot.phone || null,
          items,
          itemTotal: Number(data.subtotal || 0),
          discount: 0,
          deliveryFee: Number(data.delivery_fee || 0),
          handlingFee: Number((data as any).handling_fee || 0),
          platformFee: Number((data as any).platform_fee || 0),
          totalAmount: Number(data.total || 0),
          deliveryAddress: addressSnapshot.line1 ? {
            id: addressSnapshot.id || 'snapshot',
            label: addressSnapshot.label || 'Home',
            fullName: addressSnapshot.full_name || addressSnapshot.name || 'Customer',
            phone: addressSnapshot.phone || '',
            line1: addressSnapshot.line1,
            line2: addressSnapshot.line2,
            city: addressSnapshot.city || 'Pune',
            state: addressSnapshot.state || 'Maharashtra',
            pincode: addressSnapshot.pincode || '',
            latitude: addressSnapshot.latitude || 0,
            longitude: addressSnapshot.longitude || 0,
          } : null,
          deliverySlot: {
            slotId: data.delivery_slot_id,
            time: '8:00 AM - 12:00 PM',
            day: data.scheduled_delivery_date || 'Scheduled',
            date: data.scheduled_delivery_date,
          },
          paymentMethod: data.payment_method === 'ONLINE' ? 'Razorpay' : 'Cash on Delivery',
          status: data.status || 'Order Confirmed',
          createdAt: data.created_at,
        });
      }
    } catch (err: any) {
      console.warn('[OrderDetailPage] error fetching order:', err?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (resolvedId && !contextOrder && !dbOrder) {
      fetchOrderFromDb(resolvedId);
    } else if (contextOrder || dbOrder) {
      setIsLoading(false);
    }
  }, [isMounted, resolvedId, contextOrder, dbOrder, fetchOrderFromDb]);

  // Subscribe to real-time status updates from Supabase
  useEffect(() => {
    if (!resolvedId) return;

    const channel = supabase
      .channel(`order-${resolvedId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${resolvedId}`,
        },
        (payload: any) => {
          if (payload?.new?.status) {
            setDbOrder((prev) => prev ? { ...prev, status: payload.new.status as any } : null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resolvedId]);

  // Handler to advance stage in DB
  const handleUpdateStatus = async (newStatus: string) => {
    if (!order) return;
    setIsUpdatingStatus(true);
    try {
      const ok = await orderService.updateOrderStatus(order.id, newStatus);
      if (ok) {
        setDbOrder((prev) => prev ? { ...prev, status: newStatus as any } : { ...order, status: newStatus as any });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReorder = () => {
    if (!order) return;
    order.items.forEach((it) => {
      addToCart(it.product, it.quantity);
    });
    router.push("/cart");
  };

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-[75vh] bg-[#F8F9FA] flex flex-col items-center justify-center px-4 py-16 text-center">
        <Loader2 className="w-10 h-10 text-[#E11A22] animate-spin mb-4" />
        <p className="text-sm font-bold text-gray-700">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[75vh] bg-[#F8F9FA] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-20 h-20 bg-red-50 text-[#E11A22] rounded-full flex items-center justify-center mb-4">
          <Package className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-[#0A2540]">Order Not Found</h1>
        <p className="mt-2 text-sm text-gray-500 max-w-md">
          We couldn't find an order with reference #{resolvedId}.
        </p>
        <Link
          href="/orders"
          className="mt-6 px-6 py-2.5 rounded-xl bg-[#0A2540] text-white text-sm font-bold shadow-sm"
        >
          View All Orders
        </Link>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Order Status Stages: Preparing → Packed → Out for Delivery → Delivered
  // -------------------------------------------------------------------------
  const isPickup = order.orderType === 'PICKUP';
  const pickupStore = stores.find((s) => s.id === order.pickupStoreId) || activeStore || stores[0];

  const normalized = (order.status || "").toUpperCase().replace(/[\s-]+/g, "_");

  const isDelivered = normalized === "DELIVERED";
  const isPickedUp = normalized === "PICKED_UP";
  const isReadyForPickupOrMore = ["READY_FOR_PICKUP", "PICKED_UP"].includes(normalized);

  const isPackedOrMore = isPickup
    ? ["PACKED", "READY_FOR_PICKUP", "PICKED_UP"].includes(normalized)
    : ["PACKED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(normalized);

  const isPreparingOrMore = isPickup
    ? ["CONFIRMED", "ORDER_CONFIRMED", "PLACED", "PREPARING", "PACKED", "READY_FOR_PICKUP", "PICKED_UP"].includes(normalized)
    : ["CONFIRMED", "ORDER_CONFIRMED", "PLACED", "PREPARING", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(normalized);

  const isOutOrMore = ["OUT_FOR_DELIVERY", "DELIVERED"].includes(normalized);

  const currentActiveIndex = isPickup
    ? (isPickedUp ? 3 : isReadyForPickupOrMore ? 2 : isPackedOrMore ? 1 : 0)
    : (isDelivered ? 3 : isOutOrMore ? 2 : isPackedOrMore ? 1 : 0);

  const steps = isPickup
    ? [
        {
          step: 1,
          title: "Preparing",
          statusValue: "PREPARING",
          desc: "Order confirmed & items being picked at store",
          icon: Clock,
          done: isPreparingOrMore,
          active: currentActiveIndex === 0,
        },
        {
          step: 2,
          title: "Packed",
          statusValue: "PACKED",
          desc: "Bags sealed, quality checked & staged for pickup",
          icon: Box,
          done: isPackedOrMore,
          active: currentActiveIndex === 1,
        },
        {
          step: 3,
          title: "Ready for Pickup",
          statusValue: "READY_FOR_PICKUP",
          desc: "Order waiting at store customer pickup counter",
          icon: ShoppingBag,
          done: isReadyForPickupOrMore,
          active: currentActiveIndex === 2,
        },
        {
          step: 4,
          title: "Picked Up",
          statusValue: "PICKED_UP",
          desc: "Order safely collected by customer",
          icon: CheckCircle,
          done: isPickedUp,
          active: currentActiveIndex === 3,
        },
      ]
    : [
        {
          step: 1,
          title: "Preparing",
          statusValue: "PREPARING",
          desc: "Order confirmed & items being picked at K MART Hub",
          icon: Clock,
          done: isPreparingOrMore,
          active: currentActiveIndex === 0,
        },
        {
          step: 2,
          title: "Packed",
          statusValue: "PACKED",
          desc: "Carton sealed, quality checked & sanitized",
          icon: Box,
          done: isPackedOrMore,
          active: currentActiveIndex === 1,
        },
        {
          step: 3,
          title: "Out for Delivery",
          statusValue: "OUT_FOR_DELIVERY",
          desc: "Delivery executive is on the way to your address",
          icon: Truck,
          done: isOutOrMore,
          active: currentActiveIndex === 2,
        },
        {
          step: 4,
          title: "Delivered",
          statusValue: "DELIVERED",
          desc: "Order handed over safely at your doorstep",
          icon: CheckCircle,
          done: isDelivered,
          active: currentActiveIndex === 3,
        },
      ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-16">
      {/* Top Breadcrumb */}
      <div className="bg-white border-b border-gray-200/80 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <Link href="/" className="hover:text-[#E11A22] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <Link href="/orders" className="hover:text-[#E11A22] transition-colors">
              Orders
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-semibold text-gray-900">#{order.orderNumber || order.id}</span>
          </div>

          <Link
            href="/orders"
            className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-[#E11A22] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Orders</span>
          </Link>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#0A2540] to-[#123154] text-white p-6 sm:p-8 rounded-2xl shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#E11A22] text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {order.status}
              </span>
              <span className="text-xs text-gray-300">
                Order Reference #{order.orderNumber || order.id}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              {isPickup
                ? (isPickedUp ? "Collected from Store" : isReadyForPickupOrMore ? "Ready for Pickup at Store" : "Preparing for Store Pickup")
                : (isDelivered ? "Delivered to Doorstep" : "Delivery on time")}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-1">
              {isPickup
                ? `Collect at ${pickupStore?.name || "K MART Store"} • Show Order ID at pickup desk`
                : `Slot: ${order.deliverySlot?.day || (order.deliverySlot as any)?.date || "Scheduled"} (${order.deliverySlot?.time})`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReorder}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reorder Basket</span>
            </button>
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="bg-white text-[#0A2540] font-black text-xs px-4 py-2.5 rounded-xl transition-colors hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Receipt className="w-3.5 h-3.5 text-[#E11A22]" />
              <span>Invoice</span>
            </button>
          </div>
        </div>

        {/* 4-Step Tracking Flow: Preparing → Packed → Out for Delivery → Delivered */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-2xs mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-black text-sm text-[#0A2540] uppercase tracking-wider">
                Live Order Tracking
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time fulfillment stages from K MART fulfillment center
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="flex flex-col items-center text-center relative z-10">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm mb-2.5 transition-all ${
                      step.active
                        ? "bg-[#E11A22] text-white ring-4 ring-red-100 shadow-md animate-pulse"
                        : step.done
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    }`}
                  >
                    {step.done ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                  </div>

                  <div className="flex items-center gap-1">
                    <h3 className={`font-bold text-xs ${step.active ? "text-[#E11A22] font-black" : step.done ? "text-gray-900" : "text-gray-400"}`}>
                      {step.title}
                    </h3>
                    {step.active && (
                      <span className="w-2 h-2 rounded-full bg-[#E11A22] animate-ping" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 max-w-[150px] leading-snug">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Items Breakdown (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <h2 className="font-black text-base text-[#0A2540] border-b border-gray-100 pb-3">
              Items Ordered ({order.items.length})
            </h2>

            <div className="divide-y divide-gray-100">
              {order.items.map(({ product, quantity }) => (
                <div key={product.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/product/${product.id}`}
                      className="w-14 h-14 shrink-0 aspect-square rounded-xl bg-[#F8F9FA] border border-gray-200/80 p-1 flex items-center justify-center overflow-hidden"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    </Link>

                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        {product.brand}
                      </span>
                      <Link
                        href={`/product/${product.id}`}
                        className="font-bold text-xs sm:text-sm text-gray-900 hover:text-[#E11A22] block leading-snug"
                      >
                        {product.name}
                      </Link>
                      <p className="text-[11px] text-gray-500">
                        {product.weight} • Qty: {quantity}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-sm text-[#0A2540] block">
                      ₹{product.price * quantity}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      ₹{product.price} each
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Address & Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Delivery address / Store Pickup details */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                {isPickup ? (
                  <>
                    <Store className="w-4 h-4 text-[#E11A22]" />
                    <h3 className="font-black text-xs text-[#0A2540] uppercase tracking-wider">
                      Store Pickup Location
                    </h3>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 text-[#E11A22]" />
                    <h3 className="font-black text-xs text-[#0A2540] uppercase tracking-wider">
                      Delivery Destination
                    </h3>
                  </>
                )}
              </div>
              {isPickup ? (
                <>
                  <p className="text-xs font-bold text-gray-900">
                    {pickupStore?.name || "K MART Supermarket"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {pickupStore?.address || "Baramati - Nira Rd, Yashwant Nagar, Kasba, Baramati, Maharashtra 413102"}
                  </p>

                  <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-900">
                    <p className="font-bold flex items-center gap-1.5 text-emerald-950">
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
                      In-Store Collection Desk
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Show Order #{order.orderNumber || order.id} at the counter to collect your order.
                    </p>
                  </div>
                </>
              ) : order.deliveryAddress ? (
                <>
                  <p className="text-xs font-bold text-gray-900">
                    {order.deliveryAddress.fullName} ({order.deliveryAddress.label})
                  </p>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {order.deliveryAddress.line1}{order.deliveryAddress.line2 ? `, ${order.deliveryAddress.line2}` : ''}, {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-gray-400" />
                    <span>{order.deliveryAddress.phone}</span>
                  </p>
                </>
              ) : (
                <p className="text-xs text-gray-500 italic">No delivery address recorded</p>
              )}
            </div>

            {/* Payment & Invoice summary */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs space-y-2.5 text-xs">
              <h3 className="font-black text-xs text-[#0A2540] uppercase tracking-wider mb-2">
                Payment Summary
              </h3>

              <div className="flex justify-between text-gray-600 items-center">
                <span>Payment Method</span>
                <span className="font-bold text-gray-900">
                  {order.paymentMethod === 'Cash on Delivery' && isPickup
                    ? 'Pay at Store Counter'
                    : order.paymentMethod}
                </span>
              </div>

              <div className="flex justify-between text-gray-600 items-center">
                <span>Payment Status</span>
                <span className={`font-bold text-xs px-2 py-0.5 rounded ${
                  order.paymentMethod === 'Razorpay' 
                    ? 'text-emerald-700 bg-emerald-50' 
                    : 'text-amber-700 bg-amber-50'
                }`}>
                  {order.paymentMethod === 'Razorpay'
                    ? 'PAID (Online via Razorpay)'
                    : isPickup
                    ? 'PENDING (Pay at Store Counter)'
                    : 'PENDING (Pay on Delivery)'}
                </span>
              </div>

              {order.paymentId && (
                <div className="flex justify-between text-gray-600 items-center">
                  <span>Payment Ref ID</span>
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {order.paymentId}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Item Total</span>
                <span className="font-semibold text-gray-900">₹{order.itemTotal}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span className="font-bold text-emerald-700 uppercase">
                  {isPickup ? "FREE (Store Pickup)" : order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee}`}
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Handling Charges</span>
                <span className="font-bold text-emerald-700 uppercase">
                  {(order.handlingFee ?? 0) === 0 ? "FREE" : `₹${order.handlingFee}`}
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Platform Fee</span>
                <span className="font-bold text-emerald-700 uppercase">
                  {(order.platformFee ?? 0) === 0 ? "FREE" : `₹${order.platformFee}`}
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-2.5 border-t border-gray-200 text-sm text-[#0A2540]">
                <span className="font-black">Total Paid</span>
                <span className="font-black text-xl">₹{order.totalAmount}</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Official Printable Tax Invoice Modal (No Discount) */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 relative my-6 text-left flex flex-col max-h-[92vh] animate-modal-in">
            {/* Modal Actions Header */}
            <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#E11A22]" />
                <span className="font-extrabold text-sm text-[#0A2540]">
                  Tax Invoice • Order #{order.orderNumber || order.id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0A2540] hover:bg-[#123154] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Invoice Document Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-gray-800">
              {/* Invoice Top Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-gray-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-black text-[#E11A22] tracking-tighter">K MART</span>
                    <span className="bg-red-50 text-[#E11A22] text-[10px] font-black px-1.5 py-0.5 rounded">TAX INVOICE</span>
                  </div>
                  <p className="font-bold text-gray-900 text-xs">K MART Retail Pvt. Ltd.</p>
                  <p className="text-gray-500 text-[11px] leading-relaxed">
                    Store 1 • Green Park / Store 2 • Camp, Pune, MH 411001<br />
                    GSTIN: 27AABCK1234F1Z8 • FSSAI Lic No: 11522001000456
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-0.5">
                  <p className="text-gray-400 font-bold text-[10px] uppercase">Invoice Number</p>
                  <p className="font-black text-sm text-[#0A2540]">INV-{(order.orderNumber || order.id).replace('#', '')}</p>
                  <p className="text-gray-500 text-[11px]">
                    Date: {new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    Time: {new Date(order.createdAt || Date.now()).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>

              {/* Billed To / Delivery To */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <p className="text-[10px] font-extrabold uppercase text-gray-400 mb-1">
                    {isPickup ? "Billed To (Pickup Customer)" : "Billed To (Customer)"}
                  </p>
                  <p className="font-bold text-gray-900 text-xs">
                    {order.customerName || order.deliveryAddress?.fullName || user.name || 'Customer'}
                  </p>
                  <p className="text-gray-600 text-[11px] mt-0.5">
                    {order.customerPhone || order.deliveryAddress?.phone || user.phone || ''}
                  </p>
                  <p className="text-gray-600 text-[11px] leading-relaxed">
                    {order.deliveryAddress
                      ? `${order.deliveryAddress.line1}${order.deliveryAddress.line2 ? `, ${order.deliveryAddress.line2}` : ''}, ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}`
                      : `Store Pickup: ${pickupStore?.name || 'K MART Baramati'}`}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-extrabold uppercase text-gray-400 mb-1">Fulfillment & Payment</p>
                  <p className="text-gray-700 text-[11px]">
                    <strong className="text-gray-900">{isPickup ? "Fulfillment:" : "Delivery Slot:"}</strong>{" "}
                    {isPickup
                      ? `Store Pickup (${pickupStore?.name || "K MART Store"})`
                      : `${order.deliverySlot?.day || "Scheduled"} (${order.deliverySlot?.time})`}
                  </p>
                  <p className="text-gray-700 text-[11px] mt-0.5">
                    <strong className="text-gray-900">Payment Mode:</strong> {order.paymentMethod}
                  </p>
                  {order.paymentId && (
                    <p className="text-gray-700 text-[11px] mt-0.5">
                      <strong className="text-gray-900">Transaction ID:</strong> <span className="font-mono">{order.paymentId}</span>
                    </p>
                  )}
                  <p className="text-gray-700 text-[11px] mt-0.5">
                    <strong className="text-gray-900">Order Status:</strong> {order.status}
                  </p>
                </div>
              </div>

              {/* Invoice Items Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items.map(({ product, quantity }, idx) => (
                      <tr key={product.id}>
                        <td className="py-2.5 px-3 text-gray-400 font-medium">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-gray-900">{product.name}</p>
                          <p className="text-[10px] text-gray-400">{product.brand} • {product.weight}</p>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-gray-700">{quantity}</td>
                        <td className="py-2.5 px-3 text-right text-gray-600">₹{product.price}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-gray-900">₹{product.price * quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoice Summary (NO DISCOUNT) */}
              <div className="flex justify-end pt-2">
                <div className="w-full sm:w-72 space-y-2 text-xs border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Item Total (Subtotal)</span>
                    <span className="font-bold text-gray-900">₹{order.itemTotal}</span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span className="font-bold text-emerald-700 uppercase">
                      {isPickup ? "FREE (Store Pickup)" : order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee}`}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Handling Charges</span>
                    <span className="font-bold text-emerald-700 uppercase">
                      {(order.handlingFee ?? 0) === 0 ? "FREE" : `₹${order.handlingFee}`}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Platform Fee</span>
                    <span className="font-bold text-emerald-700 uppercase">
                      {(order.platformFee ?? 0) === 0 ? "FREE" : `₹${order.platformFee}`}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline pt-2 border-t-2 border-gray-900 text-sm">
                    <span className="font-black text-[#0A2540]">Total Amount</span>
                    <span className="font-black text-lg text-[#0A2540]">₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400 space-y-0.5">
                <p className="font-semibold text-gray-500">Thank you for shopping with K MART Express!</p>
                <p>This is a computer-generated tax invoice and requires no physical signature.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
