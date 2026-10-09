import Link from "next/link";
import { Container } from "@/components/site/section";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getUTCFullYear();
  return (
    <footer className="mt-24 pb-16">
      <Container>
        <div className="rule-dashed mb-8" />
        <div className="flex flex-col gap-3 text-xs text-muted-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.author.name} · {siteConfig.author.affiliation}
          </p>
          <nav className="flex flex-wrap gap-x-4">
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              github
            </Link>
            <Link href={`mailto:${siteConfig.author.email}`}>email</Link>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
