'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { HeroCarousel } from '../components/HeroCarousel';
import { CategoryPills } from '../components/CategoryPills';
import { ProductCard } from '../components/ProductCard';
import { TrustBadges } from '../components/TrustBadges';
import { StoreOffersSection } from '../components/StoreOffersSection';
import { FreeDeliveryBanner } from '../components/FreeDeliveryBanner';
import { TopDealsSection } from '../components/TopDealsSection';
import { ChevronRight, ChevronDown, X } from 'lucide-react';

export default function HomePage() {
  const { 
    products, 
    categories,
    selectedCategory, 
    setSelectedCategory, 
    searchQuery,
    isLoadingProducts
  } = useApp();

  const [sortBy, setSortBy] = useState('popular');

  const activeCategoryObj = categories.find(c => c.slug === selectedCategory);
  const activeCategoryName = activeCategoryObj?.name || selectedCategory.replace(/-/g, ' ').toUpperCase();

  let filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || 
      p.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesQuery = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  if (sortBy === 'price-low') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  } else if (sortBy === 'discount') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.discountPercent - a.discountPercent);
  }

  return (
    <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">

      {/* 1. Hero Banner Carousel */}
      <HeroCarousel />

      {/* 3. Offers from Nearby Stores */}
      <StoreOffersSection />

      {/* 4. Free Delivery Banner */}
      <FreeDeliveryBanner />

      {/* 5. Today's Top Deals — horizontal scroll */}
      <TopDealsSection />

      {/* 6. Shop by Category (circular avatars) */}
      <CategoryPills />

      {/* 7. Popular Products */}
      <section id="products-section" className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0A2540] tracking-tight">
              {selectedCategory === 'all' 
                ? 'Popular Products' 
                : activeCategoryName}
            </h2>
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-[#E11A22] hover:bg-red-100 border border-red-200 transition-all cursor-pointer shadow-2xs"
                title="Clear category filter"
              >
                <span>Clear Filter</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-xs text-gray-700 py-1.5 pl-3 pr-7 rounded-lg font-medium cursor-pointer focus:outline-none focus:border-gray-400"
              >
                <option value="popular">Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="discount">Highest Discount</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* View All link */}
            <Link
              href="/categories"
              className="text-xs sm:text-sm font-bold text-[#E11A22] hover:text-[#c8141b] flex items-center gap-0.5 cursor-pointer group"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Product Grid (5 columns on desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}

          {filteredProducts.length === 0 && !isLoadingProducts && (
            <div className="col-span-full bg-white rounded-xl p-10 text-center border border-gray-200">
              <p className="text-base font-bold text-gray-700">No products found</p>
              <p className="text-xs text-gray-400 mt-1">Try selecting another category or clearing your search.</p>
              <button
                onClick={() => setSelectedCategory('all')}
                className="mt-4 bg-[#E11A22] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                View All Products
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 8. Trust Badges */}
      <TrustBadges />

    </main>
  );
}
