import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | K MART',
  description: 'Learn how K MART collects, uses and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-gray-800">
      <nav className="text-xs text-gray-400 mb-6">
        <Link href="/" className="hover:text-[#E11A22]">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Privacy Policy</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-[#07182E] mb-2">Privacy Policy</h1>
      <p className="text-xs text-gray-400 mb-8">Last updated: October 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-gray-700">

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">1. Information We Collect</h2>
          <p>We collect the following types of information when you use our platform:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Personal Information:</strong> Name, mobile number, email address, delivery address.</li>
            <li><strong>Order Information:</strong> Products purchased, order history, payment method.</li>
            <li><strong>Device &amp; Usage Data:</strong> IP address, browser type, pages visited, time spent.</li>
            <li><strong>Location Data:</strong> Approximate location to show relevant store and delivery options.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To process and fulfill your orders.</li>
            <li>To send order confirmations and delivery updates via SMS or WhatsApp.</li>
            <li>To personalise your shopping experience and suggest relevant products.</li>
            <li>To respond to customer service enquiries.</li>
            <li>To improve our platform and services through usage analytics.</li>
            <li>To prevent fraud and maintain security.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">3. Sharing of Information</h2>
          <p>
            We do not sell or rent your personal data to third parties. We may share your information with:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Delivery Partners:</strong> To fulfil your delivery orders.</li>
            <li><strong>Payment Processors:</strong> To handle secure payment transactions.</li>
            <li><strong>Legal Authorities:</strong> When required by law or court order.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">4. Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active or as needed to provide our services. You may request deletion of your account and associated data by contacting our support team.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">5. Cookies</h2>
          <p>
            We use cookies and similar tracking technologies to improve your browsing experience, remember preferences, and analyse traffic. You can control cookie settings in your browser, though some features may not work correctly without them.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">6. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data from unauthorised access, alteration, or disclosure. However, no internet transmission is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">7. Your Rights</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your personal data.</li>
            <li>Opt out of promotional communications at any time.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#07182E] mb-2">8. Contact Us</h2>
          <p>
            For privacy-related queries or requests, contact our Data Protection Officer at{' '}
            <a href="mailto:support@kmart.com" className="text-[#E11A22] hover:underline">support@kmart.com</a>{' '}
            or call <a href="tel:+919975040003" className="text-[#E11A22] hover:underline">+91 99750 40003</a>.
          </p>
        </section>

      </div>
    </main>
  );
}
