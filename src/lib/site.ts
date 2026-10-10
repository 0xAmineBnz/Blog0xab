/**
 * Central site configuration. Tweak identity here; everything else reads from it.
 */

/**
 * Absolute origin for canonicals, OG tags, JSON-LD and the sitemap.
 *
 * Only read from server code, so the configured URL takes effect at runtime
 * and does not need to be baked in at build time.
 *
 * The localhost fallback is a dev convenience that used to apply silently in
 * production too — every canonical, OG URL and sitemap entry would then point
 * at `http://localhost:3000`, which search engines index as-is. Warn loudly
 * instead of failing: an unreachable canonical is bad, but a blog that refuses
 * to boot over a missing env var is worse.
 */
function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[site] NEXT_PUBLIC_SITE_URL is unset — canonical URLs, OpenGraph tags " +
        "and sitemap.xml will all advertise http://localhost:3000.",
    );
  }
  return "http://localhost:3000";
}

export const siteConfig = {
  name: "0xAB",
  handle: "ab",
  title: "0xAB // cybersecurity research",
  role: "DevSecOps · cloud security · application security",
  description:
    "Notes on DevSecOps, DevOps, application security, cloud security, and compliance — documented by a cybersecurity student, incoming MSc Cybersecurity at Université de Paris.",
  // Set NEXT_PUBLIC_SITE_URL to your real domain in any deployed environment.
  url: resolveSiteUrl(),
  locale: "en_US",
  // Short identity lines under the masthead (terminal `whoami` style).
  roles: ["Cybersecurity student", "DevSecOps", "Cloud & app security"],
  author: {
    name: "AB",
    alias: "0xAB",
    bio: "Cybersecurity student focused on DevSecOps, cloud security and application security. Incoming MSc Cybersecurity, Université de Paris.",
    affiliation: "Université de Paris — MSc Cybersecurity",
  },
  links: {
    github: "https://github.com/0xAmineBnz",
  },
  // The home page is the post index. `Home` returns there from any deeper page
  // (the masthead logo also links home, but a labelled nav item is discoverable).
  nav: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;

/**
 * Canonical category taxonomy and the single source of truth for categories.
 * An article's `category` front-matter field (in content/articles/*.md) MUST
 * match one of these `slug`s, or it renders without a category.
 */
export const CATEGORIES = [
  {
    slug: "devsecops",
    name: "DevSecOps",
    code: "DSO",
    blurb: "Pipeline security, scanning gates, supply chain, SBOMs.",
  },
  {
    slug: "devops",
    name: "DevOps",
    code: "OPS",
    blurb: "CI/CD, containers, IaC, observability, automation.",
  },
  {
    slug: "application-security",
    name: "Application Security",
    code: "APP",
    blurb: "SAST/DAST, dependencies, secure defaults, threat modeling.",
  },
  {
    slug: "cloud-security",
    name: "Cloud Security",
    code: "CLD",
    blurb: "IAM, least privilege, posture, secrets, cloud hardening.",
  },
  {
    slug: "compliance",
    name: "Compliance & Policy",
    code: "GRC",
    blurb: "Controls, frameworks, audit, policy-as-code, governance.",
  },
  {
    slug: "networking",
    name: "Networking",
    code: "NET",
    blurb: "Protocols, segmentation, TLS, zero-trust, traffic analysis.",
  },
] as const;

export type CategoryMeta = (typeof CATEGORIES)[number];

export function categoryMeta(slug: string): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
