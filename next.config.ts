import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Mail attachments arrive as server-action FormData (up to 3 × 500 KB). The framework
  // default is 1 MB, so raise it just enough; Vercel's request-body cap is 4.5 MB.
  experimental: {
    serverActions: {
      bodySizeLimit: '3mb',
    },
  },
  // Every page in this app is per-user (session cookie), so we use the classic dynamic
  // rendering model instead of Cache Components. Revisit if we add public marketing pages.
  cacheComponents: false,
  // PGlite ships WASM + data files; let Node load it natively instead of bundling it.
  serverExternalPackages: ['@electric-sql/pglite'],
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
