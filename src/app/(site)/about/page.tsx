import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/section";
import { siteConfig, CATEGORIES } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `About ${siteConfig.author.name} (${siteConfig.author.alias}) — cybersecurity student focused on DevSecOps, cloud security and application security.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <Container className="py-12 sm:py-16">
      <h1 className="text-3xl font-bold text-heading sm:text-4xl">
        <span className="text-muted-2">$ </span>whoami
      </h1>

      <div className="mt-6 max-w-[68ch] space-y-5 leading-relaxed text-muted">
        <p>
          I&apos;m {siteConfig.author.name} (
          <span className="text-accent">{siteConfig.author.alias}</span>) — a
          cybersecurity student pursuing my{" "}
          <span className="text-foreground">MSc</span> at{" "}
          <span className="text-foreground">Université de Paris</span>. This
          blog is where I document and explain the security practices, concepts
          and frameworks I&apos;m working through.
        </p>
        <p>
          It&apos;s two things at once: a way to consolidate my own experience
          and learning, and a resource for anyone trying to break into the field
          and looking for a clearer way in.
        </p>
        <p>
          Content mostly revolves around DevSecOps, cloud security and
          networking — with the occasional detour into cryptography.
        </p>
      </div>

      <div className="rule-dashed my-10" />

      <section className="flex flex-col gap-3 text-sm sm:flex-row sm:items-baseline sm:gap-6">
        <span className="shrink-0 text-muted-2">writes about</span>
        <p className="flex flex-wrap gap-x-4 gap-y-1.5">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/categories/${c.slug}`}>
              {c.name}
            </Link>
          ))}
        </p>
      </section>

      <section className="mt-5 flex flex-col gap-3 text-sm sm:flex-row sm:items-baseline sm:gap-6">
        <span className="shrink-0 text-muted-2">contact</span>
        <p className="flex flex-wrap gap-x-4 gap-y-1.5">
          <Link
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            github
          </Link>
          <Link href={`mailto:${siteConfig.author.email}`}>email</Link>
        </p>
      </section>
    </Container>
  );
}
