'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin, ChevronDown, CheckCircle2, AlertCircle, ShoppingBag, Truck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useRouter } from 'next/navigation';
import { deliveryService } from '../services/delivery';
import { cartService } from '../services/cart';
import { customerService } from '../services/customers';
import { supabase } from '../lib/supabase/client';
import confetti from 'canvas-confetti';
import { DeliverySlotItem, Order } from '../types';

export const CheckoutModal: React.FC = () => {
  const router = useRouter();
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    cartCount,
    itemTotal,
    discount,
    deliveryFee,
    totalAmount,
    selectedAddress,
    addresses,
    setSelectedAddress,
    deliverySettings,
    deliverySlots,
    selectedSlot,
    setSelectedSlot,
    activeStore,
    storeDistanceKm,
    isDeliverable,
    orderType,
    currentCustomer,
    user,
    placeOrder,
    addOrder,
    clearCart,
  } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'Razorpay'>('Cash on Delivery');
  const [isPlacing, setIsPlacing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [locationChecked, setLocationChecked] = useState(false);
  const [distanceText, setDistanceText] = useState('Location not checked yet');

  // ── DB-fresh prices ──────────────────────────────────────────────────────
  // Map of product_id → selling_price fetched live from Supabase
  const [dbPrices, setDbPrices] = useState<Record<string, number>>({});
  const [isFetchingPrices, setIsFetchingPrices] = useState(false);

  // Load real slots when modal opens or sync with context
  const [modalSlots, setModalSlots] = useState<DeliverySlotItem[]>(deliverySlots);

  useEffect(() => {
    if (deliverySlots && deliverySlots.length > 0) {
      setModalSlots(deliverySlots);
    }
  }, [deliverySlots]);

  useEffect(() => {
    if (isCheckoutOpen) {
      deliveryService.getAvailableSlots(activeStore?.id).then((slots) => {
        if (slots && slots.length > 0) {
          setModalSlots(slots);
          const isMatch = slots.find(
            (s) => (s.id === selectedSlot?.id && s.date === selectedSlot?.date && s.isAvailable)
          );
          if (isMatch) {
            setSelectedSlot(isMatch);
          } else {
            const firstAvail = slots.find((s) => s.isAvailable) || slots[0];
            if (firstAvail) setSelectedSlot(firstAvail);
          }
        }
      });
    }
  }, [isCheckoutOpen, activeStore?.id]);

  // ── Fetch DB prices for every cart item when modal opens ─────────────────
  useEffect(() => {
    if (!isCheckoutOpen || cart.length === 0) return;
    const ids = cart.map((item) => item.product.id);
    setIsFetchingPrices(true);
    supabase
      .from('products')
      .select('id, selling_price')
      .in('id', ids)
      .then(({ data, error }) => {
        if (!error && data) {
          const map: Record<string, number> = {};
          data.forEach((row: { id: string; selling_price: number }) => {
            map[row.id] = Number(row.selling_price);
          });
          setDbPrices(map);
        }
        setIsFetchingPrices(false);
      });
  }, [isCheckoutOpen, cart]);

  if (!isCheckoutOpen) return null;

  // Use DB prices if available, otherwise fall back to cached cart prices
  const dbItemTotal = cart.reduce(
    (sum, item) =>
      sum + ((dbPrices[item.product.id] ?? item.product.price) * item.quantity),
    0
  );
  const dbDeliveryFee = deliveryFee; // delivery fee calculation stays the same
  const dbTotalAmount = dbItemTotal + dbDeliveryFee;

  const isBelowMinOrder = dbItemTotal < deliverySettings.min_order_value;

  const handleUseMyLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setDistanceText('Detecting…');
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationChecked(true);
          setDistanceText(`~${storeDistanceKm} km from store`);
        },
        () => {
          setLocationChecked(true);
          setDistanceText(`~${storeDistanceKm} km from store`);
        }
      );
    } else {
      setLocationChecked(true);
      setDistanceText(`~${storeDistanceKm} km from store`);
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || isPlacing) return;
    setCheckoutError(null);

    if (orderType === 'DELIVERY') {
      if (!selectedAddress) {
        setCheckoutError('Please add a delivery address from the full checkout page.');
        return;
      }
      if (isBelowMinOrder) {
        setCheckoutError(`Minimum order ₹${deliverySettings.min_order_value} for delivery. Add more items.`);
        return;
      }
    }

    setIsPlacing(true);
    try {
      // Attempt edge function checkout (same as /checkout page)
      let customerId = currentCustomer?.id;
      if (!customerId) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const phone = session.user.phone || session.user.user_metadata?.phone || user.phone;
            const name = session.user.user_metadata?.full_name || user.name;
            if (phone) {
              const cust = await customerService.upsertCustomer(phone, name, session.user.email, session.user.id);
              if (cust?.id) customerId = cust.id;
            }
          }
        } catch {}
      }

      if (!customerId) {
        setCheckoutError("Customer account not found. Please log out and log in again.");
        setIsPlacing(false);
        return;
      }

      // Validate catalog product IDs in cart
      const invalidItems = cart.filter(
        (item) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.product.id)
      );
      if (invalidItems.length > 0) {
        setCheckoutError(
          `"${invalidItems[0].product.name}" is not currently available in the store catalog. Please remove it from your cart to proceed.`
        );
        setIsPlacing(false);
        return;
      }

      // Sync cart to DB
      const cartId = await cartService.getOrCreateCartId(customerId);
      if (!cartId) {
        setCheckoutError("Unable to access your cart in the database. Please try logging out and logging in again.");
        setIsPlacing(false);
        return;
      }
      for (const item of cart) {
        await cartService.upsertCartItem(cartId, item.product.id, item.quantity);
      }

      let chosenSlot = selectedSlot;
      const isRealUuid = (id?: string) =>
        Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

      if (orderType === 'DELIVERY') {
        if (!chosenSlot || !isRealUuid(chosenSlot.id) || !chosenSlot.isAvailable) {
          const avail = modalSlots.find((s) => s.isAvailable && isRealUuid(s.id));
          if (avail) {
            chosenSlot = avail;
            setSelectedSlot(avail);
          }
        }

        if (!chosenSlot || !isRealUuid(chosenSlot.id)) {
          setCheckoutError("No available delivery slot found. Please choose an available slot or switch to Store Pickup.");
          setIsPlacing(false);
          return;
        }

        if (!chosenSlot.isAvailable) {
          setCheckoutError(chosenSlot.unavailableReason || "The selected delivery slot is no longer available. Please select another slot.");
          setIsPlacing(false);
          return;
        }
      }

      try {
        const { data, error } = await supabase.functions.invoke('checkout', {
          body: {
            customerId,
            addressId: orderType === 'DELIVERY' ? (selectedAddress?.id ?? null) : null,
            orderType,
            pickupStoreId: orderType === 'PICKUP' ? (activeStore?.id ?? null) : null,
            deliverySlotId: orderType === 'DELIVERY' ? chosenSlot.id : null,
            scheduledDeliveryDate: orderType === 'DELIVERY' ? (chosenSlot?.date ?? null) : null,
            paymentMethod: paymentMethod === 'Cash on Delivery' ? 'COD' : 'ONLINE',
            idempotencyKey: crypto.randomUUID(),
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

        if (data?.droppedItems?.length > 0) {
          const names = data.droppedItems.map((i: any) => i.productName || i.product_name).join(', ');
          alert(`Some items were out of stock and removed from your order: ${names}`);
        }

        if (data?.order?.id) {
          const confirmedOrder = data.order;
          const newOrder: Order = {
            id: confirmedOrder.id,
            orderNumber: confirmedOrder.order_number || confirmedOrder.id,
            orderType: confirmedOrder.order_type || orderType,
            pickupStoreId: confirmedOrder.pickup_store_id || null,
            items: [...cart],
            itemTotal,
            discount,
            deliveryFee: orderType === 'PICKUP' ? 0 : deliveryFee,
            handlingFee: 0,
            platformFee: 0,
            totalAmount: confirmedOrder.total || totalAmount,
            deliveryAddress: orderType === 'PICKUP' ? null : selectedAddress,
            deliverySlot: orderType === 'PICKUP' ? { time: 'Store Hours', day: 'Today' } : {
              slotId: chosenSlot?.id,
              time: chosenSlot?.time || 'Scheduled',
              day: chosenSlot?.date || 'Today',
              date: chosenSlot?.date,
            },
            paymentMethod: paymentMethod === 'Cash on Delivery' ? 'Cash on Delivery' : 'Razorpay',
            status: confirmedOrder.status || 'Order Confirmed',
            createdAt: confirmedOrder.created_at || new Date().toISOString(),
          };

          if (paymentMethod === 'Cash on Delivery') {
            try { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); } catch {}
            addOrder(newOrder);
            clearCart();
            setIsCheckoutOpen(false);
            setIsPlacing(false);
            return;
          }

          // Razorpay online
          await new Promise<void>((resolve, reject) => {
            if ((window as any).Razorpay) { resolve(); return; }
            const s = document.createElement('script');
            s.src = 'https://checkout.razorpay.com/v1/checkout.js';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Failed to load Razorpay'));
            document.body.appendChild(s);
          });
          new (window as any).Razorpay({
            key: data.razorpayKeyId,
            order_id: data.razorpayOrderId,
            amount: Math.round(data.order.total * 100),
            currency: 'INR',
            name: 'K MART',
            description: 'Groceries Order',
            prefill: {
              name: selectedAddress?.fullName || user.name || '',
              contact: (selectedAddress?.phone || user.phone || '').replace(/\D/g, '').slice(-10),
              email: user.email || '',
            },
            theme: { color: '#E11A22' },
            modal: { confirm_close: true, ondismiss: () => setIsPlacing(false) },
            handler: (res: any) => {
              try { confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } }); } catch {}
              const paidOrder: Order = {
                ...newOrder,
                paymentId: res?.razorpay_payment_id || undefined,
              };
              addOrder(paidOrder);
              clearCart();
              setIsCheckoutOpen(false);
              setIsPlacing(false);
            },
          }).open();
          return;
        }
        } catch (callErr: any) {
          setCheckoutError(callErr?.message || 'Checkout failed. Please try again.');
          setIsPlacing(false);
          return;
        }
    } catch (err: any) {
      setCheckoutError(err?.message || 'Something went wrong. Please try again.');
      setIsPlacing(false);
    }
  };

  const deliveryCostDisplay =
    orderType === 'PICKUP'
      ? 'FREE (Store Pickup)'
      : deliveryFee === 0
      ? 'FREE'
      : `₹${deliveryFee}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100">

        {/* Scrollable inner body */}
        <div className="overflow-y-auto max-h-[90vh] p-5 sm:p-6 space-y-4 text-left">

          {/* ── Header ── */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0A2540]">Place your order</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-3 py-1 rounded-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── Store Info ── */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              {activeStore ? activeStore.name : 'K MART Baramati — Store 1'}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              9:00 AM – 8:00 PM • 096750 40003
            </span>
          </div>

          {/* ── Delivery Address ── */}
          <div>
            <label className="text-xs font-bold text-gray-900 mb-1.5 block">Delivery Address</label>
            {addresses.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedAddress?.id || ''}
                  onChange={(e) => {
                    const addr = addresses.find((a) => a.id === e.target.value);
                    if (addr) setSelectedAddress(addr);
                  }}
                  className="w-full appearance-none border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-gray-800 bg-white font-medium cursor-pointer focus:outline-none focus:border-gray-400 shadow-xs pr-8"
                >
                  {addresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.label} - {addr.line1}{addr.city ? `, ${addr.city}` : ''} {addr.pincode ?? ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <div className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-gray-800 bg-white font-medium shadow-xs">
                {selectedAddress
                  ? `${selectedAddress.label ? `${selectedAddress.label} - ` : ''}${selectedAddress.line1}${selectedAddress.city ? `, ${selectedAddress.city}` : ''} ${selectedAddress.pincode ?? ''}`
                  : 'Home - Baramati, Maharashtra 413102'}
              </div>
            )}
          </div>

          {/* ── Delivery Distance ── */}
          <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#0A2540] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#E11A22] shrink-0" />
                <span>Delivery distance</span>
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5 truncate">{distanceText}</p>
            </div>
            <button
              onClick={handleUseMyLocation}
              className="shrink-0 bg-[#E11A22] hover:bg-[#c8141b] text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              {locationChecked ? 'Location Checked ✓' : 'Use My Location'}
            </button>
          </div>

          {/* ── Delivery Slot ── */}
          <div>
            <label className="text-xs font-bold text-gray-900 mb-1.5 block">Delivery Slot</label>
            <div className="grid grid-cols-2 gap-2">
              {modalSlots
                .filter((s) => !s.name?.toLowerCase().includes('test'))
                .slice(0, 4)
                .map((slot) => {
                  const isSel =
                    (selectedSlot?.id === slot.id && selectedSlot?.date === slot.date) ||
                    (!selectedSlot?.date && selectedSlot?.id === slot.id);
                  return (
                    <button
                      key={`${slot.id}-${slot.date}-${slot.name}`}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => slot.isAvailable && setSelectedSlot(slot)}
                      className={`rounded-xl p-2.5 text-left transition-all cursor-pointer ${
                        !slot.isAvailable
                          ? 'opacity-50 border border-gray-200 bg-gray-50 cursor-not-allowed'
                          : isSel
                          ? 'border-2 border-[#E11A22] bg-white shadow-xs'
                          : 'border border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="text-[10px] text-gray-500 font-medium block">
                        {slot.dayLabel || (slot.date === new Date().toISOString().split('T')[0] ? 'Today' : 'Tomorrow')}
                      </span>
                      <span className={`text-xs font-bold block ${isSel ? 'text-[#E11A22]' : 'text-[#0A2540]'}`}>
                        {slot.time}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* ── Payment Method ── */}
          <div>
            <label className="text-xs font-bold text-gray-900 mb-1.5 block">Payment Method</label>
            <div className="relative">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full appearance-none border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-gray-800 bg-white font-medium cursor-pointer focus:outline-none focus:border-gray-400 shadow-xs pr-8"
              >
                <option value="Cash on Delivery">Cash on Delivery</option>
                <option value="Razorpay">Razorpay (UPI / Cards / NetBanking)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* ── Order Totals ── */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs">
            {/* Price mismatch warning */}
            {!isFetchingPrices && Object.keys(dbPrices).length > 0 && dbItemTotal !== itemTotal && (
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl px-3 py-2.5 mb-1">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                <span>
                  Prices updated from store — cart total adjusted from ₹{itemTotal} to ₹{dbItemTotal}.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-gray-700">
              <span className="font-medium">Item Total</span>
              {isFetchingPrices ? (
                <span className="flex items-center gap-1 text-gray-400 font-bold">
                  <span className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin inline-block" />
                  Loading…
                </span>
              ) : (
                <span className="font-bold text-gray-900">₹{dbItemTotal}</span>
              )}
            </div>

            <div className="flex items-center justify-between text-gray-700">
              <span className="font-medium">Delivery</span>
              <span className={!locationChecked && !isDeliverable ? 'text-gray-900 font-bold' : deliveryFee === 0 ? 'text-emerald-600 font-bold' : 'font-bold'}>
                {!locationChecked && !isDeliverable ? 'Unavailable' : deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </span>
            </div>

            <div className="flex items-center justify-between text-[#0A2540] font-bold text-sm border-t border-gray-100 pt-1.5">
              <span>Order Total</span>
              {isFetchingPrices ? (
                <span className="text-gray-400">—</span>
              ) : (
                <span>{!locationChecked && !isDeliverable ? '—' : `₹${dbTotalAmount}`}</span>
              )}
            </div>
          </div>

          {/* ── Validation warnings ── */}
          {orderType === 'DELIVERY' && isBelowMinOrder && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>Min order ₹{deliverySettings.min_order_value} for delivery. Add ₹{deliverySettings.min_order_value - dbItemTotal} more.</span>
            </div>
          )}

          {checkoutError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{checkoutError}</span>
            </div>
          )}

          {/* ── Action Buttons ── */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              className="w-28 py-2.5 border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 rounded-lg transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isPlacing || cart.length === 0 || (orderType === 'DELIVERY' && isBelowMinOrder)}
              className="flex-1 py-2.5 bg-[#E11A22] hover:bg-[#c8141b] disabled:bg-gray-400 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isPlacing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Placing Order…</span>
                </>
              ) : (
                <span>Place Order →</span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
