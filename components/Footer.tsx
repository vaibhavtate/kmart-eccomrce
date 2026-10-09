'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from './Logo';
import { Phone } from 'lucide-react';
import { usePathname } from 'next/navigation';

export const Footer: React.FC = () => {
  const pathname = usePathname();

  // Hide footer on login and otp pages
  const isAuthPage = 
    pathname === '/login' || 
    pathname === '/otp' || 
    pathname?.startsWith('/login') || 
    pathname?.startsWith('/otp');

  if (isAuthPage) {
    return null;
  }

  return (
    <footer className="bg-[#07182E] text-gray-300 mt-12 border-t-2 border-[#E11A22] text-left">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        
        {/* 4 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10">
          
          {/* Col 1: Brand Logo & Bio */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Logo size="lg" white={true} />
            </Link>
            <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
              Your trusted local supermarket for groceries, dairy, snacks, household and personal care essentials.
            </p>
          </div>

          {/* Col 2: Customer Service */}
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider mb-4">
              Customer Service
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li>
                <Link href="/orders" className="hover:text-white transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <a href="https://wa.me/919975040003" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>

            </ul>
          </div>

          {/* Col 3: Policies */}
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider mb-4">
              Policies
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/shipping-delivery" className="hover:text-white transition-colors">
                  Shipping &amp; Delivery
                </Link>
              </li>
              <li>
                <Link href="/returns-refunds" className="hover:text-white transition-colors">
                  Returns &amp; Refunds
                </Link>
              </li>

            </ul>
          </div>

          {/* Col 4: Store & Contact */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider mb-4">
              Store &amp; Contact
            </h4>
            
            <div className="text-xs text-gray-400 space-y-1">
              <p className="font-bold text-gray-200">K MART Baramati — Store 1</p>
              <p className="text-[11px] leading-relaxed">
                Baramati - Nira Rd, Yashwant Nagar, Kasba, Baramati, Maharashtra 413102
              </p>
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <p className="font-bold text-gray-200">K MART Baramati — Store 2</p>
              <p className="text-[11px] leading-relaxed">
                Baramati - Nira Rd, Yashwant Nagar, Kasba, Baramati, Maharashtra 413102
              </p>
            </div>

            <div className="pt-2 text-xs space-y-1">
              <a
                href="tel:+919975040003"
                className="flex items-center gap-2 font-bold text-white hover:text-red-400 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#E11A22]" />
                <span>+91 99750 40003</span>
              </a>
              <p className="text-[11px] text-gray-400">Open daily: 9:00 AM – 9:00 PM</p>
              <a
                href="https://wa.me/919975040003"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold block transition-colors"
              >
                WhatsApp Customer Support
              </a>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
          <p>© 2026 K MART. All rights reserved.</p>
          <p className="text-right">
            Prices, availability, delivery charges and offers may vary by location and order.
          </p>
        </div>

      </div>
    </footer>
  );
};
