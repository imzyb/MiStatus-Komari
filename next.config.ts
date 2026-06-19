import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export', // 改为静态导出
  trailingSlash: true, // 添加尾部斜杠
  // 使用相对资源前缀，确保挂载在子路径时静态资源可用
  assetPrefix: './',
  images: {
    unoptimized: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    // 现代浏览器优化
    optimizePackageImports: ['lucide-react'],
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // 完全禁用所有polyfill和转换
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // 禁用核心polyfill
        'core-js': false,
        'regenerator-runtime': false,
        'es6-promise': false,
        'whatwg-fetch': false,
        // 禁用其他polyfill
        'buffer': false,
        'crypto': false,
        'stream': false,
        'util': false,
        'assert': false,
        'http': false,
        'https': false,
        'os': false,
        'url': false,
      };

      // 移除polyfill别名
      config.resolve.alias = {
        ...config.resolve.alias,
        'core-js/stable': false,
        'core-js/features': false,
        'core-js/es': false,
        'core-js/web': false,
        'regenerator-runtime/runtime': false,
        '@babel/runtime': false,
      };

      // 现代浏览器目标配置
      config.target = 'web';
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        minimize: true,
        // 针对现代浏览器的chunk分割
        splitChunks: {
          ...config.optimization.splitChunks,
          maxInitialRequests: 30,
          maxAsyncRequests: 30,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              chunks: 'all',
              enforce: true,
            },
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              priority: 20,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      };

    }
    return config;
  },
  // 静态导出模式下不需要rewrites和headers配置
};

export default nextConfig;
