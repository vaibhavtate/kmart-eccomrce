import React from 'react';
import { Zap, ShieldCheck, Percent, Headphones } from 'lucide-react';

const badges = [
  {
    icon: <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />,
    title: 'Fast Delivery',
    subtitle: 'On-time, every time',
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-blue-600" />,
    title: 'Quality Products',
    subtitle: 'Trusted brands',
  },
  {
    icon: <Percent className="w-5 h-5 text-red-500" />,
    title: 'Great Deals',
    subtitle: 'Save more everyday',
  },
  {
    icon: <Headphones className="w-5 h-5 text-gray-600" />,
    title: 'Need Help?',
    subtitle: "We're here for you",
  },
];

export const TrustBadges: React.FC = () => {
  return (
    <section className="bg-white rounded-2xl border border-gray-200/90 py-4 px-6 shadow-2xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
        {badges.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-3.5 pt-3 sm:pt-0 ${idx > 0 ? 'sm:pl-6' : ''}`}
          >
            {/* Icon */}
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
              {item.icon}
            </div>
            {/* Text */}
            <div className="text-left min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-gray-900 leading-tight">
                {item.title}
              </h4>
              <p className="text-[11px] text-gray-500 font-normal mt-0.5">
                {item.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
