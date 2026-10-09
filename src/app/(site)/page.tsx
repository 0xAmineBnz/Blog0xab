import Link from "next/link";
import { ArticleList } from "@/components/site/article-list";
import { Container } from "@/components/site/section";
import { Pagination } from "@/components/site/pagination";
import { EmptyState } from "@/components/site/empty-state";
import {
  getPublishedArticles,
  getCategoriesWithCounts,
  countPublishedArticles,
} from "@/lib/queries";

// Dynamic, like every public page: the root layout stamps a per-request CSP
// nonce via `headers()`, so no HTML here can be prerendered. Freshness comes
// from the tag-invalidated query cache in `lib/queries.ts`, not from ISR.
export const dynamic = "force-dynamic";
const PAGE_SIZE = 10;

// The home page IS the post index — paginated and filterable. Identity lives in
// the masthead (roles) and /about; this page just frames and lists the writing.
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [articles, total, categories] = await Promise.all([
    getPublishedArticles({ offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE }),
    countPublishedArticles(),
    getCategoriesWithCounts(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const withPosts = categories.filter((c) => c.count > 0);

  return (
    <Container className="py-12 sm:py-16">
      <header>
        <h1 className="text-3xl font-bold text-heading sm:text-4xl">
          <span className="text-muted-2">$ </span>ls ./posts
        </h1>
        <p className="mt-3 max-w-[68ch] text-muted">
          {total > 0 ? `${total} ` : ""}entries across DevSecOps, DevOps,
          application security, cloud security and more — newest first.
        </p>

        {withPosts.length > 0 && (
          <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
            <span className="text-muted-2">filter:</span>
            <span className="text-accent">all</span>
            {withPosts.map((c) => (
              <Link key={c.slug} href={`/categories/${c.slug}`}>
                {c.name}
                <span className="text-muted-2"> {c.count}</span>
              </Link>
            ))}
          </p>
        )}
      </header>

      <div className="rule-dashed my-10" />

      {articles.length === 0 ? (
        <EmptyState
          command="ls ./posts"
          title="no posts published yet"
          hint="Add a Markdown file under content/articles/ and commit to publish."
        />
      ) : (
        <>
          <ArticleList articles={articles} />
          <Pagination page={page} totalPages={totalPages} basePath="/" />
        </>
      )}
    </Container>
  );
}
