'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, CartItem, Address, UserProfile, Order, Category, DeliverySlotItem } from '../types';
import { productService } from '../services/products';
import { storeService, calculateDistanceKm, DEFAULT_STORES, findNearestStore } from '../services/stores';
import { categoryService } from '../services/categories';
import { orderService } from '../services/orders';
import { customerService } from '../services/customers';
import { addressService } from '../services/addresses';
import { deliveryService } from '../services/delivery';
import { cartService } from '../services/cart';
import { supabase } from '../lib/supabase/client';
import { DbStore, DbCustomer, DbDeliverySettings } from '../types/database';
import { fetchRelatedProducts, toProduct } from '../lib/cart';
import { CATEGORIES } from '../data/mockData';

interface AppContextType {
  products: Product[];
  isLoadingProducts: boolean;
  categories: Category[];
  cart: CartItem[];
  cartCount: number;
  itemTotal: number;
  discount: number;
  deliveryFee: number;
  handlingFee: number;
  platformFee: number;
  totalAmount: number;
  appliedCoupon: string | null;
  couponDiscount: number;
  addToCart: (product: Product, quantity?: number, options?: { skipRelated?: boolean }) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;

  // Customer / User & Address
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  currentCustomer: DbCustomer | null;
  customerOrderCount: number;
  updateProfile: (data: {
    name?: string;
    email?: string;
    avatar?: string;
    dob?: string;
    whatsappOptIn?: boolean;
  }) => Promise<boolean>;
  addresses: Address[];
  selectedAddress: Address | null;
  setSelectedAddress: (addr: Address | null) => void;
  addAddress: (newAddr: Omit<Address, 'id'>) => Promise<Address | null>;
  deleteAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;

  // Store & Distance
  stores: DbStore[];
  activeStore: DbStore | null;
  setActiveStore: (store: DbStore | null) => void;
  storeDistanceKm: number;
  isDeliverable: boolean;
  maxDeliveryRadiusKm: number;
  orderType: 'DELIVERY' | 'PICKUP';
  setOrderType: (type: 'DELIVERY' | 'PICKUP') => void;

  // Delivery settings & Slots
  deliverySettings: DbDeliverySettings;
  deliverySlots: DeliverySlotItem[];
  selectedSlot: DeliverySlotItem;
  setSelectedSlot: (slot: DeliverySlotItem) => void;

  // Modals & Navigation
  isAuthOpen: boolean;
  setIsAuthOpen: (open: boolean) => void;
  isLocationOpen: boolean;
  setIsLocationOpen: (open: boolean) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  activeProductModal: Product | null;
  setActiveProductModal: (prod: Product | null) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  checkoutStep: number;
  setCheckoutStep: (step: number) => void;
  isScheduleModalOpen: boolean;
  setIsScheduleModalOpen: (open: boolean) => void;

  // Orders
  orders: Order[];
  activeConfirmedOrder: Order | null;
  setActiveConfirmedOrder: (order: Order | null) => void;
  isOrdersModalOpen: boolean;
  setIsOrdersModalOpen: (open: boolean) => void;
  placeOrder: (paymentMethod: 'Cash on Delivery' | 'Razorpay', customPaymentId?: string) => Promise<Order>;
  addOrder: (order: Order) => void;

  // Related Products Modal ("Customers Also Bought")
  relatedProductsModal: {
    isOpen: boolean;
    products: Product[];
    sourceProductName?: string;
  };
  closeRelatedProductsModal: () => void;
  openRelatedProductsModal: (products: Product[], sourceProductName?: string) => void;

  // Filter & Search
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;

  // Mobile preview view switch
  viewMode: 'desktop' | 'mobile-preview';
  setViewMode: (mode: 'desktop' | 'mobile-preview') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const BLANK_USER: UserProfile = {
  name: '',
  phone: '',
  email: '',
  isVerified: false,
  avatar: '/profile-avatar.png',
  whatsappOptIn: false,
};

const DEFAULT_DELIVERY_SETTINGS: DbDeliverySettings = {
  id: 1,
  min_order_value: 500,
  tier1_max_value: 999,
  tier1_fee: 40,
  tier2_fee: 30,
  free_delivery_order_count: 3,
};

const getInitialDeliverySlots = (): DeliverySlotItem[] => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isMorningPassed = currentHour > 12 || (currentHour === 12 && currentMinute >= 30);
  const isEveningPassed = currentHour > 17 || (currentHour === 17 && currentMinute >= 30);

  const slots: DeliverySlotItem[] = [];

  // 1. Today Morning (if before 12:30 PM cutoff)
  if (!isMorningPassed) {
    slots.push({
      id: 'e265b218-2b56-4d71-90be-f11fc5f9a58c',
      name: 'Morning',
      time: '11:00 AM - 2:00 PM',
      date: todayStr,
      dayLabel: 'Today',
      fee: 'Free delivery',
      isAvailable: true,
      orderCutoffTime: '12:30:00',
    });
  }

  // 2. Today Evening (if before 5:30 PM cutoff)
  if (!isEveningPassed) {
    slots.push({
      id: '2ac2c800-1b9f-4fe4-b3c7-b5ef31c3bce9',
      name: 'Evening',
      time: '4:00 PM - 7:00 PM',
      date: todayStr,
      dayLabel: 'Today',
      fee: 'Free delivery',
      isAvailable: true,
      orderCutoffTime: '17:30:00',
    });
  }

  // 3. Tomorrow Morning (always available)
  slots.push({
    id: 'e265b218-2b56-4d71-90be-f11fc5f9a58c',
    name: 'Morning',
    time: '11:00 AM - 2:00 PM',
    date: tomorrowStr,
    dayLabel: 'Tomorrow',
    fee: 'Free delivery',
    isAvailable: true,
    orderCutoffTime: '12:30:00',
  });

  // 4. Tomorrow Evening (always available)
  slots.push({
    id: '2ac2c800-1b9f-4fe4-b3c7-b5ef31c3bce9',
    name: 'Evening',
    time: '4:00 PM - 7:00 PM',
    date: tomorrowStr,
    dayLabel: 'Tomorrow',
    fee: 'Free delivery',
    isAvailable: true,
    orderCutoffTime: '17:30:00',
  });

  return slots;
};

const INITIAL_DEFAULT_SLOTS = getInitialDeliverySlots();
const DEFAULT_SLOT: DeliverySlotItem = INITIAL_DEFAULT_SLOTS[0];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [stores, setStores] = useState<DbStore[]>(DEFAULT_STORES);
  const [activeStore, setActiveStore] = useState<DbStore | null>(DEFAULT_STORES[0]);
  const [storeDistanceKm, setStoreDistanceKm] = useState<number>(2.4);
  const [isDeliverable, setIsDeliverable] = useState<boolean>(true);
  const [orderType, setOrderType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const maxDeliveryRadiusKm = 5;

  // Customer & Auth state
  const [user, setUser] = useState<UserProfile>(BLANK_USER);
  const [currentCustomer, setCurrentCustomer] = useState<DbCustomer | null>(null);
  const [customerOrderCount, setCustomerOrderCount] = useState<number>(0);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [dbCartId, setDbCartId] = useState<string | null>(null);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  // Addresses state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Delivery settings & Slots
  const [deliverySettings, setDeliverySettings] = useState<DbDeliverySettings>(DEFAULT_DELIVERY_SETTINGS);
  const [deliverySlots, setDeliverySlots] = useState<DeliverySlotItem[]>(INITIAL_DEFAULT_SLOTS);
  const [selectedSlot, setSelectedSlot] = useState<DeliverySlotItem>(DEFAULT_SLOT);

  // Coupons & Wishlist
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeProductModal, setActiveProductModal] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [activeConfirmedOrder, setActiveConfirmedOrder] = useState<Order | null>(null);

  // Related Products Modal ("Customers Also Bought")
  const [relatedProductsModal, setRelatedProductsModal] = useState<{
    isOpen: boolean;
    products: Product[];
    sourceProductName?: string;
  }>({
    isOpen: false,
    products: [],
  });

  const closeRelatedProductsModal = useCallback(() => {
    setRelatedProductsModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const openRelatedProductsModal = useCallback((suggestedProducts: Product[], sourceProductName?: string) => {
    setRelatedProductsModal({
      isOpen: true,
      products: suggestedProducts.slice(0, 4),
      sourceProductName,
    });
  }, []);

  // Search & Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile-preview'>('desktop');

  // Orders list
  const [orders, setOrders] = useState<Order[]>([]);

  // ----------------------------------------------------
  // 1. Initial Load: Catalog, Stores, Delivery Settings
  // ----------------------------------------------------
  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingProducts(true);
      try {
        const [dbStores, settings, dbCategories] = await Promise.all([
          storeService.getStores(),
          deliveryService.getDeliverySettings(),
          categoryService.fetchDbCategories(),
        ]);

        if (settings) {
          setDeliverySettings(settings);
        }

        const validStores = (dbStores && dbStores.length > 0) ? dbStores : DEFAULT_STORES;
        setStores(validStores);

        // Check if there is an existing saved address in localStorage
        let savedAddr: Address | null = null;
        try {
          const raw = localStorage.getItem('kmart_selected_address');
          if (raw) savedAddr = JSON.parse(raw);
        } catch {}

        let store: DbStore = validStores[0];
        let dist = 2.4;
        let deliverable = true;

        if (savedAddr?.latitude && savedAddr?.longitude) {
          const nearest = findNearestStore(validStores, savedAddr.latitude, savedAddr.longitude);
          if (nearest) {
            store = nearest.store;
            dist = nearest.distanceKm;
            deliverable = nearest.isWithinRadius;
          }
        }

        setActiveStore(store);
        setStoreDistanceKm(dist);
        setIsDeliverable(deliverable);

        const [dbProducts, slots] = await Promise.all([
          productService.fetchDbProducts(store?.id),
          deliveryService.getAvailableSlots(store?.id),
        ]);

        setProducts(dbProducts ?? []);
        setCategories(dbCategories ?? []);
        if (slots && slots.length > 0) {
          setDeliverySlots(slots);
          const firstAvailable = slots.find((s) => s.isAvailable) || slots[0];
          setSelectedSlot(firstAvailable);
        }
      } catch (err) {
        console.warn('[AppContext] Error loading catalog/stores from DB:', err);
      } finally {
        setIsLoadingProducts(false);
      }
    }

    loadInitialData();
  }, []);

  // ----------------------------------------------------
  // 2. Auth & Customer Sync (Phone-based customers table)
  // ----------------------------------------------------
  const syncCustomerProfile = useCallback(async (phone: string, name?: string, email?: string, authUserId?: string) => {
    if (!phone) return;
    try {
      // The DB trigger (handle_new_auth_user) creates the customers row automatically
      // when auth.users is inserted on OTP verify. We just fetch it here.
      // upsertCustomer still works: it SELECT-first, only INSERTs if missing (server-route fallback).
      const dbCust = await customerService.upsertCustomer(phone, name, email, authUserId);
      if (dbCust) {
        setCurrentCustomer(dbCust);
        setUser(prev => ({
          ...prev,
          id: dbCust.id,
          phone: dbCust.phone,
          name: dbCust.name || prev.name,
          email: dbCust.email || prev.email,
          isVerified: true,
        }));

        // Load customer past orders & order count
        const [count, custOrders, custAddresses, cartId] = await Promise.all([
          customerService.getCustomerOrderCount(dbCust.id, phone),
          orderService.fetchUserOrders(dbCust.id),
          addressService.getAddresses(dbCust.id),
          cartService.getOrCreateCartId(dbCust.id),
        ]);

        const totalResolvedCount = Math.max(count || 0, custOrders?.length || 0);
        setCustomerOrderCount(prev => Math.max(prev, totalResolvedCount));
        if (custOrders && custOrders.length > 0) {
          setOrders(prev => {
            const mergedMap = new Map<string, Order>();
            // Add DB orders
            custOrders.forEach(o => mergedMap.set(o.orderNumber || o.id, o));
            // Preserve any existing local orders not in DB
            prev.forEach(o => {
              const key = o.orderNumber || o.id;
              if (!mergedMap.has(key)) {
                mergedMap.set(key, o);
              }
            });
            const merged = Array.from(mergedMap.values());
            try {
              localStorage.setItem('kmart_orders', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }

        if (custAddresses.length > 0) {
          setAddresses(custAddresses);
          const def = custAddresses.find(a => a.isDefault) || custAddresses[0];
          setSelectedAddress(def);
        }

        if (cartId) {
          setDbCartId(cartId);
          // Sync DB cart items
          const dbCartItems = await cartService.loadCartItems(cartId);
          if (dbCartItems.length > 0) {
            setCart(dbCartItems);
          } else {
            try {
              const saved = localStorage.getItem('kmart_cart_items');
              if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  for (const it of parsed) {
                    if (it?.product?.id && it?.quantity) {
                      await cartService.upsertCartItem(cartId, it.product.id, it.quantity);
                    }
                  }
                }
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      console.warn('[AppContext] syncCustomerProfile error:', err);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const supaUser = session.user;
        const phone = supaUser.phone || supaUser.user_metadata?.phone || '';
        const name = supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || '';
        const email = supaUser.email || '';
        if (phone) {
          syncCustomerProfile(phone, name, email, supaUser.id);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const supaUser = session.user;
        const phone = supaUser.phone || supaUser.user_metadata?.phone || '';
        const name = supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || '';
        const email = supaUser.email || '';
        if (phone) {
          syncCustomerProfile(phone, name, email, supaUser.id);
        }
      } else {
        setUser(BLANK_USER);
        setCurrentCustomer(null);
        setOrders([]);
        setAddresses([]);
        setSelectedAddress(null);
        setDbCartId(null);
        try {
          localStorage.removeItem('kmart_orders');
        } catch {}
      }
    });

    return () => subscription.unsubscribe();
  }, [syncCustomerProfile]);

  // ----------------------------------------------------
  // 3. Fallback Local Storage for Addresses (when not logged in)
  // ----------------------------------------------------
  useEffect(() => {
    if (currentCustomer) return; // DB is source of truth for logged-in users

    try {
      const savedAddresses = localStorage.getItem('kmart_user_addresses');
      if (savedAddresses) {
        const parsed = JSON.parse(savedAddresses);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAddresses(parsed);
          const savedSelected = localStorage.getItem('kmart_selected_address');
          if (savedSelected) {
            setSelectedAddress(JSON.parse(savedSelected));
          } else {
            setSelectedAddress(parsed[0]);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load addresses from localStorage:', e);
    }
  }, [currentCustomer]);

  // ----------------------------------------------------
  // 3b. Order History Persistence (LocalStorage cache)
  // ----------------------------------------------------
  useEffect(() => {
    try {
      const savedCount = localStorage.getItem('kmart_customer_order_count');
      if (savedCount) {
        const parsedCount = parseInt(savedCount, 10);
        if (!isNaN(parsedCount) && parsedCount > 0) {
          setCustomerOrderCount(prev => Math.max(prev, parsedCount));
        }
      }

      const savedOrders = localStorage.getItem('kmart_orders');
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOrders(prev => {
            const mergedMap = new Map<string, Order>();
            prev.forEach(o => mergedMap.set(o.orderNumber || o.id, o));
            parsed.forEach(o => {
              const key = o.orderNumber || o.id;
              if (!mergedMap.has(key)) {
                mergedMap.set(key, o);
              }
            });
            return Array.from(mergedMap.values());
          });
          setCustomerOrderCount(prev => Math.max(prev, parsed.length));
        }
      }
    } catch (e) {
      console.warn('Failed to load orders from localStorage:', e);
    }
  }, []);

  useEffect(() => {
    const totalCount = Math.max(customerOrderCount, orders.length);
    if (totalCount > 0) {
      try {
        localStorage.setItem('kmart_customer_order_count', totalCount.toString());
      } catch {}
    }
  }, [customerOrderCount, orders.length]);

  // ----------------------------------------------------
  // 4. Cart Persistence (DB-backed for logged in, localStorage fallback)
  // ----------------------------------------------------
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('kmart_cart_items');
      if (savedCart !== null) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          const isUuid = (id?: string) => Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
          const validItems = parsed.filter(item => isUuid(item?.product?.id));
          setCart(validItems);
        }
      }
    } catch (e) {
      console.warn('Failed to load cart from localStorage:', e);
    } finally {
      setIsCartLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isCartLoaded) return;
    try {
      localStorage.setItem('kmart_cart_items', JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
  }, [cart, isCartLoaded]);

  // ----------------------------------------------------
  // 5. Calculations: Subtotal, DB Delivery Fee, Total
  // ----------------------------------------------------
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const originalTotal = cart.reduce((sum, item) => sum + (item.product.originalPrice * item.quantity), 0);
  const itemTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const catalogDiscount = Math.max(0, originalTotal - itemTotal);

  // Delivery fee calculated from DB settings table using effective order count
  const effectiveOrderCount = Math.max(customerOrderCount, orders.length);
  const deliveryCalc = deliveryService.calculateDeliveryFee(
    itemTotal,
    deliverySettings,
    effectiveOrderCount
  );
  // Free delivery for Store Pickup / Takeaway
  const deliveryFee = (itemTotal === 0 || orderType === 'PICKUP') ? 0 : deliveryCalc.fee;
  const handlingFee = 0; // Current handling charges (₹0)
  const platformFee = 0; // Current platform fee (₹0)
  const couponDiscount = 0;
  const discount = catalogDiscount;
  const totalAmount = Math.max(0, itemTotal + deliveryFee + handlingFee + platformFee);

  // ----------------------------------------------------
  // 6. Cart Actions (Syncs to DB if customer logged in)
  // ----------------------------------------------------
  const addToCart = (product: Product, quantity = 1, options?: { skipRelated?: boolean }) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      let nextCart: CartItem[];
      if (existing) {
        nextCart = prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        nextCart = [...prev, { product, quantity }];
      }

      if (dbCartId) {
        const targetQty = existing ? existing.quantity + quantity : quantity;
        cartService.upsertCartItem(dbCartId, product.id, targetQty);
      }

      return nextCart;
    });

    // Query related products after add succeeds (purely additive, non-blocking)
    if (!options?.skipRelated) {
      fetchRelatedProducts(product.id)
        .then((items) => {
          if (items && items.length > 0) {
            const mapped = items.map((item) => toProduct(item, products));
            if (mapped.length > 0) {
              setRelatedProductsModal({
                isOpen: true,
                products: mapped.slice(0, 4),
                sourceProductName: product.name,
              });
            }
          }
        })
        .catch((err) => {
          console.warn('[AppContext] Related products fetch error:', err);
        });
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    ));

    if (dbCartId) {
      cartService.upsertCartItem(dbCartId, productId, quantity);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const next = prev.filter(item => item.product.id !== productId);
      return next;
    });

    if (dbCartId) {
      cartService.upsertCartItem(dbCartId, productId, 0);
    }
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.setItem('kmart_cart_items', JSON.stringify([]));
    } catch {}

    if (dbCartId) {
      cartService.clearCart(dbCartId);
    }
  };

  const applyCoupon = (_code: string) => {
    return { success: false, message: 'Coupons will be enabled shortly.' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // ----------------------------------------------------
  // 7. Address Management (DB for logged in + localStorage)
  // ----------------------------------------------------
  const handleSetSelectedAddress = (addr: Address | null) => {
    setSelectedAddress(addr);
    try {
      if (addr) {
        localStorage.setItem('kmart_selected_address', JSON.stringify(addr));
        if (addr.latitude && addr.longitude) {
          const nearest = findNearestStore(stores, addr.latitude, addr.longitude);
          if (nearest) {
            setActiveStore(nearest.store);
            setStoreDistanceKm(nearest.distanceKm);
            setIsDeliverable(nearest.isWithinRadius);
            deliveryService.getAvailableSlots(nearest.store.id).then((slots) => {
              if (slots && slots.length > 0) {
                setDeliverySlots(slots);
                setSelectedSlot((prev) => {
                  const match = slots.find((s) => (s.id === prev.id || s.name === prev.name) && s.isAvailable);
                  if (match) return match;
                  return slots.find((s) => s.isAvailable) || slots[0];
                });
              }
            });
          }
        }
      } else {
        localStorage.removeItem('kmart_selected_address');
      }
    } catch {}
  };

  const addAddress = async (newAddr: Omit<Address, 'id'>): Promise<Address | null> => {
    let saved: Address | null = null;

    if (currentCustomer?.id) {
      saved = await addressService.addAddress(currentCustomer.id, newAddr);
    }

    const addr: Address = saved || {
      ...newAddr,
      id: `addr-${Date.now()}`,
      isDefault: addresses.length === 0,
    };

    setAddresses(prev => {
      const next = [addr, ...prev];
      try {
        localStorage.setItem('kmart_user_addresses', JSON.stringify(next));
      } catch {}
      return next;
    });

    handleSetSelectedAddress(addr);
    return addr;
  };

  const updateProfile = async (data: {
    name?: string;
    email?: string;
    avatar?: string;
    dob?: string;
    whatsappOptIn?: boolean;
  }): Promise<boolean> => {
    setUser(prev => ({
      ...prev,
      ...data,
    }));

    if (currentCustomer?.id) {
      await customerService.updateProfile(currentCustomer.id, {
        name: data.name,
        email: data.email,
      });
    }

    try {
      const savedUser = {
        ...user,
        ...data,
      };
      localStorage.setItem('kmart_user_profile', JSON.stringify(savedUser));
    } catch {}

    return true;
  };

  const deleteAddress = async (addressId: string) => {
    if (currentCustomer?.id) {
      await addressService.deleteAddress(addressId, currentCustomer.id);
    }
    setAddresses(prev => {
      const next = prev.filter(a => a.id !== addressId);
      try {
        localStorage.setItem('kmart_user_addresses', JSON.stringify(next));
      } catch {}
      if (selectedAddress?.id === addressId) {
        const fallback = next.find(a => a.isDefault) || next[0] || null;
        setSelectedAddress(fallback);
      }
      return next;
    });
  };

  const setDefaultAddress = async (addressId: string) => {
    if (currentCustomer?.id) {
      await addressService.setDefault(addressId, currentCustomer.id);
    }
    setAddresses(prev => {
      const next = prev.map(a => ({
        ...a,
        isDefault: a.id === addressId,
      }));
      try {
        localStorage.setItem('kmart_user_addresses', JSON.stringify(next));
      } catch {}
      const target = next.find(a => a.id === addressId);
      if (target) {
        setSelectedAddress(target);
      }
      return next;
    });
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  // ----------------------------------------------------
  // 8. Place Order (Real orders + order_items schema)
  // ----------------------------------------------------
  const placeOrder = async (
    paymentMethod: 'Cash on Delivery' | 'Razorpay',
    customPaymentId?: string
  ): Promise<Order> => {
    // Authentication guard: Orders require verified login
    if (!user.isVerified && !currentCustomer) {
      setIsAuthOpen(true);
      throw new Error('Please login to place your order.');
    }

    // Delivery radius check: max 5km from nearest store
    if (selectedAddress?.latitude && selectedAddress?.longitude) {
      const nearest = findNearestStore(stores, selectedAddress.latitude, selectedAddress.longitude);
      if (nearest && !nearest.isWithinRadius) {
        throw new Error(
          `Your delivery location is ${nearest.distanceKm} km away. We currently only deliver within 5 km of our stores.`
        );
      }
    }

    // Generate standard order number format: KM-001234
    const randomSeq = Math.floor(1000 + Math.random() * 900000);
    const orderNumber = `KM-${String(randomSeq).padStart(6, '0')}`;

    let customerId = currentCustomer?.id;
    if (!customerId) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.id) {
          const { data: custRow } = await supabase
            .from('customers')
            .select('id')
            .eq('auth_user_id', authUser.id)
            .maybeSingle();
          if (custRow?.id) customerId = custRow.id;
        }
      } catch {}
    }

    if (!customerId) {
      throw new Error('Customer account not found. Please log out and log in again.');
    }

    // Sync active cart to DB for the customer
    const cartId = await cartService.getOrCreateCartId(customerId);
    if (cartId) {
      for (const item of cart) {
        await cartService.upsertCartItem(cartId, item.product.id, item.quantity);
      }
    }

    const isStore2 = activeStore?.id === 'f524383f-c351-41a3-a98d-6fb139e832a7';
    const defaultMorningId = isStore2
      ? '09105f7b-0513-4d47-9c66-d028b080b094'
      : 'cc2af619-6c0a-4c6c-9654-9cd33729facf';
    const defaultEveningId = isStore2
      ? 'fae0cecd-b803-4bbe-9502-104270f8b77a'
      : '243650c2-0e6e-47c7-8a0e-a6fdc8a21e94';
    const isEvening = selectedSlot?.name?.toLowerCase().includes('evening');
    let validSlotId = selectedSlot?.id;
    if (!validSlotId || validSlotId.startsWith('slot-')) {
      validSlotId = isEvening ? defaultEveningId : defaultMorningId;
    }

    const idempotencyKey = crypto.randomUUID();
    const { data, error } = await supabase.functions.invoke('checkout', {
      body: {
        customerId,
        addressId: orderType === 'DELIVERY' ? (selectedAddress?.id ?? null) : null,
        orderType,
        pickupStoreId: orderType === 'PICKUP' ? (activeStore?.id ?? stores[0]?.id ?? null) : null,
        deliverySlotId: orderType === 'DELIVERY' ? validSlotId : null,
        scheduledDeliveryDate: orderType === 'DELIVERY' ? (selectedSlot?.date ?? null) : null,
        paymentMethod: paymentMethod === 'Cash on Delivery' ? 'COD' : 'ONLINE',
        idempotencyKey,
      },
    });

    if (error) {
      let errMsg = 'Checkout failed. Please try again.';
      try {
        const details = await (error as any).context?.json?.();
        if (details?.error) errMsg = details.error;
      } catch {}
      throw new Error(errMsg);
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    const confirmedOrder = data.order;
    const newOrder: Order = {
      id: confirmedOrder.id,
      orderNumber: confirmedOrder.order_number,
      orderType: confirmedOrder.order_type,
      pickupStoreId: confirmedOrder.pickup_store_id || null,
      items: [...cart],
      itemTotal,
      discount,
      deliveryFee,
      handlingFee,
      platformFee,
      totalAmount: confirmedOrder.total,
      couponCode: appliedCoupon || undefined,
      deliveryAddress: orderType === 'PICKUP' ? null : selectedAddress,
      deliverySlot: {
        slotId: selectedSlot.id,
        time: selectedSlot.time,
        day: selectedSlot.date || 'Today',
        date: selectedSlot.date,
      },
      paymentMethod,
      paymentId: customPaymentId,
      status: confirmedOrder.status || 'Order Confirmed',
      createdAt: confirmedOrder.created_at || new Date().toISOString(),
    };

    setOrders(prev => {
      const next = [newOrder, ...prev.filter(o => o.id !== newOrder.id && o.orderNumber !== newOrder.orderNumber)];
      try {
        localStorage.setItem('kmart_orders', JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save order to localStorage:', e);
      }
      return next;
    });
    setCustomerOrderCount(prev => {
      const nextCount = Math.max(prev, orders.length) + 1;
      try {
        localStorage.setItem('kmart_customer_order_count', nextCount.toString());
      } catch {}
      return nextCount;
    });

    setActiveConfirmedOrder(newOrder);
    clearCart();
    setIsCheckoutOpen(false);
    return newOrder;
  };

  const addOrder = (newOrder: Order) => {
    setOrders(prev => {
      const next = [newOrder, ...prev.filter(o => o.id !== newOrder.id && o.orderNumber !== newOrder.orderNumber)];
      try {
        localStorage.setItem('kmart_orders', JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save order to localStorage:', e);
      }
      return next;
    });
    setCustomerOrderCount(prev => {
      const nextCount = Math.max(prev, orders.length) + 1;
      try {
        localStorage.setItem('kmart_customer_order_count', nextCount.toString());
      } catch {}
      return nextCount;
    });
    setActiveConfirmedOrder(newOrder);
  };

  return (
    <AppContext.Provider value={{
      products,
      isLoadingProducts,
      categories,
      cart,
      cartCount,
      itemTotal,
      discount,
      deliveryFee,
      handlingFee,
      platformFee,
      totalAmount,
      appliedCoupon,
      couponDiscount,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      applyCoupon,
      removeCoupon,
      user,
      setUser,
      currentCustomer,
      customerOrderCount: effectiveOrderCount,
      updateProfile,
      addresses,
      selectedAddress,
      setSelectedAddress: handleSetSelectedAddress,
      addAddress,
      deleteAddress,
      setDefaultAddress,
      stores,
      activeStore,
      setActiveStore,
      storeDistanceKm,
      isDeliverable,
      maxDeliveryRadiusKm,
      orderType,
      setOrderType,
      deliverySettings,
      deliverySlots,
      selectedSlot,
      setSelectedSlot,
      isAuthOpen,
      setIsAuthOpen,
      isLocationOpen,
      setIsLocationOpen,
      isCartOpen,
      setIsCartOpen,
      activeProductModal,
      setActiveProductModal,
      isCheckoutOpen,
      setIsCheckoutOpen,
      checkoutStep,
      setCheckoutStep,
      isScheduleModalOpen,
      setIsScheduleModalOpen,
      orders,
      activeConfirmedOrder,
      setActiveConfirmedOrder,
      isOrdersModalOpen,
      setIsOrdersModalOpen,
      placeOrder,
      addOrder,
      relatedProductsModal,
      closeRelatedProductsModal,
      openRelatedProductsModal,
      selectedCategory,
      setSelectedCategory,
      searchQuery,
      setSearchQuery,
      wishlist,
      toggleWishlist,
      viewMode,
      setViewMode,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
