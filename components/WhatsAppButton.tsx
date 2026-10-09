'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

export const WhatsAppButton: React.FC = () => {
  return (
    <a
      href="https://wa.me/919975040003?text=Hi%20K%20MART%20Support,%20I%20have%20a%20query%20about%20my%20order."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-40 bg-[#128C7E] hover:bg-[#075E54] text-white px-4 py-2.5 rounded-full shadow-lg hover:shadow-xl flex items-center gap-2.5 transition-all transform hover:scale-105 group"
      aria-label="Chat on WhatsApp"
    >
      {/* WhatsApp circular icon */}
      <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0">
        <MessageCircle className="w-4 h-4 text-[#128C7E] fill-[#128C7E]" />
      </div>

      {/* Text label */}
      <div className="text-left leading-tight pr-1">
        <p className="text-xs font-bold text-white tracking-wide">
          Chat on WhatsApp
        </p>
        <p className="text-[10px] text-white/90 font-medium">
          K MART Support
        </p>
      </div>
    </a>
  );
};
