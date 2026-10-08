'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const HeroCarousel: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { setSelectedCategory } = useApp();

  const slides = [
    {
      id: 1,
      tag: 'STAPLES & PANTRY OFFERS',
      title: 'Save More on Atta, Rice & Dal',
      description: 'Trusted staples at special prices for your everyday kitchen.',
      btnText: 'Shop Offers',
      ctaCategory: 'groceries',
      badge: 'Up to 25% Off',
      image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
      bgColor: 'bg-[#FBF6EE]',
    },
    {
      id: 2,
      tag: 'SNACKS & BEVERAGES',
      title: 'Crunchy Munchies & Refreshing Drinks',
      description: 'Biscuits, namkeens, cold drinks, tea & coffee at up to 30% off.',
      btnText: 'Shop Snacks',
      ctaCategory: 'snacks-and-beverages',
      badge: 'Up to 30% Off',
      image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=800&q=80',
      bgColor: 'bg-[#F4FAF6]',
    },
    {
      id: 3,
      tag: 'HOUSEHOLD & CLEANING',
      title: 'Keep Your Home Fresh & Sparkling',
      description: 'Top brand detergents, dishwash bars, cleaners & hygiene essentials.',
      btnText: 'Shop Household',
      ctaCategory: 'household',
      badge: 'Sparkling Deals',
      image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=800&q=80',
      bgColor: 'bg-[#F2F7FC]',
    },
    {
      id: 4,
      tag: 'DAILY ESSENTIALS',
      title: 'Everyday Grocery & Quality Essentials',
      description: 'Handpicked daily essentials delivered daily at unbeatable prices.',
      btnText: 'Shop Essentials',
      ctaCategory: 'groceries',
      badge: 'Best Value',
      image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80',
      bgColor: 'bg-[#FFF8F0]',
    }
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  const handleCta = (cat: string) => {
    setSelectedCategory(cat);
    const elem = document.getElementById('products-section');
    if (elem) {
      const navOffset = -110;
      const y = elem.getBoundingClientRect().top + window.pageYOffset + navOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-2xs border border-gray-200/70 h-[280px] sm:h-[320px] md:h-[340px] w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Sliding Track */}
      <div
        className="flex h-full w-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`w-full h-full shrink-0 ${slide.bgColor} p-6 sm:p-10 lg:p-12 flex items-center justify-between gap-6 relative`}
          >
            {/* Left Column Content */}
            <div className="flex-1 max-w-lg text-left space-y-3 z-10">
              <span className="text-xs font-bold text-[#0A2540] uppercase tracking-wider block">
                {slide.tag}
              </span>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#E11A22] tracking-tight leading-tight">
                {slide.title}
              </h1>

              <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-md">
                {slide.description}
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleCta(slide.ctaCategory)}
                  className="bg-[#E11A22] hover:bg-[#c8141b] text-white px-5 sm:px-6 py-2.5 rounded-lg font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <span>{slide.btnText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Slide indicators at bottom-left */}
              <div className="flex items-center gap-1.5 pt-3">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === currentSlide ? 'w-5 bg-[#E11A22]' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Right Column Banner Image */}
            <div
              onClick={() => handleCta(slide.ctaCategory)}
              className="hidden sm:flex relative shrink-0 w-72 md:w-80 lg:w-[440px] h-[190px] sm:h-[230px] md:h-[260px] items-center justify-center pr-2 cursor-pointer"
            >
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg border-2 border-white/80 bg-white group">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  sizes="(max-width: 640px) 0px, (max-width: 768px) 288px, (max-width: 1024px) 320px, 440px"
                  className="object-cover transform group-hover:scale-105 transition-transform duration-700"
                  priority={i === 0}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />

                {/* Subtle soft gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent pointer-events-none" />

                {/* Floating Badge */}
                {slide.badge && (
                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-gray-100/80 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#E11A22] animate-pulse" />
                    <span className="text-xs font-black text-[#0A2540] tracking-wide uppercase">
                      {slide.badge}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
