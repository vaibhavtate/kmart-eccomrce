/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
