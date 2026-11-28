// Plain JS (not next.config.ts): the production host can't load Next's native SWC binary
// (old glibc), and the WASM fallback can't compile a TypeScript config.
/** @type {import("next").NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
