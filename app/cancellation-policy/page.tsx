import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Cancellation Policy | K MART',
  description: 'K MART order cancellation policy — when you can cancel, how to cancel, and refund timelines.',
};

export default function CancellationPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-gray-800">
      <nav className="text-xs text-gray-400 mb-6">
        <Link href="/" className="hover:text-[#E11A22]">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Cancellation Policy</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-[#07182E] mb-2">Cancellation Policy</h1>
      <p className="text-xs text-gray-400 mb-8">Last updated: October 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-gray-700">

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">1. Cancellation by Customer</h2>
          <p>You may cancel your order under the following conditions:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Before Packing Begins:</strong> Full cancellation is allowed. No charge will be applied.</li>
            <li><strong>After Packing / Out for Delivery:</strong> Cancellation is not possible once the order is packed and dispatched. Please refer to our <Link href="/returns-refunds" className="text-[#E11A22] hover:underline">Returns &amp; Refunds</Link> policy in such cases.</li>
            <li><strong>Store Pickup Orders:</strong> You may cancel before arriving at the store. Once collected, the order cannot be cancelled.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">2. How to Cancel</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Go to <Link href="/orders" className="text-[#E11A22] hover:underline">My Orders</Link> and find the order you wish to cancel.</li>
            <li>Contact our support team via WhatsApp or phone with your Order ID.</li>
            <li>Our team will confirm cancellation eligibility and process accordingly.</li>
          </ol>
          <p className="mt-2 text-xs text-gray-400">
            * We are working on enabling in-app self-cancellation for eligible orders.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">3. Cancellation by K MART</h2>
          <p>
            We reserve the right to cancel orders in the following situations:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Item(s) are out of stock at the time of fulfillment.</li>
            <li>Delivery address is outside our serviceable area.</li>
            <li>Payment failure or suspected fraudulent activity.</li>
            <li>Natural calamity, extreme weather, or other force majeure events.</li>
          </ul>
          <p className="mt-2">
            In all such cases, you will be notified promptly and a full refund will be issued.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">4. Refund on Cancellation</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Online Payments:</strong> Refund processed within 5–7 business days to the original payment method.</li>
            <li><strong>Cash on Delivery (COD):</strong> No charge is applied for pre-delivery cancellations. For post-delivery issues, store credit or UPI refund is processed within 2–3 business days.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">5. Partial Cancellations</h2>
          <p>
            If specific items in your order are unavailable, we may deliver the rest of your order and refund only the cancelled item(s). You will be informed via SMS or WhatsApp before delivery.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">6. Contact Us</h2>
          <p>
            To cancel an order, contact us immediately at:{' '}
            <a href="https://wa.me/919975040003" target="_blank" rel="noopener noreferrer" className="text-[#E11A22] hover:underline">WhatsApp</a>{' '}
            | <a href="tel:+919975040003" className="text-[#E11A22] hover:underline">+91 99750 40003</a>{' '}
            | <a href="mailto:support@kmart.com" className="text-[#E11A22] hover:underline">support@kmart.com</a>
          </p>
        </section>

      </div>
    </main>
  );
}
