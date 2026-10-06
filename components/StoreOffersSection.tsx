'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface StoreOffer {
  id: number;
  storeLabel: string;
  discountBadge: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaCategory: string;
  image: string;
}

const storeOffers: StoreOffer[] = [
  {
    id: 1,
    storeLabel: 'K MART BARAMATI • STORE 1',
    discountBadge: '30% OFF*',
    title: 'Daily Essentials',
    subtitle: 'Daily Essentials',
    description: 'Real grocery products, trusted brands and great savings.',
    ctaText: 'Shop Offers',
    ctaCategory: 'groceries',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 2,
    storeLabel: 'K MART BARAMATI • STORE 2',
    discountBadge: '25% OFF*',
    title: 'Staples Sale',
    subtitle: 'Save More Today',
    description: 'Atta, rice, dal and pantry essentials at special prices.',
    ctaText: 'Shop Staples',
    ctaCategory: 'groceries',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 3,
    storeLabel: 'GROCERY SAVINGS',
    discountBadge: '20% OFF*',
    title: 'Daily Pantry',
    subtitle: 'Special Offers',
    description: 'Stock your pantry with trusted products and save more.',
    ctaText: 'Shop Grocery Deals',
    ctaCategory: 'groceries',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
  },
];

export const StoreOffersSection: React.FC = () => {
  const { setSelectedCategory } = useApp();

  const handleCta = (category: string) => {
    setSelectedCategory(category);
    const el = document.getElementById('products-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <p className="text-xs font-bold text-[#E11A22] uppercase tracking-wider mb-0.5">
            K MART STORES
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0A2540] tracking-tight">
            Offers from your nearby stores
          </h2>
        </div>

      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {storeOffers.map((offer) => (
          <div
            key={offer.id}
            className="bg-white rounded-2xl border border-gray-200/90 p-5 flex items-center justify-between gap-4 shadow-2xs hover:shadow-sm transition-shadow relative overflow-hidden group"
          >
            {/* Left Content */}
            <div className="flex-1 space-y-2 text-left z-10">
              <span className="text-[11px] font-bold text-[#E11A22] uppercase tracking-wider block">
                {offer.storeLabel}
              </span>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                  {offer.title}
                </h3>
                <h4 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                  {offer.subtitle}
                </h4>
              </div>

              <p className="text-xs text-gray-500 line-clamp-2 max-w-[200px]">
                {offer.description}
              </p>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => handleCta(offer.ctaCategory)}
                  className="bg-[#E11A22] hover:bg-[#c8141b] text-white text-xs font-bold px-4 py-2 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{offer.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Product Image with circular discount badge */}
            <div className="relative shrink-0 w-28 sm:w-32 h-28 sm:h-32 flex items-center justify-center">
              {/* Circular Discount Badge */}
              <span className="absolute top-0 right-0 z-20 bg-[#E11A22] text-white text-[11px] font-black px-2 py-1 rounded-full shadow-sm">
                {offer.discountBadge}
              </span>

              {/* Product Pack Image */}
              <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center bg-white relative">
                <Image
                  src={offer.image}
                  alt={offer.title}
                  fill
                  sizes="(max-width: 640px) 112px, 128px"
                  className="object-cover transform group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            </div>

          </div>
        ))}
      </div>
    </section>
  );
};
