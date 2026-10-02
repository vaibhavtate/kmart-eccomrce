'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Search,
  ChevronDown,
  X,
  Menu,
  ArrowLeft
} from 'lucide-react';
import { Logo } from './Logo';
import { useApp } from '../context/AppContext';
import { usePathname, useRouter } from 'next/navigation';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const {
    cartCount,
    setIsCartOpen,
    setIsLocationOpen,
    selectedAddress,
    setIsOrdersModalOpen,
    setIsAuthOpen,
    user,
    products,
    categories,
    selectedCategory,
    searchQuery,
    setSearchQuery,
    setSelectedCategory
  } = useApp();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hide header on login and otp
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/otp' ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/otp');

  if (isAuthPage) {
    return null;
  }

  const searchResults = searchQuery.trim()
    ? products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

  const navCategories = (categories && categories.length > 0)
    ? categories.map(c => ({ name: c.name, slug: c.slug }))
    : [
        { name: 'Groceries', slug: 'groceries' },
        { name: 'Fruits & Vegetables', slug: 'fruits-and-vegetables' },
        { name: 'Dairy & Eggs', slug: 'dairy-and-eggs' },
        { name: 'Snacks & Beverages', slug: 'snacks-and-beverages' },
        { name: 'Personal Care', slug: 'personal-care' },
        { name: 'Household', slug: 'household' },
      ];

  const handleCategoryNav = (slug: string) => {
    setSelectedCategory(slug);
    if (pathname === '/') {
      const elem = document.getElementById('products-section');
      if (elem) {
        const navOffset = -110;
        const y = elem.getBoundingClientRect().top + window.pageYOffset + navOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    } else {
      router.push(`/categories?cat=${slug}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.06)]">
      
      {/* ── Main Header Row ── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4 lg:gap-8">

          {/* Left: Brand Logo */}
          <Link
            href="/"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="cursor-pointer shrink-0 transition-transform hover:scale-[1.02] block"
          >
            <Logo size="md" />
          </Link>

          {/* Location Selector Button */}
          <button
            onClick={() => setIsLocationOpen(true)}
            className="hidden sm:flex items-center gap-1.5 text-left cursor-pointer group py-1 px-1.5 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
          >
            <MapPin className="w-4 h-4 text-[#E11A22] shrink-0" />
            <div className="flex flex-col">
              <span className="text-[11px] text-gray-500 font-normal leading-tight">
                Deliver to
              </span>
              <div className="flex items-center gap-1 font-bold text-xs sm:text-sm text-[#0A2540]">
                <span>{selectedAddress?.line1 || 'Baramati 413102'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-800 transition-transform group-hover:translate-y-0.5" />
              </div>
            </div>
          </button>

          {/* Center: Search Bar with Search Button */}
          <div ref={searchRef} className="flex-1 max-w-2xl relative">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  setIsSearchFocused(false);
                }
              }}
              className="relative flex items-center"
            >
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Search products, brands and more..."
                  className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-gray-300 text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all shadow-inner"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 absolute right-24 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Red Search Button on Right */}
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 bg-[#E11A22] hover:bg-[#c8141b] text-white text-xs sm:text-sm font-semibold px-4 sm:px-6 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              >
                Search
              </button>
            </form>

            {/* Search Autocomplete Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                <div className="p-2 border-b border-gray-100 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Products ({searchResults.length})
                </div>
                <div className="divide-y divide-gray-50">
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        router.push(`/product/${item.id}`);
                        setIsSearchFocused(false);
                      }}
                      className="p-2.5 flex items-center gap-3 hover:bg-red-50/40 cursor-pointer transition-colors"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-9 h-9 object-contain rounded-lg p-0.5 bg-gray-50 border border-gray-100 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0 text-xs">
                          📦
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                        <p className="text-[11px] text-gray-500">{item.weight} • {item.brand}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-[#0A2540]">₹{item.price}</span>
                        {item.originalPrice > item.price && (
                          <span className="text-[10px] text-gray-400 line-through block">
                            ₹{item.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Links: Orders, Account, Cart */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            {/* Orders Button */}
            <button
              type="button"
              onClick={() => setIsOrdersModalOpen(true)}
              className="hidden md:inline-block text-xs sm:text-sm font-semibold text-gray-700 hover:text-[#0A2540] transition-colors cursor-pointer"
            >
              Orders
            </button>

            {/* Account / Login Link */}
            {user.isVerified ? (
              <Link
                href="/profile"
                className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-[#0A2540] transition-colors"
              >
                Account
              </Link>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-[#0A2540] transition-colors cursor-pointer"
              >
                Account
              </button>
            )}

            {/* Cart with Badge */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-800 hover:text-[#E11A22] transition-colors cursor-pointer relative"
              aria-label="Open Cart"
            >
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="bg-[#E11A22] text-white text-[10px] font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center leading-none">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ── Sub Navigation: Categories & Language ── */}
      <div className="border-t border-gray-100 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 py-2">

            {/* Categories list */}
            <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-xs sm:text-sm font-medium text-gray-700">
              
              {/* Home / All Categories */}
              {pathname?.startsWith('/categories') ? (
                <Link
                  href="/"
                  className="flex items-center gap-1.5 font-bold text-[#0A2540] hover:text-[#E11A22] shrink-0 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Home</span>
                </Link>
              ) : (
                <Link
                  href="/categories"
                  className="flex items-center gap-1.5 font-bold text-[#0A2540] hover:text-[#E11A22] shrink-0 transition-colors"
                >
                  <Menu className="w-4 h-4" />
                  <span>All Categories</span>
                </Link>
              )}

              {/* Dynamic categories */}
              {navCategories.map((cat) => {
                const isActive = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => handleCategoryNav(cat.slug)}
                    className={`shrink-0 transition-colors whitespace-nowrap cursor-pointer ${
                      isActive ? 'text-[#E11A22] font-bold' : 'hover:text-[#E11A22]'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}

            </div>

          </div>
        </div>
      </div>

    </header>
  );
};
