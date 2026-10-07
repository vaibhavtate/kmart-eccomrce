'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Plus, Minus, Star, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { 
    cart, 
    addToCart, 
    updateQuantity, 
    wishlist, 
    toggleWishlist 
  } = useApp();

  const cartItem = cart.find(item => item.product.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const isWishlisted = wishlist.includes(product.id);

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between p-3 relative group">
      
      {/* Top right: Wishlist heart */}
      <div className="flex items-center justify-end mb-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-[#E11A22] transition-colors cursor-pointer"
          aria-label="Add to Wishlist"
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? 'fill-[#E11A22] text-[#E11A22]' : 'text-gray-400'
            }`} 
          />
        </button>
      </div>

      {/* Product Image Clickable Link with strict uniform aspect ratio */}
      <Link
        href={`/product/${product.id}`}
        className="w-full aspect-square relative flex items-center justify-center mb-2 cursor-pointer bg-[#F8F9FA] rounded-xl overflow-hidden group"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover transform group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </Link>

      {/* Product Details */}
      <div className="text-left space-y-1">
        {/* Store & Category tag */}
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
          {product.storeTag || `K MART | ${product.category?.toUpperCase() || 'GROCERIES'}`}
        </span>

        {/* Product Name */}
        <Link
          href={`/product/${product.id}`}
          className="font-bold text-xs sm:text-sm text-gray-900 hover:text-[#E11A22] transition-colors line-clamp-1 block"
          title={product.name}
        >
          {product.name}
        </Link>

        {/* Weight */}
        <p className="text-[11px] font-medium text-gray-500">
          {product.weight}
        </p>

        {/* Rating & Stock */}
        <div className="flex items-center gap-1.5 text-[11px] pt-0.5">
          <div className="flex items-center text-amber-500">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
            <span className="font-bold text-gray-700">{product.rating || 4.5}</span>
          </div>
          <span className="text-gray-300">•</span>
          <span className="text-emerald-600 font-semibold">In stock</span>
        </div>

        {/* Price Row */}
        <div className="flex items-baseline gap-2 pt-1 flex-wrap">
          <span className="font-black text-sm sm:text-base text-[#E11A22]">
            ₹{product.price}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-xs text-gray-400 line-through">
              ₹{product.originalPrice}
            </span>
          )}
          {product.discountPercent > 0 && (
            <span className="bg-red-50 text-[#E11A22] text-[10px] font-bold px-1.5 py-0.2 rounded">
              {product.discountPercent}% OFF
            </span>
          )}
        </div>
      </div>

      {/* Purchase Limit & Add to Cart button */}
      <div className="mt-2.5 pt-2 border-t border-gray-100 space-y-2">
        <p className="text-[10px] text-gray-400 font-medium flex items-center justify-center gap-1">
          <ShoppingBag className="w-3 h-3" />
          <span>Maximum purchase • {product.maxPurchaseUnits || 24} units</span>
        </p>

        {quantity === 0 ? (
          <button
            onClick={() => addToCart(product, 1)}
            className="w-full py-1.5 border border-[#E11A22] text-[#E11A22] hover:bg-red-50 font-bold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center"
          >
            ADD +
          </button>
        ) : (
          <div className="flex items-center justify-between border border-[#E11A22] bg-[#E11A22] rounded-lg text-white font-bold text-xs sm:text-sm overflow-hidden">
            <button
              onClick={() => updateQuantity(product.id, quantity - 1)}
              className="px-3 py-1.5 hover:bg-[#c8141b] transition-colors cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-2">{quantity}</span>
            <button
              onClick={() => updateQuantity(product.id, quantity + 1)}
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
};
