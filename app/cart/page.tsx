"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Truck, 
  MapPin, 
  ShieldCheck, 
  ChevronRight,
  Info,
  ArrowLeft,
  Lock
} from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function CartPage() {
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
    updateQuantity,
    removeFromCart,
    clearCart,
    selectedAddress,
    setIsLocationOpen,
    user,
    setIsAuthOpen,
    customerOrderCount,
    setIsCartOpen
  } = useApp();

  useEffect(() => {
    setIsCartOpen(true);
    router.replace('/?open=cart');
  }, [router, setIsCartOpen]);

  if (cart.length === 0) {
    return (
      <div className="min-h-[75vh] bg-[#F8F9FA] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-24 h-24 bg-red-50 text-[#E11A22] rounded-full flex items-center justify-center mb-5 shadow-inner">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540]">Your Cart is Empty</h1>
        <p className="mt-2 text-sm text-gray-500 max-w-md">
          Looks like you haven't added anything to your cart yet. Explore our fresh grocery aisles and daily essentials!
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-[#0A2540] hover:bg-[#123154] text-white text-sm font-bold shadow-sm transition-all"
          >
            Go to Home
          </Link>
          <Link
            href="/categories"
            className="px-6 py-3 rounded-xl bg-[#E11A22] hover:bg-[#c8141b] text-white text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>Start Shopping</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
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
            <span className="font-semibold text-gray-900">Shopping Cart</span>
          </div>

          <Link
            href="/categories"
            className="flex items-center gap-1 text-xs font-bold text-[#E11A22] hover:text-[#c8141b] transition-colors"
          >
            <span>+ Add more items</span>
          </Link>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Page Title & Items counter */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540] tracking-tight">
              My Shopping Cart
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Review your items and proceed to secure checkout
            </p>
          </div>

          <button
            onClick={clearCart}
            className="text-xs font-bold text-gray-500 hover:text-[#E11A22] transition-colors p-2 rounded-lg hover:bg-red-50 flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Cart</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items & Delivery Address (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Delivery address banner */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#E11A22] shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  {selectedAddress ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          Deliver to:
                        </span>
                        <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                          {selectedAddress.label}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#0A2540] mt-0.5 truncate max-w-md">
                        {selectedAddress.line1}{selectedAddress.line2 ? `, ${selectedAddress.line2}` : ''}, {selectedAddress.city} - {selectedAddress.pincode}
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                        No delivery address set
                      </span>
                      <p className="text-sm text-gray-600 mt-0.5">
                        Please set your delivery address to see accurate delivery slots
                      </p>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => setIsLocationOpen(true)}
                className="text-xs font-bold text-[#E11A22] hover:text-[#c8141b] border border-red-200 hover:border-[#E11A22] bg-red-50 px-3.5 py-2 rounded-xl transition-all cursor-pointer shrink-0"
              >
                {selectedAddress ? 'Change' : 'Set Address'}
              </button>
            </div>

            {/* Savings Notice */}
            {discount > 0 && (
              <div className="bg-gradient-to-r from-red-500 to-[#E11A22] text-white p-3.5 rounded-2xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎉</span>
                  <p className="text-xs sm:text-sm font-bold">
                    You're saving ₹{discount} on this order!
                  </p>
                </div>
                <span className="text-[11px] font-extrabold bg-white text-[#E11A22] px-2.5 py-0.5 rounded-full uppercase">
                  Super Saver
                </span>
              </div>
            )}

            {/* Items List */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs divide-y divide-gray-100 overflow-hidden">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/product/${product.id}`}
                      className="w-20 h-20 shrink-0 aspect-square rounded-xl bg-[#F8F9FA] border border-gray-200/80 overflow-hidden group"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </Link>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {product.brand}
                      </span>
                      <Link
                        href={`/product/${product.id}`}
                        className="font-bold text-sm sm:text-base text-gray-900 hover:text-[#E11A22] transition-colors block leading-snug line-clamp-2"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">
                        {product.weight}
                      </p>

                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="font-extrabold text-base text-[#0A2540]">
                          ₹{product.price}
                        </span>
                        {product.originalPrice > product.price && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{product.originalPrice}
                          </span>
                        )}
                        {product.discountPercent > 0 && (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                            {product.discountPercent}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                    {/* Stepper +/- */}
                    <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-9 text-center font-extrabold text-xs text-gray-800">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <span className="font-black text-base text-[#0A2540] block">
                        ₹{product.price * quantity}
                      </span>
                    </div>

                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="p-2 text-gray-400 hover:text-[#E11A22] rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Offer Notice: First 3 Deliveries FREE - only show if user has free deliveries remaining */}
            {deliveryFee === 0 && customerOrderCount < 3 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-extrabold text-emerald-950">Special Offer: First 3 Deliveries Are 100% FREE!</p>
                    <p className="text-emerald-700 text-[11px] mt-0.5">
                      Order {customerOrderCount + 1} of 3 • Zero delivery charge automatically applied.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-white border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
                  Auto-Applied
                </span>
              </div>
            ) : customerOrderCount >= 3 ? (
              <div className="p-4 bg-gray-50 border border-gray-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-extrabold text-gray-900">Standard Delivery Charges</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      You have completed 3+ orders. ₹{deliveryFee} delivery fee applied.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-gray-600 bg-white border border-gray-200 px-2.5 py-1 rounded-full shrink-0">
                  Applied
                </span>
              </div>
            ) : null}

          </div>

          {/* Right Column: Order Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Bill Details */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs space-y-3">
              <h2 className="font-black text-sm text-[#0A2540] uppercase tracking-wider">
                Bill Details
              </h2>

              <div className="space-y-2 text-xs divide-y divide-gray-100 pt-1">
                <div className="flex justify-between text-gray-600 pt-1">
                  <span>Item Total ({cartCount} items)</span>
                  <span className="font-semibold text-gray-900">₹{itemTotal}</span>
                </div>


                <div className="flex justify-between text-gray-600 pt-2">
                  <span className="flex items-center gap-1">
                    <span>Delivery Fee</span>
                    <Info className="w-3 h-3 text-gray-400" />
                  </span>
                  <span className={deliveryFee === 0 ? "font-bold text-emerald-700 uppercase" : "font-bold text-gray-900"}>
                    {deliveryFee === 0 ? (customerOrderCount < 3 ? `FREE (Order ${customerOrderCount + 1} of 3 Offer)` : "FREE") : `₹${deliveryFee}`}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600 pt-2">
                  <span className="flex items-center gap-1">
                    <span>Handling Charges</span>
                    <Info className="w-3 h-3 text-gray-400" />
                  </span>
                  <span className={handlingFee === 0 ? "font-bold text-emerald-700 uppercase" : "font-bold text-gray-900"}>
                    {handlingFee === 0 ? "FREE" : `₹${handlingFee}`}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600 pt-2">
                  <span className="flex items-center gap-1">
                    <span>Platform Fee</span>
                    <Info className="w-3 h-3 text-gray-400" />
                  </span>
                  <span className={platformFee === 0 ? "font-bold text-emerald-700 uppercase" : "font-bold text-gray-900"}>
                    {platformFee === 0 ? "FREE" : `₹${platformFee}`}
                  </span>
                </div>

                <div className="flex justify-between items-baseline pt-3 text-base text-[#0A2540]">
                  <span className="font-extrabold">Total Amount</span>
                  <span className="font-black text-2xl">₹{totalAmount}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    if (!user.isVerified) {
                      setIsAuthOpen(true);
                    } else {
                      router.push("/checkout");
                    }
                  }}
                  className="w-full bg-[#E11A22] hover:bg-[#c8141b] text-white font-black py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  {!user.isVerified ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Login to Checkout</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-gray-500 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Safe & Secure Payments Guaranteed</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
