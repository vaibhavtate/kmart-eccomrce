'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ChevronLeft, X, LayoutGrid } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CategoryPills: React.FC = () => {
  const { selectedCategory, setSelectedCategory, categories } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 350);
    }
  };

  const handleCategoryClick = (slug: string) => {
    if (selectedCategory === slug) {
      setSelectedCategory('all');
    } else {
      setSelectedCategory(slug);
    }

    const elem = document.getElementById('products-section');
    if (elem) {
      const navOffset = -110;
      const y = elem.getBoundingClientRect().top + window.pageYOffset + navOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0A2540] tracking-tight">
            Shop by Category
          </h2>
          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-[#E11A22] hover:bg-red-100 border border-red-200 transition-all cursor-pointer shadow-2xs"
              title="Clear selected category filter"
            >
              <span>Clear Filter</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll Navigation Arrows */}
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="w-7 h-7 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:text-[#0A2540] hover:border-gray-500 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="w-7 h-7 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:text-[#0A2540] hover:border-gray-500 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <Link
            href="/categories"
            className="text-xs sm:text-sm font-bold text-[#E11A22] hover:text-[#c8141b] flex items-center gap-0.5 cursor-pointer group ml-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Horizontal Scroll of Circular Categories */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-start gap-4 sm:gap-6 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-2"
      >
        {/* All Items Option */}
        <button
          type="button"
          onClick={() => handleCategoryClick('all')}
          className="flex flex-col items-center shrink-0 w-24 sm:w-28 group cursor-pointer text-center"
        >
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 transition-all p-0.5 flex items-center justify-center bg-gray-50 shadow-2xs ${
              selectedCategory === 'all'
                ? 'border-[#E11A22] ring-2 ring-red-100'
                : 'border-gray-200 group-hover:border-[#E11A22]'
            }`}
          >
            <div className="w-full h-full rounded-full overflow-hidden flex flex-col items-center justify-center bg-white text-[#0A2540] group-hover:text-[#E11A22] transition-colors">
              <LayoutGrid className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
          </div>

          <span
            className={`mt-2 text-xs sm:text-[13px] font-semibold leading-tight line-clamp-2 transition-colors ${
              selectedCategory === 'all' ? 'text-[#E11A22] font-bold' : 'text-gray-800 group-hover:text-[#E11A22]'
            }`}
          >
            All Items
          </span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          const imgSrc = cat.image || cat.icon || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=300&q=80';

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryClick(cat.slug)}
              className="flex flex-col items-center shrink-0 w-24 sm:w-28 group cursor-pointer text-center"
            >
              {/* Circular Avatar */}
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 transition-all p-0.5 flex items-center justify-center bg-gray-50 shadow-2xs ${
                  isSelected
                    ? 'border-[#E11A22] ring-2 ring-red-100'
                    : 'border-gray-200 group-hover:border-[#E11A22]'
                }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white relative">
                  <Image
                    src={imgSrc}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 80px, 96px"
                    className="object-cover transform group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Title */}
              <span
                className={`mt-2 text-xs sm:text-[13px] font-semibold leading-tight line-clamp-2 transition-colors ${
                  isSelected ? 'text-[#E11A22] font-bold' : 'text-gray-800 group-hover:text-[#E11A22]'
                }`}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
