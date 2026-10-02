'use client';

import React from 'react';
import { Zap, MapPin, Truck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DeliveryInfoBar: React.FC = () => {
  const { activeStore, setIsLocationOpen } = useApp();

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 px-4 sm:px-6 py-2.5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">

        {/* 3 Info columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-8 flex-1">

          {/* Fast Delivery */}
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-900">Fast delivery</p>
              <p className="text-[11px] text-gray-500 font-normal">Fresh daily essentials to your doorstep</p>
            </div>
          </div>

          {/* Selected Store */}
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-[#E11A22] shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-900">Selected Store</p>
              <p className="text-[11px] text-gray-500 font-normal">
                {activeStore ? activeStore.name : 'K MART Baramati — Store 1'}
              </p>
            </div>
          </div>

          {/* Delivery Slot */}
          <div className="flex items-center gap-2.5">
            <Truck className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-900">Delivery</p>
              <p className="text-[11px] text-gray-500 font-normal">Choose your preferred slot at checkout</p>
            </div>
          </div>

        </div>

        {/* Change Store Button on Right */}
        <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 flex justify-end">
          <button
            onClick={() => setIsLocationOpen(true)}
            className="text-xs font-semibold text-[#E11A22] border border-[#E11A22] hover:bg-red-50 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Change Store
          </button>
        </div>

      </div>
    </div>
  );
};
