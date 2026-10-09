import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strip the `X-Powered-By: Next.js` response header — it only advertises the
  // framework (and hints at its version range) to anyone probing the app.
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // Cover images are local `/public` assets, so no remote hosts are allowed.
    // Do NOT use `hostname: "**"` — that turns the image optimizer into an
    // open proxy / SSRF vector.
    remotePatterns: [],
  },
  async redirects() {
    return [
      // The blog index was merged into the home page; articles still live at
      // /blog/[slug]. 301 the old index so external links/SEO don't break.
      { source: "/blog", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
