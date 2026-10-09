import "server-only";
import { cache } from "react";
import { ARTICLES } from "@/lib/articles";
import { CATEGORIES } from "@/lib/site";
import type {
  ArticleWithRelations,
  CategoryRow,
  TagRow,
} from "@/lib/content.types";

/**
 * Public read layer. The content corpus is static and lives in the repo
 * (`content/articles/*.md`), parsed once into `ARTICLES` at module load, so
 * every query below is an in-memory filter over that array — no database, no
 * cross-request cache needed. React `cache()` is kept only to dedupe repeated
 * calls within a single render pass.
 */

export interface ArticleQuery {
  limit?: number;
  offset?: number;
  categorySlug?: string;
  tagSlug?: string;
  featured?: boolean;
  excludeId?: string;
}

/** Published articles, newest first, with optional category/tag filters. */
export const getPublishedArticles = cache(
  async (q: ArticleQuery = {}): Promise<ArticleWithRelations[]> => {
    let articles = ARTICLES;

    if (q.featured) articles = articles.filter((a) => a.featured);
    if (q.excludeId) articles = articles.filter((a) => a.id !== q.excludeId);
    if (q.categorySlug)
      articles = articles.filter((a) => a.category?.slug === q.categorySlug);
    if (q.tagSlug)
      articles = articles.filter((a) =>
        a.tags.some((t) => t.slug === q.tagSlug),
      );

    if (typeof q.offset === "number" && typeof q.limit === "number") {
      articles = articles.slice(q.offset, q.offset + q.limit);
    } else if (q.limit) {
      articles = articles.slice(0, q.limit);
    }

    return articles;
  },
);

export const getFeaturedArticles = cache((limit = 3) =>
  getPublishedArticles({ featured: true, limit }),
);

export const getLatestArticles = cache((limit = 6) =>
  getPublishedArticles({ limit }),
);

export const getArticleBySlug = cache(
  async (slug: string): Promise<ArticleWithRelations | null> =>
    ARTICLES.find((a) => a.slug === slug) ?? null,
);

/**
 * Related by shared category; falls back to latest.
 */
export const getRelatedArticles = cache(
  async (
    article: ArticleWithRelations,
    limit = 3,
  ): Promise<ArticleWithRelations[]> => {
    const pool = await getPublishedArticles({
      categorySlug: article.category?.slug,
      excludeId: article.id,
      limit: limit + 2,
    });
    if (pool.length >= limit) return pool.slice(0, limit);
    const fillers = (await getLatestArticles(limit + 3)).filter(
      (a) => a.id !== article.id && !pool.some((p) => p.id === a.id),
    );
    return [...pool, ...fillers].slice(0, limit);
  },
);

/** Resolve a category from the static taxonomy in `src/lib/site.ts`. */
export const getCategoryBySlug = cache(
  async (slug: string): Promise<CategoryRow | null> => {
    const meta = CATEGORIES.find((c) => c.slug === slug);
    if (!meta) return null;
    return {
      id: meta.slug,
      slug: meta.slug,
      name: meta.name,
      code: meta.code,
      description: meta.blurb,
      created_at: "",
    };
  },
);

export interface CategoryWithCount extends CategoryRow {
  count: number;
}

/** All categories with the number of published articles in each. */
export const getCategoriesWithCounts = cache(
  async (): Promise<CategoryWithCount[]> => {
    const counts = new Map<string, number>();
    for (const a of ARTICLES) {
      const slug = a.category?.slug;
      if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
    return CATEGORIES.map((c) => ({
      id: c.slug,
      slug: c.slug,
      name: c.name,
      code: c.code,
      description: c.blurb,
      created_at: "",
      count: counts.get(c.slug) ?? 0,
    }));
  },
);

/** Union of tags across all published articles, name-sorted. */
export const getAllTags = cache(async (): Promise<TagRow[]> => {
  const seen = new Map<string, TagRow>();
  for (const a of ARTICLES) {
    for (const t of a.tags) {
      if (!seen.has(t.slug))
        seen.set(t.slug, {
          id: t.slug,
          slug: t.slug,
          name: t.name,
          created_at: "",
        });
    }
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
});

export const getTagBySlug = cache(
  async (slug: string): Promise<TagRow | null> => {
    const tags = await getAllTags();
    return tags.find((t) => t.slug === slug) ?? null;
  },
);

/**
 * In-memory search across published articles. Matches title / excerpt /
 * content text; title matches rank highest, then excerpt, then body.
 */
export async function searchArticles(
  q: string,
): Promise<ArticleWithRelations[]> {
  const term = q.trim().toLowerCase();
  if (!term) return [];

  const scored: { article: ArticleWithRelations; score: number }[] = [];
  for (const a of ARTICLES) {
    let score = 0;
    if (a.title.toLowerCase().includes(term)) score += 3;
    if (a.excerpt?.toLowerCase().includes(term)) score += 2;
    if (a.content_text.toLowerCase().includes(term)) score += 1;
    if (score > 0) scored.push({ article: a, score });
  }
  scored.sort(
    (x, y) =>
      y.score - x.score ||
      (y.article.published_at ?? "").localeCompare(x.article.published_at ?? ""),
  );
  return scored.map((s) => s.article);
}

/** Slugs + timestamps for sitemap generation. */
export const getAllPublishedRefs = cache(
  async (): Promise<{ slug: string; updated_at: string }[]> =>
    ARTICLES.map((a) => ({ slug: a.slug, updated_at: a.updated_at })),
);

/** Count of published articles, optionally within a category. */
export const countPublishedArticles = cache(
  async (categorySlug?: string): Promise<number> => {
    if (!categorySlug) return ARTICLES.length;
    return ARTICLES.filter((a) => a.category?.slug === categorySlug).length;
  },
);
