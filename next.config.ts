import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix for OpenTelemetry async_hooks issue in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'async_hooks': false,
        'fs': false,
        'net': false,
        'tls': false,
        'child_process': false,
      };
    }
    
    // Exclude server-side modules from client bundle
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        '@opentelemetry/context-async-hooks': 'commonjs @opentelemetry/context-async-hooks',
        '@opentelemetry/instrumentation': 'commonjs @opentelemetry/instrumentation',
        'handlebars': 'commonjs handlebars',
      });
    }
    
    // Fix handlebars require.extensions issue
    config.module.rules.push({
      test: /\.hbs$/,
      loader: 'handlebars-loader'
    });
    
    return config;
  },
};

export default nextConfig;
