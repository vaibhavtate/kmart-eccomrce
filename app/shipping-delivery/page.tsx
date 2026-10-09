import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Shipping & Delivery | K MART',
  description: 'K MART shipping and delivery policy — timelines, charges, and service areas.',
};

export default function ShippingDeliveryPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-gray-800">
      <nav className="text-xs text-gray-400 mb-6">
        <Link href="/" className="hover:text-[#E11A22]">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Shipping &amp; Delivery</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-[#07182E] mb-2">Shipping &amp; Delivery</h1>
      <p className="text-xs text-gray-400 mb-8">Last updated: October 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-gray-700">

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">1. Service Area</h2>
          <p>
            K MART currently delivers to select areas in and around Baramati, Maharashtra. During checkout, you can verify whether your delivery address falls within our serviceable zone. We are continuously expanding our delivery coverage.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">2. Delivery Timelines</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Express Delivery:</strong> Available same-day or next-day depending on the selected delivery slot.</li>
            <li><strong>Scheduled Delivery:</strong> Choose a preferred date and time slot at checkout.</li>
            <li><strong>Orders placed after 8:00 PM</strong> will be scheduled for the next available delivery slot.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">3. Minimum Order &amp; Delivery Charges</h2>
          <p className="mb-3 text-sm">
            Home delivery is available only on orders of <strong>₹500 or above</strong>. For Store Pickup, there is no minimum order requirement.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold">Order Value</span>
              <span className="font-semibold">Delivery Fee</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Below ₹500</span>
              <span className="text-red-500 font-bold">Not accepted</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>₹500 – ₹999</span>
              <span>₹40</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>₹1,000 and above</span>
              <span>₹30</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">* Delivery charges may vary during peak hours or special events.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">4. Store Pickup</h2>
          <p>
            You may opt for free Store Pickup at any of our K MART locations in Baramati. Your order will be packed and ready for collection within 1–2 hours of placing the order. You will receive a notification when your order is ready.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">5. Tracking Your Order</h2>
          <p>
            Once your order is placed, you can track its real-time status from the <Link href="/orders" className="text-[#E11A22] hover:underline">My Orders</Link> section. Tracking stages include: Confirmed → Preparing → Out for Delivery → Delivered (for delivery orders) or Preparing → Packed → Ready for Pickup → Picked Up (for store pickup).
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">6. Failed Deliveries</h2>
          <p>
            If our delivery partner is unable to reach you, they will attempt to contact you via the registered mobile number. Repeated failed delivery attempts may result in the order being cancelled and a refund issued (if paid online).
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">7. Damaged or Incorrect Items</h2>
          <p>
            If you receive a damaged or incorrect item, please contact us within 24 hours of delivery via WhatsApp or email with photos of the product. We will arrange a replacement or refund promptly.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">8. Contact Us</h2>
          <p>
            For delivery-related queries, reach us at{' '}
            <a href="https://wa.me/919975040003" target="_blank" rel="noopener noreferrer" className="text-[#E11A22] hover:underline">WhatsApp</a>,{' '}
            <a href="mailto:support@kmart.com" className="text-[#E11A22] hover:underline">support@kmart.com</a>, or{' '}
            <a href="tel:+919975040003" className="text-[#E11A22] hover:underline">+91 99750 40003</a>.
          </p>
        </section>

      </div>
    </main>
  );
}
