import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "@/lib/csp";

// Static hardening headers applied to every route. The Content-Security-Policy
// is NOT here: it needs a fresh per-request nonce, so it is generated inline
// and set per response. Source of truth for all security policies.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

/**
 * Stamps a per-request CSP nonce and applies the static hardening headers.
 *
 * The request-side `Content-Security-Policy` header lets Next.js nonce its
 * bootstrap scripts. The same CSP is set on every response so the browser
 * enforces it.
 */
export function applySecurityHeaders(request: NextRequest): NextResponse {
  // 122 bits of randomness per request; hex is a valid CSP nonce charset.
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCsp(nonce, process.env.NODE_ENV !== "production");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  securityHeaders.forEach(({ key, value }) => {
    response.headers.set(key.toLowerCase(), value);
  });
  return response;
}
