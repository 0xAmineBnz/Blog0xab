import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { ArticleWithRelations } from "@/lib/content.types";

/**
 * A single article entry in a vertical list: large clickable title, a small
 * meta line, an excerpt, and a "Read More" link. No cards — just type and space.
 */
export function ArticleListItem({
  article,
}: {
  article: ArticleWithRelations;
}) {
  const href = `/blog/${article.slug}`;
  const date = article.published_at ?? article.created_at;

  return (
    <article>
      <h2 className="text-2xl font-bold leading-tight sm:text-[1.7rem]">
        <Link
          href={href}
          className="no-underline-link text-heading transition-colors hover:text-accent"
        >
          {article.title}
        </Link>
      </h2>

      <div className="tnum mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-2">
        <time dateTime={date}>{formatDate(date)}</time>
        {article.category && (
          <>
            <span aria-hidden>·</span>
            <Link
              href={`/categories/${article.category.slug}`}
              className="no-underline-link text-muted transition-colors hover:text-accent"
            >
              {article.category.name}
            </Link>
          </>
        )}
        <span aria-hidden>·</span>
        <span>{article.reading_minutes} min read</span>
      </div>

      {article.excerpt && (
        <p className="mt-3.5 max-w-[68ch] text-[0.95rem] leading-relaxed text-muted">
          {article.excerpt}
        </p>
      )}

      <div className="mt-3.5">
        <Link href={href}>Read More →</Link>
      </div>
    </article>
  );
}

/** Vertical list of articles separated by dotted hairlines and whitespace. */
export function ArticleList({
  articles,
}: {
  articles: ArticleWithRelations[];
}) {
  return (
    <div className="flex flex-col">
      {articles.map((article, i) => (
        <div key={article.id} className={i > 0 ? "border-t border-dashed border-border-strong pt-12 mt-12" : ""}>
          <ArticleListItem article={article} />
        </div>
      ))}
    </div>
  );
}
