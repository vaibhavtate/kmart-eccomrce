"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  MapPin, 
  Clock, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  ChevronRight, 
  Plus, 
  Truck,
  ArrowLeft,
  Lock,
  AlertCircle,
  User,
  ShoppingBag,
  Store,
  Calendar,
  Sparkles
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Address, DeliverySlotItem } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { deliveryService } from "@/services/delivery";
import { cartService } from "@/services/cart";
import confetti from "canvas-confetti";

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    cartCount,
    itemTotal,
    discount,
    deliveryFee,
    handlingFee,
    platformFee,
    totalAmount,
    selectedAddress,
    addresses,
    setSelectedAddress,
    addAddress,
    deliverySettings,
    deliverySlots,
    selectedSlot,
    setSelectedSlot,
    currentCustomer,
    customerOrderCount,
    user,
    setIsAuthOpen,
    activeStore,
    setActiveStore,
    stores,
    storeDistanceKm,
    isDeliverable,
    orderType,
    setOrderType,
    clearCart,
    placeOrder,
    setIsScheduleModalOpen,
    setIsCheckoutOpen,
  } = useApp();

  useEffect(() => {
    setIsCheckoutOpen(true);
    router.replace('/?open=checkout');
  }, [router, setIsCheckoutOpen]);

  const [paymentMethod, setPaymentMethod] = useState<"Cash on Delivery" | "Razorpay">("Razorpay");
  const [isPlacing, setIsPlacing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [daySlots, setDaySlots] = useState<DeliverySlotItem[]>(deliverySlots);

  useEffect(() => {
    deliveryService.getAvailableSlots(activeStore?.id).then((slots) => {
      if (slots && slots.length > 0) {
        setDaySlots(slots);
        const firstAvail = slots.find((s) => s.isAvailable) || slots[0];
        setSelectedSlot(firstAvail);
      }
    });
  }, [activeStore?.id, setSelectedSlot]);

  // New address form state matching DB schema
  const [newLabel, setNewLabel] = useState<"Home" | "Work" | "Other">("Home");
  const [newName, setNewName] = useState(user.name || "");
  const [newPhone, setNewPhone] = useState(user.phone || "");
  const [newLine1, setNewLine1] = useState("");
  const [newLine2, setNewLine2] = useState("");
  const [newCity, setNewCity] = useState("Baramati");
  const [newState, setNewState] = useState("Maharashtra");
  const [newPincode, setNewPincode] = useState("413102");

  useEffect(() => {
    if (user.name && !newName) setNewName(user.name);
    if (user.phone && !newPhone) setNewPhone(user.phone);
  }, [user.name, user.phone]);

  const isBelowMinOrder = itemTotal < deliverySettings.min_order_value;

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLine1 || !newPhone) return;

    await addAddress({
      label: newLabel,
      fullName: newName || "Customer",
      phone: newPhone,
      line1: newLine1,
      line2: newLine2 || undefined,
      city: newCity,
      state: newState,
      pincode: newPincode,
      latitude: 0,
      longitude: 0,
      isDefault: addresses.length === 0,
    });

    setShowNewAddressForm(false);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || isPlacing) return;
    setCheckoutError(null);

    if (!user.isVerified) {
      setIsAuthOpen(true);
      return;
    }

    let customerId = currentCustomer?.id;
    if (!customerId) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.id) {
          const { data: custRow } = await supabase
            .from('customers')
            .select('id')
            .eq('auth_user_id', authUser.id)
            .maybeSingle();
          if (custRow?.id) customerId = custRow.id;
        }
      } catch {}
    }

    if (!customerId) {
      setCheckoutError("Could not find your account. Please log out and log in again.");
      return;
    }

    if (orderType === 'DELIVERY') {
      if (!selectedAddress) {
        setCheckoutError("Please add or select a delivery address before placing your order.");
        setShowNewAddressForm(true);
        return;
      }
      if (isBelowMinOrder) {
        setCheckoutError(`Minimum order value for delivery is ₹${deliverySettings.min_order_value}. Please add more items.`);
        return;
      }
      if (selectedSlot && !selectedSlot.isAvailable) {
        setCheckoutError(`The ${selectedSlot.name} slot is no longer available. Please select an available slot.`);
        return;
      }
    }

    setIsPlacing(true);

    try {
      const idempotencyKey = crypto.randomUUID();

      let chosenSlot = selectedSlot;
      const isRealUuid = (id?: string) =>
        Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

      if (orderType === 'DELIVERY') {
        if (!chosenSlot || !isRealUuid(chosenSlot.id) || !chosenSlot.isAvailable) {
          const avail = daySlots.find((s) => s.isAvailable && isRealUuid(s.id));
          if (avail) {
            chosenSlot = avail;
            setSelectedSlot(avail);
          }
        }

        if (!chosenSlot || !isRealUuid(chosenSlot.id)) {
          setCheckoutError("No available delivery slots found for today. Please switch to Store Pickup or try again later.");
          setIsPlacing(false);
          return;
        }

        if (!chosenSlot.isAvailable) {
          setCheckoutError(chosenSlot.unavailableReason || "The selected delivery slot is no longer available. Please choose another slot.");
          setIsPlacing(false);
          return;
        }
      }

      // Check for any non-UUID mock items in cart
      const nonDbItems = cart.filter(
        (item) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.product.id)
      );
      if (nonDbItems.length > 0) {
        setCheckoutError(
          `"${nonDbItems[0].product.name}" is a demo item not present in the live store database. Please remove it and select products from our live catalog (such as Aashirvaad Atta, Amul Milk, Maggi Noodles, Tata Salt, etc.).`
        );
        setIsPlacing(false);
        return;
      }

      // 1. Sync active cart to DB for the customer
      const cartId = await cartService.getOrCreateCartId(customerId);
      if (!cartId) {
        setCheckoutError("Unable to access your cart in the database. Please try logging out and logging in again.");
        setIsPlacing(false);
        return;
      }

      for (const item of cart) {
        await cartService.upsertCartItem(cartId, item.product.id, item.quantity);
      }

      // 2. Process Order via Server-Side Checkout Edge Function (Enforces server pricing, stock, & payment status)
      const { data, error } = await supabase.functions.invoke('checkout', {
        body: {
          customerId,
          addressId:             orderType === 'DELIVERY' ? (selectedAddress?.id ?? null) : null,
          orderType,
          pickupStoreId:         orderType === 'PICKUP' ? (activeStore?.id ?? stores[0]?.id ?? null) : null,
          deliverySlotId:        orderType === 'DELIVERY' ? chosenSlot.id : null,
          scheduledDeliveryDate: orderType === 'DELIVERY' ? (chosenSlot?.date ?? null) : null,
          paymentMethod:         paymentMethod === 'Cash on Delivery' ? 'COD' : 'ONLINE',
          idempotencyKey,
        },
      });

      if (error) {
        let msg = 'Checkout failed. Please try again.';
        try {
          const details = await (error as any).context?.json?.();
          if (details?.error) msg = details.error;
        } catch {}
        setCheckoutError(msg);
        setIsPlacing(false);
        return;
      }

      if (data?.error) {
        setCheckoutError(data.error);
        setIsPlacing(false);
        return;
      }

      if (!data?.order?.id) {
        throw new Error('Order could not be confirmed. Please try again.');
      }

      const orderId = data.order.id;
      const razorpayData = data;

      if (data?.droppedItems?.length > 0) {
        const names = data.droppedItems.map((i: any) => i.productName || i.product_name).join(', ');
        alert(`Some items were out of stock and removed from your order: ${names}`);
      }

      // ── COD ──────────────────────────────────────────────────────────
      if (paymentMethod === 'Cash on Delivery') {
        try { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); } catch {}
        clearCart();
        router.push(`/orders/${orderId}`);
        return;
      }

      // ── ONLINE (Razorpay) ─────────────────────────────────────────────
      await new Promise<void>((resolve, reject) => {
        if ((window as any).Razorpay) { resolve(); return; }
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
        document.body.appendChild(s);
      });

      const rzp = new (window as any).Razorpay({
        key:         data.razorpayKeyId,
        order_id:    data.razorpayOrderId,
        amount:      Math.round(data.order.total * 100),
        currency:    'INR',
        name:        'K MART',
        description: orderType === 'PICKUP' ? 'Store Pickup Order' : 'Groceries Order',
        prefill: {
          name:    (orderType === 'DELIVERY' ? selectedAddress?.fullName : null) || user.name || '',
          contact: ((orderType === 'DELIVERY' ? selectedAddress?.phone : null) || user.phone || '').replace(/\D/g, '').slice(-10),
          email:   user.email || '',
        },
        theme: { color: '#E11A22' },
        modal: {
          confirm_close: true,
          ondismiss: () => { setIsPlacing(false); },
        },
        handler: () => {
          clearCart();
          router.push(`/orders/${orderId}`);
        },
      });

      rzp.open();

    } catch (err: any) {
      console.error('[Checkout] handlePlaceOrder error:', err);
      setCheckoutError(err?.message || 'Something went wrong. Please try again.');
      setIsPlacing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[75vh] bg-[#F8F9FA] flex flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540]">Your cart is empty</h1>
        <p className="mt-2 text-sm text-gray-500 max-w-md">
          Please add items to your cart before proceeding to checkout.
        </p>
        <Link
          href="/categories"
          className="mt-6 px-6 py-3 rounded-xl bg-[#E11A22] hover:bg-[#c8141b] text-white text-sm font-bold shadow-sm transition-all"
        >
          Explore Products
        </Link>
      </div>
    );
  }

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
            <Link href="/cart" className="hover:text-[#E11A22] transition-colors">
              Cart
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-semibold text-gray-900">Checkout</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540] tracking-tight mb-6">
          Checkout & Order Confirmation
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Delivery Address, Slot, Payment (8 cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Min order value warning banner if applicable (Home Delivery only) */}
            {orderType === 'DELIVERY' && isBelowMinOrder && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 text-xs">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold">Minimum order value for home delivery is ₹{deliverySettings.min_order_value}</p>
                  <p className="text-amber-700 mt-0.5">
                    Add items worth ₹{deliverySettings.min_order_value - itemTotal} more, or switch to <strong>Store Pickup (Takeaway)</strong> with no minimum order.
                  </p>
                </div>
              </div>
            )}

            {/* Account / Login Required Card */}
            {!user.isVerified ? (
              <div className="bg-gradient-to-r from-red-50/90 to-orange-50/90 rounded-2xl border-2 border-[#E11A22]/20 p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E11A22] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-[#0A2540]">
                        Login Required to Confirm Order
                      </h3>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-[#E11A22] text-white px-2 py-0.5 rounded-full">
                        Required
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Please log in with your mobile number via OTP. Your orders, delivery addresses, and tracking will be securely saved to your account.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-[#0A2540] hover:bg-[#123154] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                >
                  Login with OTP
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 font-medium">Ordering as</p>
                    <p className="font-extrabold text-xs text-[#0A2540]">
                      {user.name || "Customer"} <span className="font-medium text-gray-500">({user.phone})</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Order Fulfillment Mode: Home Delivery vs Store Pickup (Takeaway) */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-2 sm:p-2.5 shadow-2xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('DELIVERY')}
                  className={`flex items-center justify-center gap-2.5 py-3 px-3 sm:px-4 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
                    orderType === 'DELIVERY'
                      ? 'bg-[#E11A22] text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>Home Delivery</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType('PICKUP')}
                  className={`flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
                    orderType === 'PICKUP'
                      ? 'bg-[#E11A22] text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Store Pickup (Takeaway)</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    orderType === 'PICKUP' ? 'bg-white text-[#E11A22]' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    FREE
                  </span>
                </button>
              </div>

              {orderType === 'PICKUP' ? (
                <div className="mt-2.5 px-3 py-2 bg-emerald-50/80 border border-emerald-100 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🛍️</span>
                    <span>Self-pickup directly from store counter. <strong>Zero delivery charges</strong> &amp; no distance limits.</span>
                  </div>
                </div>
              ) : (
                <div className="mt-2.5 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-gray-500" />
                    <span>Delivered safely to your doorstep within your selected delivery slot.</span>
                  </div>
                </div>
              )}
            </div>

            {/* 1. Delivery Address Card (Delivery) OR Store Location Card (Pickup) */}
            {orderType === 'DELIVERY' ? (
              <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-[#E11A22] font-black text-xs flex items-center justify-center">
                      1
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-[#0A2540]">
                      Delivery Address
                    </h2>
                  </div>

                  {!showNewAddressForm && (
                    <button
                      onClick={() => setShowNewAddressForm(true)}
                      className="text-xs font-bold text-[#E11A22] hover:text-[#c8141b] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Address</span>
                    </button>
                  )}
                </div>

                {/* Address List */}
                {addresses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addresses.map((addr) => {
                      const isSelected = selectedAddress?.id === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddress(addr)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-[#E11A22] bg-red-50/40 shadow-xs"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded ${
                              isSelected ? "bg-[#E11A22] text-white" : "bg-gray-100 text-gray-700"
                            }`}>
                              {addr.label}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-[#E11A22]" />
                            )}
                          </div>
                          <p className="text-xs font-bold text-gray-900">{addr.fullName} • {addr.phone}</p>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                            {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city} - {addr.pincode}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                    <p className="font-bold">No delivery address saved yet</p>
                    <p className="text-gray-600 mt-0.5">Please add your delivery address below to complete checkout.</p>
                  </div>
                )}


                {/* New Address Form */}
                {(showNewAddressForm || addresses.length === 0) && (
                  <form onSubmit={handleSaveAddress} className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-[#0A2540] uppercase">Add New Delivery Location</h3>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowNewAddressForm(false)}
                          className="text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {(["Home", "Work", "Other"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setNewLabel(t)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                            newLabel === t
                              ? "border-[#E11A22] bg-[#E11A22] text-white"
                              : "border-gray-300 bg-white text-gray-700"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Receiver Full Name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        required
                        className="p-2.5 text-xs bg-white border border-gray-300 rounded-lg"
                      />
                      <input
                        type="tel"
                        placeholder="10-digit Phone Number"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        required
                        className="p-2.5 text-xs bg-white border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="House / Flat / Block (Line 1)"
                        value={newLine1}
                        onChange={(e) => setNewLine1(e.target.value)}
                        required
                        className="p-2.5 text-xs bg-white border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Colony / Area / Landmark (Line 2)"
                        value={newLine2}
                        onChange={(e) => setNewLine2(e.target.value)}
                        className="p-2.5 text-xs bg-white border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="City"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        required
                        className="p-2.5 text-xs bg-white border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Pincode"
                        value={newPincode}
                        onChange={(e) => setNewPincode(e.target.value)}
                        required
                        className="p-2.5 text-xs bg-white border border-gray-300 rounded-lg"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-[#0A2540] hover:bg-[#123154] text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Save &amp; Deliver Here
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* Store Pickup Location Card */
              <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-[#E11A22] font-black text-xs flex items-center justify-center">
                      1
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-[#0A2540]">
                        Pickup Store Location
                      </h2>
                      <p className="text-xs text-gray-500">
                        Collect your packaged items directly from this K MART branch
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Self-Pickup</span>
                  </span>
                </div>

                {/* Selected Pickup Store Details Card */}
                <div className="p-4 sm:p-5 rounded-xl border-2 border-[#E11A22] bg-red-50/20 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E11A22] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-sm text-[#0A2540]">
                            {activeStore?.name || "K MART Express - Vishal Nagar"}
                          </h3>
                          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                            Open Now
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {activeStore?.address || "Shop 1-4, Ground Floor, Vishal Nagar, Pimple Nilakh, Pune - 411027"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                          Store Hours: 8:00 AM – 10:00 PM (Daily) • Distance: ~{storeDistanceKm} km
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-red-100 flex items-center justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1.5 font-medium text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Show Order Number at counter to pick up
                    </span>
                    <span className="font-black text-[#E11A22]">
                      ₹0 Delivery Fee
                    </span>
                  </div>
                </div>

                {/* Store Switcher (if multiple stores available) */}
                {stores && stores.length > 1 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-700 mb-2">Or choose a different branch:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {stores.map((s) => {
                        const isCurrent = activeStore?.id === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setActiveStore(s)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isCurrent
                                ? "border-[#E11A22] bg-red-50/50 shadow-2xs"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            <p className="text-xs font-bold text-[#0A2540]">{s.name}</p>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">{s.address}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Delivery Slot Card (Delivery only - 1 Day Morning/Evening) */}
            {orderType === 'DELIVERY' && (
              <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-[#E11A22] font-black text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-lg font-black text-[#0A2540]">
                          Delivery Slot
                        </h2>
                        <span className="text-[10px] font-extrabold uppercase bg-red-100 text-[#E11A22] px-2 py-0.5 rounded-full">
                          {selectedSlot?.dayLabel || 'Today'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Choose your delivery slot for {selectedSlot?.dayLabel || 'Today'} • Fulfilled by {activeStore?.name || "nearest K MART store"}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-gray-500">
                    2 Daily Slots
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(daySlots.length > 0 ? daySlots : deliverySlots)
                    .filter((slot) => !slot.name.toLowerCase().includes('test'))
                    .map((slot) => {
                      const isSelected = selectedSlot?.id === slot.id || selectedSlot?.name === slot.name;

                      return (
                        <div
                          key={slot.id}
                          onClick={() => {
                            if (slot.isAvailable) {
                              setSelectedSlot(slot);
                            }
                          }}
                          className={`p-3.5 rounded-xl border-2 transition-all flex items-center justify-between ${
                            !slot.isAvailable
                              ? "opacity-50 border-gray-200 bg-gray-50 cursor-not-allowed"
                              : isSelected
                              ? "border-[#E11A22] bg-red-50/40 shadow-xs cursor-pointer"
                              : "border-gray-200 hover:border-gray-300 bg-white cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Clock className={`w-4 h-4 ${isSelected ? "text-[#E11A22]" : "text-gray-400"}`} />
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-bold text-gray-900">
                                  {slot.name.endsWith('Slot') ? slot.name : `${slot.name} Slot`}
                                </p>
                                {slot.unavailableReason && (
                                  <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded-full">
                                    {slot.unavailableReason}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {slot.time} • {deliveryFee === 0 ? "Free delivery" : `₹${deliveryFee} delivery`}
                              </p>
                            </div>
                          </div>

                          {isSelected && slot.isAvailable && (
                            <CheckCircle2 className="w-4 h-4 text-[#E11A22]" />
                          )}
                        </div>
                      );
                    })}
                </div>

                {/* Selection Summary Pill */}
                {selectedSlot && selectedSlot.isAvailable && (
                  <div className="p-3 bg-red-50/60 border border-red-200/80 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#E11A22] shrink-0" />
                      <div>
                        <span className="font-bold text-gray-900">
                          Scheduled for: {selectedSlot.dayLabel || 'Today'} ({selectedSlot.name} Slot)
                        </span>
                        <span className="text-gray-600 ml-1.5">
                          Window: {selectedSlot.time}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {daySlots.length > 0 && daySlots.every((s) => !s.isAvailable) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      All delivery slots for today are currently closed. Please switch to Store Pickup (Takeaway) to pick up your order directly from the store.
                    </span>
                  </div>
                )}

              </div>
            )}

            {/* Payment Method Card */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-full bg-red-50 text-[#E11A22] font-black text-xs flex items-center justify-center">
                  {orderType === 'PICKUP' ? '2' : '3'}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#0A2540]">
                    Payment Method
                  </h2>
                  <p className="text-xs text-gray-500">
                    Choose your preferred payment method
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Cash / Counter */}
                <div
                  onClick={() => setPaymentMethod("Cash on Delivery")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === "Cash on Delivery"
                      ? "border-[#E11A22] bg-red-50/40 shadow-xs"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {orderType === 'PICKUP' ? "Pay at Store Counter" : "Cash on Delivery (COD)"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {orderType === 'PICKUP'
                          ? "Pay via cash, UPI, or card at the pickup counter when collecting your package"
                          : "Pay via cash or UPI to delivery executive at doorstep"}
                      </p>
                    </div>
                  </div>
                  {paymentMethod === "Cash on Delivery" && (
                    <CheckCircle2 className="w-5 h-5 text-[#E11A22]" />
                  )}
                </div>

                {/* Razorpay Online */}
                <div
                  onClick={() => setPaymentMethod("Razorpay")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === "Razorpay"
                      ? "border-[#E11A22] bg-red-50/40 shadow-xs"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">UPI / Cards / Net Banking</p>
                      <p className="text-xs text-gray-500">Instant online checkout via Razorpay Gateway</p>
                    </div>
                  </div>
                  {paymentMethod === "Razorpay" && (
                    <CheckCircle2 className="w-5 h-5 text-[#E11A22]" />
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs space-y-4">
              <h2 className="font-black text-sm text-[#0A2540] uppercase tracking-wider">
                Order Summary ({cartCount} Items)
              </h2>

              {/* Items scroll */}
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 pr-1">
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-11 h-11 shrink-0 aspect-square rounded-lg bg-[#F8F9FA] border border-gray-200/80 overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate max-w-[170px]">
                          {product.name}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {product.weight} × {quantity}
                        </p>
                      </div>
                    </div>

                    <span className="font-black text-gray-900 shrink-0">
                      ₹{product.price * quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs border-t border-gray-100 pt-3">
                <div className="flex justify-between text-gray-600">
                  <span>Item Total</span>
                  <span className="font-semibold text-gray-900">₹{itemTotal}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className={orderType === 'PICKUP' || deliveryFee === 0 ? "font-bold text-emerald-700 uppercase" : "font-bold text-gray-900"}>
                    {orderType === 'PICKUP'
                      ? "FREE (Store Pickup)"
                      : deliveryFee === 0
                      ? (customerOrderCount < 3 ? `FREE (Order ${customerOrderCount + 1} of 3 Offer)` : "FREE")
                      : `₹${deliveryFee}`}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Handling Charges</span>
                  <span className={handlingFee === 0 ? "font-bold text-emerald-700 uppercase" : "font-bold text-gray-900"}>
                    {handlingFee === 0 ? "FREE" : `₹${handlingFee}`}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee</span>
                  <span className={platformFee === 0 ? "font-bold text-emerald-700 uppercase" : "font-bold text-gray-900"}>
                    {platformFee === 0 ? "FREE" : `₹${platformFee}`}
                  </span>
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t border-gray-200 text-base text-[#0A2540]">
                  <span className="font-black">Total Payable</span>
                  <span className="font-black text-2xl">₹{totalAmount}</span>
                </div>
              </div>

              {/* Checkout error from backend */}
              {checkoutError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* Place Order CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacing || (orderType === 'DELIVERY' && (isBelowMinOrder || (!isDeliverable && storeDistanceKm > 5)))}
                className="w-full bg-[#E11A22] hover:bg-[#c8141b] disabled:bg-gray-400 text-white font-black py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                {isPlacing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {paymentMethod === "Razorpay" ? "Opening Razorpay Gateway..." : "Placing Your Order..."}
                  </span>
                ) : orderType === 'DELIVERY' && !isDeliverable && storeDistanceKm > 5 ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span>Outside 5km Delivery Radius ({storeDistanceKm} km)</span>
                  </>
                ) : !user.isVerified ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Login to Place Order • ₹{totalAmount}</span>
                  </>
                ) : orderType === 'PICKUP' ? (
                  paymentMethod === "Razorpay" ? (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay ₹{totalAmount} & Pick up at Store</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Confirm Store Pickup • ₹{totalAmount}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )
                ) : paymentMethod === "Razorpay" ? (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay ₹{totalAmount} with Razorpay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Banknote className="w-4 h-4" />
                    <span>Confirm COD Order • ₹{totalAmount}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      </div>



    </div>
  );
}
