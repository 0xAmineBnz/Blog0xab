import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/lib/site";
import { themeInitScript } from "@/lib/themes";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.author.name }],
  creator: siteConfig.author.name,
  keywords: [
    "cybersecurity",
    "devsecops",
    "devops",
    "application security",
    "cloud security",
    "compliance",
    "networking",
    "research blog",
  ],
  alternates: {
    canonical: "/",
    types: {},
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    creator: `@${siteConfig.handle}`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Per-request nonce set by the proxy; ties the inline theme script to
  // the strict, `unsafe-inline`-free `script-src`.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="en"
      className={jetbrains.variable}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        {/*
          `suppressHydrationWarning`: once CSP is enforced the browser blanks the
          `nonce` content attribute in the DOM (the real value lives in an
          internal slot) so it can't be exfiltrated by CSS attribute selectors.
          React reads the DOM during hydration, sees "" where it rendered the
          nonce, and reports a mismatch. The script has already run by then, so
          there is nothing to reconcile.
        */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <a
          href="#main"
          className="no-underline-link sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-accent focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-accent"
        >
          skip to content
        </a>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
