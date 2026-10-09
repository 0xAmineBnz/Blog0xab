import type { NextRequest } from "next/server";
import { applySecurityHeaders } from "@/lib/security-headers";

// Next.js 16 renamed the `middleware` convention to `proxy`. This stamps the
// per-request CSP nonce and hardening headers on every matched request.
export function proxy(request: NextRequest) {
  return applySecurityHeaders(request);
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets, images and metadata files so the
     * security headers are stamped across the app without processing assets.
     */
    "/((?!_next/static|_next/image|favicon.svg|favicon.ico|robots.txt|sitemap.xml|og|llms.txt|manifest.webmanifest|.*\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};
