import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/lib/site";
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jetbrains.variable}>
      <body className="min-h-dvh antialiased">
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
