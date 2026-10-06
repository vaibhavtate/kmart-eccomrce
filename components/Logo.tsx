import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  white?: boolean;
}

const sizeMap = {
  sm: { w: 80, h: 36 },
  md: { w: 100, h: 48 },
  lg: { w: 128, h: 64 },
  xl: { w: 180, h: 96 },
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
}) => {
  const { w, h } = sizeMap[size];

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <Image
        src="/logo.png"
        alt="K MART"
        width={w}
        height={h}
        className="object-contain"
        priority
      />
    </div>
  );
};
