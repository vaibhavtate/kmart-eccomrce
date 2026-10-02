import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css'; 
import { AppProvider } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { CartDrawer } from '../components/CartDrawer';
import { CheckoutModal } from '../components/CheckoutModal';
import { OrderSuccessModal } from '../components/OrderSuccessModal';
import { LocationModal } from '../components/LocationModal';
import { AuthModal } from '../components/AuthModal';
import { OrdersModal } from '../components/OrdersModal';
import { CustomersAlsoBoughtModal } from '../components/CustomersAlsoBoughtModal';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { ModalUrlSync } from '../components/ModalUrlSync';
import dynamic from 'next/dynamic';
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
