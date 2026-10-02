'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Plus, Minus } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TopDealsSection: React.FC = () => {
  const { products, cart, addToCart, updateQuantity } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Top discounted products matching screenshot deals
  const dealProducts = [...products]
    .filter(p => p.discountPercent > 0)
    .sort((a, b) => b.discountPercent - a.discountPercent)
    .slice(0, 10);

  if (dealProducts.length === 0) return null;

  return (
    <section>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <p className="text-[11px] font-bold text-[#E11A22] uppercase tracking-wider mb-0.5">
            TODAY'S TOP DEALS
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0A2540] tracking-tight">
            Offer Products — Grab &amp; Save
          </h2>
        </div>

        <Link
          href="/categories"
          className="text-xs sm:text-sm font-bold text-[#E11A22] hover:text-[#c8141b] flex items-center gap-0.5 cursor-pointer group"
        >
          <span>View All Deals</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Horizontal Scrolling Cards */}
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-2"
      >
        {dealProducts.map((product) => {
          const cartItem = cart.find(i => i.product.id === product.id);
          const qty = cartItem?.quantity ?? 0;

          return (
            <div
              key={product.id}
              className="shrink-0 w-44 sm:w-48 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between p-3 relative group"
            >
              {/* Discount Badge */}
              <span className="absolute top-2 left-2 z-10 bg-[#E11A22] text-white text-[10px] font-black px-2 py-0.5 rounded-sm">
                {product.discountPercent}% OFF
              </span>

              {/* Product Image Link */}
              <Link 
                href={`/product/${product.id}`} 
                className="w-full aspect-square relative flex items-center justify-center my-1 bg-[#F8F9FA] rounded-xl overflow-hidden group cursor-pointer"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                />
              </Link>

              {/* Product Info */}
              <div className="space-y-1 text-left mt-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
                  {product.storeTag || `K MART • ${product.category?.toUpperCase() || 'GROCERIES'}`}
                </p>

                <Link
                  href={`/product/${product.id}`}
                  className="text-xs sm:text-sm font-bold text-gray-900 hover:text-[#E11A22] transition-colors line-clamp-1 block"
                  title={product.name}
                >
                  {product.name}
                </Link>

                <p className="text-[11px] text-gray-500 font-medium">
                  {product.weight}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className="text-sm sm:text-base font-black text-[#0A2540]">
                    ₹{product.price}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="text-xs text-gray-400 line-through">
                      ₹{product.originalPrice}
                    </span>
                  )}
                </div>
              </div>

              {/* Add to Cart button */}
              <div className="mt-3">
                {qty === 0 ? (
                  <button
                    onClick={() => addToCart(product, 1)}
                    className="w-full py-1.5 border border-[#E11A22] text-[#E11A22] hover:bg-red-50 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center"
                  >
                    ADD +
                  </button>
                ) : (
                  <div className="flex items-center justify-between border border-[#E11A22] bg-[#E11A22] rounded-lg text-white font-bold text-xs overflow-hidden">
                    <button
                      onClick={() => updateQuantity(product.id, qty - 1)}
                      className="px-3 py-1.5 hover:bg-[#c8141b] transition-colors cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2">{qty}</span>
                    <button
                      onClick={() => updateQuantity(product.id, qty + 1)}
                      className="px-3 py-1.5 hover:bg-[#c8141b] transition-colors cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
};
