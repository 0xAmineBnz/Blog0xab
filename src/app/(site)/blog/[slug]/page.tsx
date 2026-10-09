import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Container } from "@/components/site/section";
import { CodeEnhancer } from "@/components/article/code-enhancer";

import { getArticleBySlug, getRelatedArticles } from "@/lib/queries";
import { processArticleHtml } from "@/lib/content";
import { siteConfig } from "@/lib/site";
import { formatDate, formatDateLong } from "@/lib/utils";

// Keep dynamic rendering so the proxy can provide a fresh CSP nonce per
// response. Other pages opt out implicitly by awaiting `searchParams`; this
// route has none, so it must say so explicitly.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Not found" };

  const url = `${siteConfig.url}/blog/${article.slug}`;
  const description = article.excerpt ?? siteConfig.description;
  const ogImage =
    article.cover_image ??
    `${siteConfig.url}/og?title=${encodeURIComponent(article.title)}&cat=${encodeURIComponent(article.category?.code ?? "")}`;

  return {
    title: article.title,
    description,
    alternates: { canonical: `/blog/${article.slug}` },
    authors: [{ name: siteConfig.author.name }],
    keywords: article.tags.map((t) => t.name),
    openGraph: {
      type: "article",
      url,
      title: article.title,
      description,
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at,
      authors: [siteConfig.author.name],
      section: article.category?.name,
      tags: article.tags.map((t) => t.name),
      images: [{ url: ogImage, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const { html } = processArticleHtml(article.content);
  const related = await getRelatedArticles(article, 3);
  const url = `${siteConfig.url}/blog/${article.slug}`;
  const date = article.published_at ?? article.created_at;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt ?? undefined,
    image: article.cover_image ? [article.cover_image] : undefined,
    datePublished: article.published_at ?? article.created_at,
    dateModified: article.updated_at,
    author: { "@type": "Person", name: siteConfig.author.name, url: siteConfig.url },
    publisher: { "@type": "Person", name: siteConfig.author.name },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: article.category?.name,
    keywords: article.tags.map((t) => t.name).join(", "),
    wordCount: article.content_text?.split(/\s+/).filter(Boolean).length,
  };

  return (
    <Container className="py-12 sm:py-16">
      <script
        type="application/ld+json"
        // Escape `<` so a title/excerpt containing `</script>` cannot break out
        // of the JSON-LD block and inject markup.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <article>
        {/* breadcrumb */}
        <nav className="flex flex-wrap items-center gap-x-2 text-xs text-muted-2">
          <Link
            href="/"
            className="no-underline-link text-muted transition-colors hover:text-accent"
          >
            ~/blog
          </Link>
          {article.category && (
            <>
              <span aria-hidden>/</span>
              <Link
                href={`/categories/${article.category.slug}`}
                className="no-underline-link text-muted transition-colors hover:text-accent"
              >
                {article.category.slug}
              </Link>
            </>
          )}
        </nav>

        {/* title */}
        <h1 className="mt-6 text-3xl font-bold leading-tight text-heading sm:text-[2.4rem]">
          {article.title}
        </h1>

        {/* meta */}
        <div className="tnum mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-2">
          <span>{formatDateLong(date)}</span>
          {article.category && (
            <>
              <span aria-hidden>·</span>
              <span>{article.category.name}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <span>{article.reading_minutes} min read</span>
        </div>

        {article.excerpt && (
          <p className="mt-5 max-w-[68ch] leading-relaxed text-muted">
            {article.excerpt}
          </p>
        )}

        {/* cover */}
        {article.cover_image && (
          <div className="relative mt-8 aspect-[2/1] w-full overflow-hidden border border-border">
            <Image
              src={article.cover_image}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 800px) 100vw, 800px"
              className="object-cover"
            />
          </div>
        )}

        <div className="rule-dashed my-10" />

        {/* body */}
        <div
          id="article-body"
          className="prose-cyber"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <CodeEnhancer />

        {/* tags */}
        {article.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-x-3 gap-y-1.5 text-sm">
            <span className="text-muted-2">tags:</span>
            {article.tags.map((t) => (
              <Link key={t.slug} href={`/tags/${t.slug}`}>
                #{t.slug}
              </Link>
            ))}
          </div>
        )}
      </article>

      {/* related */}
      {related.length > 0 && (
        <section className="mt-14">
          <div className="rule-dashed mb-8" />
          <h2 className="text-lg font-bold text-heading">
            <span className="text-muted-2">$ </span>related
          </h2>
          <ul className="mt-4 space-y-2.5">
            {related.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-baseline gap-x-3 text-sm"
              >
                <span className="tnum shrink-0 text-xs text-muted-2">
                  {formatDate(a.published_at ?? a.created_at)}
                </span>
                <Link href={`/blog/${a.slug}`}>{a.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-14 border-t border-dashed border-border-strong pt-8 text-sm">
        <Link href="/">← all posts</Link>
      </div>
    </Container>
  );
}
