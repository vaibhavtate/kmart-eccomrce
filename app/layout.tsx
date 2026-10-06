import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppProvider } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { ModalUrlSync } from '../components/ModalUrlSync';
import dynamic from 'next/dynamic';

// Dynamically import all modals — they are never needed on initial paint
const ProductDetailsModal = dynamic(
  () => import('../components/ProductDetailsModal').then((m) => m.ProductDetailsModal),
  { ssr: false }
);
const CartDrawer = dynamic(
  () => import('../components/CartDrawer').then((m) => m.CartDrawer),
  { ssr: false }
);
const CheckoutModal = dynamic(
  () => import('../components/CheckoutModal').then((m) => m.CheckoutModal),
  { ssr: false }
);
const OrderSuccessModal = dynamic(
  () => import('../components/OrderSuccessModal').then((m) => m.OrderSuccessModal),
  { ssr: false }
);
const LocationModal = dynamic(
  () => import('../components/LocationModal').then((m) => m.LocationModal),
  { ssr: false }
);
const AuthModal = dynamic(
  () => import('../components/AuthModal').then((m) => m.AuthModal),
  { ssr: false }
);
const OrdersModal = dynamic(
  () => import('../components/OrdersModal').then((m) => m.OrdersModal),
  { ssr: false }
);
const CustomersAlsoBoughtModal = dynamic(
  () => import('../components/CustomersAlsoBoughtModal').then((m) => m.CustomersAlsoBoughtModal),
  { ssr: false }
);
const ScheduleOrderModal = dynamic(
  () => import('../components/ScheduleOrderModal').then((m) => m.ScheduleOrderModal),
  { ssr: false }
);

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: 'K MART — Daily Essentials, Doorstep Delivery on Time',
  description: 'Shop fresh staples, dairy, snacks, packaged groceries, and home essentials with guaranteed delivery on time.',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable}>
      <head>
        {/* Preconnect to image CDNs to reduce connection overhead */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="min-h-screen flex flex-col antialiased bg-[#F8F9FA]">
        <AppProvider>
          <Navbar />
          <div className="flex-1">
            {children}
          </div>
          <Footer />

          {/* Global Interactive Modals */}
          <ModalUrlSync />
          <ProductDetailsModal />
          <CartDrawer />
          <CheckoutModal />
          <OrderSuccessModal />
          <LocationModal />
          <AuthModal />
          <OrdersModal />
          <CustomersAlsoBoughtModal />
          <ScheduleOrderModal />

          {/* Floating WhatsApp Support Button */}
          <WhatsAppButton />
        </AppProvider>
      </body>
    </html>
  );
}
