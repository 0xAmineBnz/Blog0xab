/**
 * Hand-written content types for the flat-file model (content/articles/*.md).
 *
 * These deliberately keep the names the rest of the app already imports
 * (`ArticleRow`, `ArticleWithRelations`, `CategoryRow`, `TagRow`) so swapping
 * the data layer from Supabase to the filesystem touched no consuming file.
 *
 * Dropped from the old Supabase-generated shape: the `author` relation and
 * `view_count` (the site never rendered author info, and view counting was
 * removed with the database), plus `ProfileRow` / the `Database` generic /
 * newsletter types, whose only consumers were the deleted admin surface.
 */

/** A single published article, as loaded from a `content/articles/*.md` file. */
export interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  content_text: string;
  cover_image: string | null;
  category_id: string | null;
  published: boolean;
  featured: boolean;
  published_at: string | null;
  reading_minutes: number;
  created_at: string;
  updated_at: string;
}

/** A category from the static taxonomy in `src/lib/site.ts`. */
export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  code: string | null;
  description: string | null;
  created_at: string;
}

/** A tag, derived from the union of `tags` across all published articles. */
export interface TagRow {
  id: string;
  slug: string;
  name: string;
  created_at: string;
}

/** Article joined with its category and tags (the shape the UI consumes). */
export type ArticleWithRelations = ArticleRow & {
  category: Pick<CategoryRow, "slug" | "name" | "code"> | null;
  tags: Pick<TagRow, "slug" | "name">[];
};
