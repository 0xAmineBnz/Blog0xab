/**
 * Builds the per-request Content-Security-Policy.
 *
 * `script-src` intentionally has NO `'unsafe-inline'`: inline scripts run only
 * if they carry the current request's random `nonce`, so injected inline
 * scripts can't execute.
 *
 * `'strict-dynamic'` extends that trust to scripts loaded *by* an already
 * trusted script — e.g. Next.js chunk loading. In exchange, CSP3 browsers
 * ignore the host allowlist below entirely, so `'self'` stops being a script
 * source; those entries remain only as a fallback for browsers too old to
 * understand `'strict-dynamic'`.
 *
 * In development we additionally allow `'unsafe-eval'`: the dev bundler wraps
 * modules in `eval()` for Fast Refresh and source maps. It is gated on
 * `NODE_ENV`, so the production header never carries it.
 */
export function buildCsp(nonce: string, isDev = false): string {
  const scriptSrc = [
    "script-src 'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    isDev ? "'unsafe-eval'" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    // Cover images are local `/public` assets served from `'self'`.
    "img-src 'self' data: blob:",
    scriptSrc,
    // Inline styles remain allowed: Next.js / next-font stream nonce-less inline
    // <style> blocks that can't currently be nonced. `script-src` is the value
    // target for tightening here; styles are a lower-risk surface.
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self'",
    "font-src 'self' data:",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}
