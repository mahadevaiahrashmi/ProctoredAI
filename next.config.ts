import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Type and lint errors DO fail the build, kept in sync with CI
  // (.github/workflows/ci.yml). These were `true` during early Firebase Studio
  // iteration — see ADR-0007 (superseded) for the history.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
