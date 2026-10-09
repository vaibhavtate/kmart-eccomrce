import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions | K MART',
  description: 'Read the Terms and Conditions for shopping at K MART Baramati.',
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-gray-800">
      <nav className="text-xs text-gray-400 mb-6">
        <Link href="/" className="hover:text-[#E11A22]">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Terms &amp; Conditions</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-[#07182E] mb-2">Terms &amp; Conditions</h1>
      <p className="text-xs text-gray-400 mb-8">Last updated: October 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-gray-700">

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the K MART website or mobile application, you agree to be bound by these Terms &amp; Conditions. If you do not agree to any part of these terms, please do not use our services.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">2. Use of the Platform</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You must be at least 18 years old or using the platform under adult supervision.</li>
            <li>You agree to provide accurate and complete information when placing an order.</li>
            <li>You are responsible for keeping your account credentials confidential.</li>
            <li>Misuse of the platform, including fraudulent orders, will result in account suspension.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">3. Product Information</h2>
          <p>
            We strive to display product descriptions, images, and prices as accurately as possible. However, K MART does not warrant that product descriptions or other content is error-free. Prices and availability are subject to change without prior notice.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">4. Orders &amp; Payment</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Placing an order constitutes an offer to purchase. We reserve the right to accept or decline any order.</li>
            <li>Payment is currently accepted via Cash on Delivery (COD) and UPI/online payment as available.</li>
            <li>In the event of a payment failure, the order will not be confirmed.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">5. Intellectual Property</h2>
          <p>
            All content on this platform — including logos, text, images, and design — is the intellectual property of K MART. Unauthorized reproduction or distribution is strictly prohibited.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">6. Limitation of Liability</h2>
          <p>
            K MART shall not be liable for any indirect, incidental, or consequential damages arising from the use of our platform or services. Our maximum liability in any case is limited to the value of the order in question.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">7. Governing Law</h2>
          <p>
            These Terms &amp; Conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Baramati, Maharashtra.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">8. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Continued use of the platform after changes are posted constitutes your acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">9. Contact Us</h2>
          <p>
            For any queries regarding these Terms, please contact us at{' '}
            <a href="mailto:support@kmart.com" className="text-[#E11A22] hover:underline">support@kmart.com</a>{' '}
            or call <a href="tel:+919975040003" className="text-[#E11A22] hover:underline">+91 99750 40003</a>.
          </p>
        </section>

      </div>
    </main>
  );
}
