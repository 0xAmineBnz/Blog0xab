import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/site/section";
import { ArticleList } from "@/components/site/article-list";
import { Pagination } from "@/components/site/pagination";
import { EmptyState } from "@/components/site/empty-state";
import { getTagBySlug, getPublishedArticles } from "@/lib/queries";

// See `app/(site)/page.tsx` — dynamic render, cached queries.
export const dynamic = "force-dynamic";
const PAGE_SIZE = 10;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  const name = tag?.name ?? slug;
  return {
    title: `#${name} — research`,
    description: `Articles tagged #${name}.`,
    alternates: { canonical: `/tags/${slug}` },
  };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const tag = await getTagBySlug(slug);
  // fetch a generous window then filter/paginate in memory (tag is a join)
  const all = await getPublishedArticles({ tagSlug: slug, limit: 200 });
  if (!tag && all.length === 0) {
    if (!/^[a-z0-9-]+$/.test(slug)) notFound();
  }

  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const articles = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const name = tag?.name ?? slug;

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

      <h1 className="mt-6 text-3xl font-bold text-heading sm:text-4xl">
        <span className="text-muted-2">#</span>
        {name}
      </h1>
      <p className="tnum mt-2 text-xs text-muted-2">
        {all.length} {all.length === 1 ? "entry" : "entries"}
      </p>

      <div className="rule-dashed my-10" />

      {articles.length === 0 ? (
        <EmptyState
          command={`grep -rl "#${slug}" ./posts`}
          title="no entries with this tag"
        />
      ) : (
        <>
          <ArticleList articles={articles} />
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath={`/tags/${slug}`}
          />
        </>
      )}
    </Container>
  );
}
