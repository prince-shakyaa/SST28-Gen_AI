/** @type {import('next').NextConfig} */
const nextConfig = {
  // Override the default webpack configuration
  webpack: (config, { isServer }) => {
    // See https://github.com/xenova/transformers.js/issues/166
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
