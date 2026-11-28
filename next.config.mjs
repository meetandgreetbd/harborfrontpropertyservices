// Plain JS (not next.config.ts): the production host can't load Next's native SWC binary
// (old glibc), and the WASM fallback can't compile a TypeScript config.
/** @type {import("next").NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // The build host reports 40+ cores; that many prerender workers each opening database
    // connections exceeds shared hosting's per-user MySQL connection limit.
    cpus: 4,
  },
};

export default nextConfig;
