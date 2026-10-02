'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Truck, 
  ShoppingBag,
  Lock 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CartDrawer: React.FC = () => {
  const router = useRouter();
  const { 
    isCartOpen, 
    setIsCartOpen, 
    setIsCheckoutOpen,
    cart, 
    cartCount, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    itemTotal,
    discount,
    deliveryFee,
    handlingFee,
    platformFee,
    totalAmount,
    user,
    setIsAuthOpen,
    customerOrderCount
  } = useApp();

  // Close on Escape key press (called unconditionally before early return)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
      }
    };
    if (isCartOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    if (!user.isVerified) {
      setIsAuthOpen(true);
    } else {
      setIsCheckoutOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div 
        onClick={() => setIsCartOpen(false)}
        className="fixed inset-0 cursor-pointer"
        aria-label="Close cart backdrop"
      />

      {/* Centered Modal Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] text-left animate-in zoom-in-95 duration-200"
      >
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0A2540]">
              Your Cart
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-gray-400 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer mr-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-3 py-1 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          

          {/* Cart Empty State */}
          {cart.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-red-50 text-[#E11A22] flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-base text-gray-900">Your cart is empty</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Your basket looks a bit lonely! Explore staples, snacks, dairy and daily essentials.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="bg-[#E11A22] text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-[#c8141b] transition-all cursor-pointer shadow-sm"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-3">
                {cart.map(({ product, quantity }) => (
                  <div 
                    key={product.id}
                    className="p-3 bg-white rounded-xl border border-gray-200/90 shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="w-14 h-14 shrink-0 aspect-square rounded-xl bg-[#F8F9FA] border border-gray-200/80 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-gray-900 truncate leading-snug">
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-gray-500">{product.weight}</p>
                      
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="font-black text-xs text-[#0A2540]">
                          ₹{product.price * quantity}
                        </span>
                        {product.originalPrice > product.price && (
                          <span className="text-[10px] text-gray-400 line-through">
                            ₹{product.originalPrice * quantity}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center bg-gray-100 rounded-lg px-1 py-1">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-5 h-5 flex items-center justify-center hover:bg-gray-200 rounded text-gray-700 cursor-pointer"
                        aria-label="Decrease"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-black text-xs text-gray-900 select-none">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="w-5 h-5 flex items-center justify-center hover:bg-gray-200 rounded text-gray-700 cursor-pointer"
                        aria-label="Increase"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/80 space-y-2 text-xs">
                <h4 className="font-bold text-gray-900 uppercase text-[11px]">Bill Details</h4>
                <div className="flex justify-between text-gray-600">
                  <span>Item Total</span>
                  <span>₹{itemTotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? <strong className="text-emerald-700">{customerOrderCount < 3 ? `FREE (Order ${customerOrderCount + 1} of 3)` : 'FREE'}</strong> : <strong className="text-gray-900 font-bold">₹{deliveryFee}</strong>}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Handling Charges</span>
                  <span>{handlingFee === 0 ? <strong className="text-emerald-700">FREE</strong> : <strong className="text-gray-900 font-bold">₹{handlingFee}</strong>}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee</span>
                  <span>{platformFee === 0 ? <strong className="text-emerald-700">FREE</strong> : <strong className="text-gray-900 font-bold">₹{platformFee}</strong>}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-black text-sm text-[#0A2540]">
                  <span>To Pay</span>
                  <span className="text-base">₹{totalAmount}</span>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Bottom Checkout CTA */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-white space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
              <span>Grand Total</span>
              <span className="text-base font-black text-[#0A2540]">₹{totalAmount}</span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-28 py-2.5 border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 rounded-lg transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="flex-1 py-2.5 bg-[#E11A22] hover:bg-[#c8141b] text-white text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm"
              >
                {!user.isVerified ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Login to Checkout</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
