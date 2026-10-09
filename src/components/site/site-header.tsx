import Link from "next/link";
import { Container } from "@/components/site/section";
import { SiteSearch } from "@/components/site/site-search";
import { siteConfig } from "@/lib/site";

const NAV = [...siteConfig.nav];

export function SiteHeader() {
  return (
    <header className="border-b border-border-strong bg-surface">
      <Container className="pt-12 pb-7 sm:pt-16">
        {/* masthead */}
        <Link
          href="/"
          aria-label={`${siteConfig.name} — home`}
          className="no-underline-link inline-block text-3xl font-bold tracking-tight text-heading sm:text-4xl"
        >
          <span className="text-muted-2">./</span>
          {siteConfig.name}
        </Link>

        {/* identity line — the things I do */}
        <p className="mt-3 text-sm text-muted-2">
          <span className="text-muted-2">{"// "}</span>
          <span className="text-muted">{siteConfig.roles.join("  ·  ")}</span>
        </p>

        {/* nav + search */}
        <nav className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          {NAV.map((item) => (
            <span key={item.href} className="text-muted-2">
              [<Link href={item.href}>{item.label}</Link>]
            </span>
          ))}
          <SiteSearch />
        </nav>
      </Container>
    </header>
  );
}
