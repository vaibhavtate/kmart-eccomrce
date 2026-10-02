import { DbAddress, DbDeliverySlot, DbDeliverySettings, OrderStatus, PaymentMethod } from './database';

export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  weight: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  image: string;
  gallery?: string[];
  inStock: boolean;
  stockCount?: number;
  badge?: string;
  description?: string;
  highlights?: string[];
  brand: string;
  deliveryTime?: string;
  storeTag?: string;
  maxPurchaseUnits?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string; // url or icon name
  emoji?: string;
  image?: string;
  itemCount?: string | number;
  subcategories?: string[];
}

export interface Address {
  id: string;
  customerId?: string;
  name?: string;
  label?: string; // 'Home' | 'Work' | 'Other'
  fullName?: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface DeliverySlotItem {
  id: string;
  name: string;
  time: string;
  date?: string;
  dayLabel?: string;
  fee: string;
  isAvailable?: boolean;
  status?: string;
  icon?: string;
  unavailableReason?: string;
  orderCutoffTime?: string;
}

export interface ScheduleDayOption {
  date: string;
  dayLabel: string;
  dayOfWeek: string;
  dayOfMonth: number;
  monthShort: string;
  isToday: boolean;
  isTomorrow: boolean;
  slots: DeliverySlotItem[];
}

export interface Order {
  id: string; // DB UUID
  orderNumber: string; // KM-001234
  orderType?: 'DELIVERY' | 'PICKUP';
  pickupStoreId?: string | null;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  itemTotal: number; // Subtotal
  discount: number;
  deliveryFee: number;
  handlingFee?: number;
  platformFee?: number;
  totalAmount: number; // Total
  couponCode?: string;
  deliveryAddress: Address | null;
  deliverySlot: {
    slotId?: string;
    time: string;
    day: string;
    date?: string;
  };
  paymentMethod: 'Cash on Delivery' | 'Razorpay' | 'COD' | 'ONLINE';
  paymentId?: string;
  status: OrderStatus | 'Order Confirmed' | 'Packed' | 'Out for Delivery' | 'Ready for Pickup' | 'Picked Up' | 'Delivered';
  createdAt: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  dob?: string;
  isVerified: boolean;
  avatar: string;
  whatsappOptIn: boolean;
}

export type { DbDeliverySettings, DbDeliverySlot };
