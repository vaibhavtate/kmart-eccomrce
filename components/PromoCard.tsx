import React from 'react';
import Link from 'next/link';
import { ArrowRight, Percent, Flame } from 'lucide-react';

export const PromoCard: React.FC = () => {
  return (
    <div className="bg-gradient-to-b from-[#FFF5F5] via-[#FFF8F8] to-[#FFF0F0] rounded-2xl border-2 border-red-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden group">
      
      {/* Background Decorative Accent Ring */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-red-200/40 to-transparent pointer-events-none" />
      
      {/* Top Header Row with tags & Percent badge */}
      <div className="flex items-center justify-between gap-2 mb-2 pr-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 bg-[#E11A22] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
            <Flame className="w-3 h-3 text-amber-300 fill-amber-300" />
            Super Saver
          </span>
          <span className="text-[10px] font-bold text-red-600 bg-red-100/70 px-2 py-0.5 rounded-full">
            Daily Deals
          </span>
        </div>

        <div className="w-9 h-9 rounded-full bg-[#E11A22] text-white flex items-center justify-center font-black text-sm shadow-md shrink-0 transform rotate-12 transition-transform group-hover:scale-110">
          <Percent className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Main Headline */}
      <div className="mt-1">
        <h3 className="text-xl sm:text-2xl font-black text-[#0A2540] tracking-tight leading-[1.2]">
          Big Savings <br />
          <span className="text-[#E11A22]">on Daily Needs</span>
        </h3>
        <p className="mt-1.5 text-xs text-gray-600 font-medium leading-relaxed">
          Best brands. Great prices. Everyday pantry & household savings.
        </p>
      </div>

      {/* Custom Designed Vector Grocery Shopping Cart Illustration */}
      <div className="my-3 py-1 flex items-center justify-center">
        <div className="relative w-44 h-28 flex items-center justify-center transform transition-transform group-hover:scale-105 duration-300">
          
          {/* Wire Shopping Cart Illustration */}
          <svg className="w-40 h-26 drop-shadow-sm" viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Cart Shadow */}
            <ellipse cx="82" cy="102" rx="55" ry="5" fill="#E2E8F0" opacity="0.6" />
            
            {/* Cart Wheels */}
            <circle cx="48" cy="98" r="7" fill="#334155" />
            <circle cx="48" cy="98" r="3" fill="#E2E8F0" />
            <circle cx="112" cy="98" r="7" fill="#334155" />
            <circle cx="112" cy="98" r="3" fill="#E2E8F0" />

            {/* Cart Base Frame */}
            <path d="M38 90H124L114 98H46L38 90Z" fill="#94A3B8" />
            <path d="M48 91V75M112 91V75" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />

            {/* Packaged Goods Loaded in Cart */}
            {/* Sunflower Oil Bottle */}
            <rect x="52" y="24" width="16" height="38" rx="3" fill="#F59E0B" />
            <rect x="56" y="16" width="8" height="8" rx="2" fill="#D97706" />
            <rect x="55" y="32" width="10" height="14" rx="1" fill="#FEF3C7" />
            <line x1="57" y1="36" x2="63" y2="36" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />

            {/* Cereal / Biscuit Box */}
            <rect x="70" y="20" width="22" height="42" rx="2" fill="#E11A22" />
            <rect x="73" y="26" width="16" height="20" rx="1" fill="#FFFFFF" />
            <circle cx="81" cy="34" r="5" fill="#FBBF24" />
            <rect x="74" y="50" width="14" height="4" rx="1" fill="#FCA5A5" />

            {/* Milk Carton */}
            <polygon points="94,22 108,22 112,28 90,28" fill="#38BDF8" />
            <rect x="92" y="28" width="18" height="34" rx="2" fill="#0284C7" />
            <rect x="95" y="36" width="12" height="14" rx="1" fill="#FFFFFF" />
            <circle cx="101" cy="43" r="3" fill="#0284C7" />

            {/* Snack Pouch */}
            <rect x="110" y="30" width="18" height="32" rx="3" fill="#10B981" transform="rotate(8 110 30)" />
            <circle cx="120" cy="45" r="4" fill="#FEF08A" />

            {/* Wire Mesh Basket */}
            <path d="M30 38H132L122 76H40L30 38Z" fill="#F8FAFC" fillOpacity="0.85" stroke="#94A3B8" strokeWidth="2.5" />
            {/* Basket Horizontal Wire Grid */}
            <line x1="33" y1="48" x2="129" y2="48" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="36" y1="58" x2="126" y2="58" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="39" y1="68" x2="123" y2="68" stroke="#CBD5E1" strokeWidth="1.5" />
            
            {/* Basket Vertical Wire Grid */}
            <line x1="45" y1="40" x2="45" y2="74" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="60" y1="40" x2="60" y2="74" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="75" y1="40" x2="75" y2="74" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="90" y1="40" x2="90" y2="74" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="105" y1="40" x2="105" y2="74" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="120" y1="40" x2="120" y2="74" stroke="#CBD5E1" strokeWidth="1.5" />

            {/* Cart Handle */}
            <path d="M26 38L22 42M22 42H14" stroke="#E11A22" strokeWidth="4" strokeLinecap="round" />

            {/* Red Stamped Branding Plate on Front of Basket */}
            <rect x="52" y="50" width="58" height="18" rx="4" fill="#FFFFFF" stroke="#E11A22" strokeWidth="1.5" />
            <text x="58" y="63" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="11" fontStyle="italic" fill="#E11A22">K </text>
            <text x="69" y="63" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="10" fill="#0A2540">MART</text>
          </svg>

        </div>
      </div>

      {/* Bottom CTA & Note */}
      <div className="mt-2">
        {/* Primary CTA Button to Categories */}
        <Link
          href="/categories"
          className="w-full bg-[#E11A22] hover:bg-[#c8141b] text-white font-extrabold text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer block text-center"
        >
          <span>Explore All Daily Essentials</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 inline" />
        </Link>

        {/* Mini Trust Footer Note */}
        <p className="mt-2 text-center text-[10px] text-gray-500 font-semibold">
          ✨ 100% Genuine Branded Packs • Safe Delivery
        </p>
      </div>

    </div>
  );
};

