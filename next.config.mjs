/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [375, 414, 640, 768, 1024, 1280, 1440],
    imageSizes: [36, 48, 64, 96, 128, 160, 192, 256],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/order/:id/tracking',
        destination: '/orders/:id',
        permanent: false,
      },
      {
        source: '/order/:id',
        destination: '/orders/:id',
        permanent: false,
      },
      {
        source: '/offers',
        destination: '/categories',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
