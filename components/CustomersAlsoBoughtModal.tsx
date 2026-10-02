'use client';

import React from 'react';
import { X, Plus, Minus, ShoppingBag, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';

export const CustomersAlsoBoughtModal: React.FC = () => {
  const {
    relatedProductsModal,
    closeRelatedProductsModal,
    addToCart,
    updateQuantity,
    cart,
  } = useApp();

  if (!relatedProductsModal.isOpen || relatedProductsModal.products.length === 0) {
    return null;
  }

  const { products, sourceProductName } = relatedProductsModal;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={closeRelatedProductsModal}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white w-full max-w-2xl sm:max-w-3xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-modal-in flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 text-[#E11A22] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#0A2540] tracking-tight">
                Customers also bought
              </h2>
              {sourceProductName && (
                <p className="text-xs text-gray-500 line-clamp-1">
                  Frequently paired with <span className="font-semibold text-gray-700">{sourceProductName}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={closeRelatedProductsModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors cursor-pointer"
            aria-label="Close suggestions"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggested Product Cards Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          <div
            className={`grid gap-3 sm:gap-4 ${
              products.length === 1
                ? 'grid-cols-1 max-w-xs mx-auto'
                : products.length === 2
                ? 'grid-cols-2'
                : products.length === 3
                ? 'grid-cols-2 sm:grid-cols-3'
                : 'grid-cols-2 sm:grid-cols-4'
            }`}
          >
            {products.map((product) => {
              const cartItem = cart.find((item) => item.product.id === product.id);
              const quantity = cartItem ? cartItem.quantity : 0;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-gray-200/90 hover:border-gray-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between p-3 group relative"
                >
                  {/* Product Image */}
                  <div className="w-full aspect-square relative flex items-center justify-center mb-2 bg-[#F8F9FA] rounded-xl overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="text-left space-y-0.5 flex-1 flex flex-col justify-start">
                    {product.brand && (
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                        {product.brand}
                      </span>
                    )}
                    <h3
                      className="font-bold text-xs text-gray-900 line-clamp-2 leading-tight h-8"
                      title={product.name}
                    >
                      {product.name}
                    </h3>
                    <p className="text-[10px] font-medium text-gray-500">
                      {product.weight || '1 unit'}
                    </p>
                  </div>

                  {/* Pricing & Add Button */}
                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-1">
                    <div className="text-left">
                      <div className="flex items-baseline gap-1">
                        <span className="font-black text-xs sm:text-sm text-[#0A2540]">
                          ₹{product.price}
                        </span>
                        {product.originalPrice > product.price && (
                          <span className="text-[10px] text-gray-400 line-through">
                            ₹{product.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add / Stepper Button */}
                    <div>
                      {quantity > 0 ? (
                        <div className="flex items-center bg-[#E11A22] text-white rounded-lg px-1 py-0.5 shadow-xs">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="w-5 h-5 flex items-center justify-center hover:bg-black/20 rounded transition-colors cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black text-xs px-1.5 select-none">
                            {quantity}
                          </span>
                          <button
                            onClick={() => addToCart(product, 1, { skipRelated: true })}
                            className="w-5 h-5 flex items-center justify-center hover:bg-black/20 rounded transition-colors cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product, 1, { skipRelated: true })}
                          className="bg-white hover:bg-[#E11A22] text-[#E11A22] hover:text-white border border-[#E11A22] font-black text-xs px-2.5 py-1 rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          ADD
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
          <button
            onClick={closeRelatedProductsModal}
            className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};
