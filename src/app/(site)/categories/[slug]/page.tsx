import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/site/section";
import { ArticleList } from "@/components/site/article-list";
import { Pagination } from "@/components/site/pagination";
import { EmptyState } from "@/components/site/empty-state";
import {
  getCategoryBySlug,
  getPublishedArticles,
  countPublishedArticles,
} from "@/lib/queries";
import { categoryMeta } from "@/lib/site";

// See `app/(site)/page.tsx` — dynamic render, cached queries.
//
// `generateStaticParams` was removed with the ISR config: it fed a prerender
// that could never succeed through the nonce-stamping root layout. Next was
// silently bailing these pages out to dynamic rendering on every build.
export const dynamic = "force-dynamic";
const PAGE_SIZE = 10;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = categoryMeta(slug);
  const cat = await getCategoryBySlug(slug);
  const name = cat?.name ?? meta?.name;
  if (!name) return { title: "Category" };
  return {
    title: `${name} — research`,
    description:
      cat?.description ?? meta?.blurb ?? `${name} research and writeups.`,
    alternates: { canonical: `/categories/${slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const meta = categoryMeta(slug);
  const cat = await getCategoryBySlug(slug);
  if (!cat && !meta) notFound();

  const [articles, total] = await Promise.all([
    getPublishedArticles({
      categorySlug: slug,
      offset: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    }),
    countPublishedArticles(slug),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const name = cat?.name ?? meta!.name;
  const blurb = cat?.description ?? meta?.blurb ?? "";

  return (
    <Container className="py-12 sm:py-16">
      <p className="text-xs text-muted-2">
        <Link
          href="/"
          className="no-underline-link text-muted transition-colors hover:text-accent"
        >
          ← all posts
        </Link>
      </p>

      <h1 className="mt-6 text-3xl font-bold text-heading sm:text-4xl">{name}</h1>
      <p className="tnum mt-2 text-xs text-muted-2">
        {total} {total === 1 ? "entry" : "entries"}
      </p>
      {blurb && <p className="mt-3 max-w-[68ch] text-muted">{blurb}</p>}

      <div className="rule-dashed my-10" />

      {articles.length === 0 ? (
        <EmptyState
          command={`ls ./posts/${slug}`}
          title="no entries in this category yet"
        />
      ) : (
        <>
          <ArticleList articles={articles} />
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath={`/categories/${slug}`}
          />
        </>
      )}
    </Container>
  );
}
