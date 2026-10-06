"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronRight, ChevronDown, Plus, Minus, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Product } from "@/types";

function CategoriesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlCat = searchParams.get("cat") || searchParams.get("category") || "personal-care";
  
  const { products, categories, cart, addToCart, updateQuantity } = useApp();
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>(urlCat);
  const [activeSubcategory, setActiveSubcategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");

  useEffect(() => {
    if (urlCat) {
      setActiveCategorySlug(urlCat);
      setActiveSubcategory("all");
    }
  }, [urlCat]);

  // Current active category object
  const activeCategory = useMemo(() => {
    if (activeCategorySlug === "all") {
      return {
        id: "cat-all",
        name: "All Categories",
        slug: "all",
        emoji: "🛍️",
        subcategories: [],
      };
    }
    return categories.find((c) => c.slug === activeCategorySlug) || categories[0] || {
      id: "cat-personal-care",
      name: "Personal Care",
      slug: "personal-care",
      emoji: "🧴",
      subcategories: ["Oral Care", "Hair Care", "Bath & Body", "Hand Wash"],
    };
  }, [categories, activeCategorySlug]);

  // Subcategories list for active category
  const subcategoriesList = useMemo(() => {
    if (activeCategorySlug === "all") {
      return [];
    }
    return activeCategory.subcategories || [
      "Oral Care",
      "Hair Care",
      "Bath & Body",
      "Hand Wash",
    ];
  }, [activeCategory, activeCategorySlug]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      // Category match
      const pCat = p.category?.toLowerCase() || "";
      const matchesCat =
        pCat === activeCategorySlug.toLowerCase() ||
        pCat === activeCategory.name.toLowerCase() ||
        (activeCategorySlug === "all");

      if (!matchesCat) return false;

      // Subcategory match
      if (activeSubcategory !== "all") {
        const subLow = activeSubcategory.toLowerCase();
        const pSub = p.subcategory?.toLowerCase() || "";
        const pName = p.name.toLowerCase();
        const pDesc = (p.description || "").toLowerCase();
        return pSub.includes(subLow) || pName.includes(subLow) || pDesc.includes(subLow);
      }

      return true;
    });

    // Sorting
    if (sortBy === "price-low") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "discount") {
      list.sort((a, b) => b.discountPercent - a.discountPercent);
    } else {
      // Default: popular
      list.sort((a, b) => (b.rating || 0) * (b.reviewCount || 0) - (a.rating || 0) * (a.reviewCount || 0));
    }

    return list;
  }, [products, activeCategorySlug, activeCategory, activeSubcategory, sortBy]);

  const handleCategorySelect = (slug: string) => {
    setActiveCategorySlug(slug);
    setActiveSubcategory("all");
    router.replace(`/categories?cat=${slug}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC]">
      {/* ── Breadcrumb Bar ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <nav className="flex items-center gap-1.5 text-xs">
            <Link
              href="/"
              className="text-[#E11A22] hover:underline font-bold transition-colors"
            >
              Home
            </Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-gray-600 font-medium">
              {activeCategory.name}
            </span>
          </nav>
        </div>
      </div>

      {/* ── Main Layout: Sidebar + Product Grid ── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-start gap-6 lg:gap-8">

          {/* ── Left Sidebar: Shop by Category ── */}
          <aside className="w-full md:w-64 lg:w-72 shrink-0 bg-white rounded-2xl border border-gray-100/90 shadow-2xs p-3">
            <div className="flex items-center justify-between px-3 py-2">
              <h2 className="text-sm font-black text-[#0A2540] tracking-tight">
                Shop by Category
              </h2>
              {activeCategorySlug !== 'all' && (
                <button
                  type="button"
                  onClick={() => handleCategorySelect('all')}
                  className="text-[11px] font-bold text-[#E11A22] hover:underline cursor-pointer flex items-center gap-1"
                  title="Clear category filter"
                >
                  <span>Clear Filter</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="mt-1 space-y-0.5">
              {/* All Categories Option */}
              <button
                type="button"
                onClick={() => handleCategorySelect("all")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                  activeCategorySlug === "all"
                    ? "bg-red-50 text-[#E11A22] font-bold"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-sm shrink-0 leading-none">🛍️</span>
                  <span className="truncate">All Categories</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                    activeCategorySlug === "all" ? "text-[#E11A22] translate-x-0.5" : "text-gray-300"
                  }`}
                />
              </button>

              {categories.map((cat) => {
                const isActive = cat.slug === activeCategorySlug;
                return (
                  <button
                    key={cat.id || cat.slug}
                    type="button"
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                      isActive
                        ? "bg-red-50 text-[#E11A22] font-bold"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-sm shrink-0 leading-none">
                        {cat.emoji || "🛍️"}
                      </span>
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                        isActive ? "text-[#E11A22] translate-x-0.5" : "text-gray-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── Right Content Area ── */}
          <main className="flex-1 min-w-0">

            {/* Header: Collection Tag, Title & Sort */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
              <div>
                <span className="text-[11px] font-black tracking-wider text-[#E11A22] uppercase block">
                  K MART COLLECTION
                </span>
                <div className="flex items-center gap-2.5 sm:gap-3 mt-0.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540] tracking-tight">
                    {activeCategorySlug === 'all' ? 'All Products' : activeCategory.name}
                  </h1>
                  {activeCategorySlug !== 'all' && (
                    <button
                      type="button"
                      onClick={() => handleCategorySelect('all')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-[#E11A22] hover:bg-red-100 border border-red-200 transition-all cursor-pointer shadow-2xs"
                      title="Clear category filter"
                    >
                      <span>Clear Filter</span>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {filteredProducts.length === 0
                    ? "Loading products..."
                    : `Showing ${filteredProducts.length} items`}
                </p>
              </div>

              {/* Sort Dropdown */}
              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-3.5 py-1.5 pr-8 text-xs font-bold text-gray-700 shadow-2xs outline-none cursor-pointer transition-all"
                >
                  <option value="popular">Popular</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="discount">Discount</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* ── Subcategory Filter Pills ── */}
            {subcategoriesList.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {/* "All [Category Name]" pill */}
                <button
                  type="button"
                  onClick={() => setActiveSubcategory("all")}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeSubcategory === "all"
                      ? "bg-[#E11A22] text-white shadow-xs"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  All {activeCategory.name}
                </button>

                {/* Individual subcategory pills */}
                {subcategoriesList.map((sub) => {
                  const isActive = activeSubcategory === sub;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setActiveSubcategory(sub)}
                      className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#E11A22] text-white font-bold shadow-xs"
                          : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── 4-Column Product Grid ── */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <p className="text-sm font-bold text-gray-700">No products available in this selection.</p>
                <button
                  type="button"
                  onClick={() => setActiveSubcategory("all")}
                  className="mt-2 text-xs font-bold text-[#E11A22] hover:underline cursor-pointer"
                >
                  Show all {activeCategory.name}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => {
                  const cartItem = cart.find((item) => item.product.id === product.id);
                  const quantity = cartItem ? cartItem.quantity : 0;

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-gray-200/80 hover:border-gray-300 hover:shadow-md transition-all p-3.5 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Product Image */}
                        <Link
                          href={`/product/${product.id}`}
                          className="w-full aspect-square relative flex items-center justify-center mb-2 bg-[#F8F9FA] rounded-xl overflow-hidden block cursor-pointer"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </Link>

                        {/* Store Tag */}
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
                          {product.storeTag || `K MART • ${activeCategory.name.toUpperCase()}`}
                        </span>

                        {/* Product Name */}
                        <Link
                          href={`/product/${product.id}`}
                          className="font-bold text-sm text-[#0A2540] hover:text-[#E11A22] transition-colors line-clamp-1 block mt-1"
                          title={product.name}
                        >
                          {product.name}
                        </Link>

                        {/* Weight & Stock */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-0.5">
                          <span>{product.weight}</span>
                          <span>•</span>
                          <span className="text-gray-400">In stock</span>
                        </div>

                        {/* Price & Discount Row */}
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="font-black text-base text-[#E11A22]">
                            ₹{product.price}
                          </span>
                          {product.originalPrice > product.price && (
                            <span className="text-xs text-gray-400 line-through font-medium">
                              ₹{product.originalPrice}
                            </span>
                          )}
                        </div>

                        {/* Discount Badge */}
                        {product.discountPercent > 0 && (
                          <div className="mt-1">
                            <span className="inline-block bg-emerald-50 text-emerald-600 font-bold text-[11px] px-1.5 py-0.5 rounded">
                              {product.discountPercent}% OFF
                            </span>
                          </div>
                        )}

                        {/* Max Purchase Units */}
                        <p className="text-[10px] text-gray-400 font-medium mt-3">
                          Maximum purchase • {product.maxPurchaseUnits || 24} units
                        </p>
                      </div>

                      {/* Add to Cart Button */}
                      <div className="mt-3">
                        {quantity === 0 ? (
                          <button
                            type="button"
                            onClick={() => addToCart(product, 1)}
                            className="w-full py-1.5 border border-[#E11A22] text-[#E11A22] hover:bg-red-50 font-bold text-xs rounded-lg transition-colors cursor-pointer text-center"
                          >
                            ADD +
                          </button>
                        ) : (
                          <div className="flex items-center justify-between border border-[#E11A22] bg-[#E11A22] rounded-lg text-white font-bold text-xs overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              className="px-3 py-1.5 hover:bg-[#c8141b] transition-colors cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2">{quantity}</span>
                            <button
                              type="button"
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
                })}
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E11A22] border-t-transparent" />
        </div>
      }
    >
      <CategoriesContent />
    </Suspense>
  );
}
