import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Returns & Refunds | K MART',
  description: 'K MART returns and refund policy — eligibility, process, and timelines.',
};

export default function ReturnsRefundsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-gray-800">
      <nav className="text-xs text-gray-400 mb-6">
        <Link href="/" className="hover:text-[#E11A22]">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Returns &amp; Refunds</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-[#07182E] mb-2">Returns &amp; Refunds</h1>
      <p className="text-xs text-gray-400 mb-8">Last updated: October 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-gray-700">

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">1. Return Eligibility</h2>
          <p>We accept returns under the following conditions:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>The item received is damaged, defective, or incorrect.</li>
            <li>The item is past its expiry or best-before date at the time of delivery.</li>
            <li>The return request is raised within <strong>24 hours</strong> of delivery.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">2. Non-Returnable Items</h2>
          <p>The following items are <strong>not eligible</strong> for return:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Perishable goods (fresh fruits, vegetables, dairy, meat) — unless damaged/expired on arrival.</li>
            <li>Opened personal care or hygiene products.</li>
            <li>Items purchased during final sale or clearance.</li>
            <li>Products with tampered or missing seals (unless factory-defective).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">3. How to Raise a Return Request</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Contact us within 24 hours of delivery via WhatsApp, phone, or email.</li>
            <li>Share your Order ID and clear photos/videos of the damaged or incorrect item.</li>
            <li>Our team will review and confirm the return eligibility within 4–6 hours.</li>
            <li>Approved returns will be picked up by our team or dropped off at the store (for store pickup orders).</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">4. Refund Process</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Online Payments:</strong> Refunds will be credited to the original payment method within 5–7 business days.</li>
            <li><strong>Cash on Delivery (COD):</strong> Refunds will be issued as store credit or via UPI transfer within 2–3 business days.</li>
            <li>Delivery charges are non-refundable unless the entire order is returned due to our error.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">5. Replacement Policy</h2>
          <p>
            In many cases, we offer a free replacement instead of a refund — particularly for damaged goods or incorrect items. Our team will confirm the best resolution based on product availability.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">6. Contact Us</h2>
          <p>
            To initiate a return or refund, contact us at:{' '}
            <a href="https://wa.me/919975040003" target="_blank" rel="noopener noreferrer" className="text-[#E11A22] hover:underline">WhatsApp</a>{' '}
            | <a href="tel:+919975040003" className="text-[#E11A22] hover:underline">+91 99750 40003</a>{' '}
            | <a href="mailto:support@kmart.com" className="text-[#E11A22] hover:underline">support@kmart.com</a>
          </p>
        </section>

      </div>
    </main>
  );
}
