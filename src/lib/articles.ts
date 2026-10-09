import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import { htmlToText } from "@/lib/content";
import { categoryMeta } from "@/lib/site";
import type { ArticleWithRelations } from "@/lib/content.types";

/**
 * Flat-file content loader: articles live as `content/articles/<slug>.md`
 * (YAML front matter + Markdown/HTML body). The corpus ships in the repo, so
 * everything is parsed once at module load and served from memory.
 *
 * SECURITY: the body assembled here is NOT trusted output — it still passes
 * through `processArticleHtml()` (sanitize-html allowlist) at render time.
 * This loader only builds the raw HTML string that pipeline consumes.
 */

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

// `html: true` lets article bodies authored as raw HTML pass through
// verbatim; Markdown syntax still renders for plain-Markdown posts.
const md = new MarkdownIt({ html: true, linkify: false, typographer: false });

interface FrontMatter {
  title?: string;
  slug?: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  cover?: string;
  featured?: boolean;
  published?: boolean;
  publishedAt?: string;
}

function toIso(value: unknown, fallback: string): string {
  if (!value) return fallback;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? fallback : d.toISOString();
}

function loadOne(file: string): ArticleWithRelations | null {
  const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const fm = data as FrontMatter;

  const slug = fm.slug ?? file.replace(/\.md$/, "");
  if (!slug || !fm.title) return null;
  if (fm.published === false) return null;

  // A body that begins with an HTML tag is passed through verbatim: CommonMark
  // ends an HTML block at the first blank line, which would shred code blocks
  // containing blank lines. Plain-Markdown bodies (anything not starting with
  // `<`) are rendered normally. Either way the result is still sanitized +
  // highlighted by processArticleHtml() at render time.
  const body = content.trim();
  const html = body.startsWith("<") ? body : md.render(content);
  const contentText = htmlToText(html);
  const words = contentText.split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(words / 200));

  const publishedAt = toIso(fm.publishedAt, new Date(0).toISOString());
  const catMeta = fm.category ? categoryMeta(fm.category) : undefined;

  return {
    id: slug,
    title: fm.title,
    slug,
    excerpt: fm.excerpt ?? null,
    content: html,
    content_text: contentText,
    cover_image: fm.cover ?? null,
    category_id: catMeta?.slug ?? null,
    published: true,
    featured: Boolean(fm.featured),
    published_at: publishedAt,
    reading_minutes: readingMinutes,
    created_at: publishedAt,
    updated_at: publishedAt,
    category: catMeta
      ? { slug: catMeta.slug, name: catMeta.name, code: catMeta.code }
      : null,
    tags: (fm.tags ?? []).map((t) => ({ slug: t, name: t })),
  };
}

function loadAll(): ArticleWithRelations[] {
  let files: string[];
  try {
    files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  return files
    .map(loadOne)
    .filter((a): a is ArticleWithRelations => a !== null)
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
}

/** All published articles, newest first. Parsed once at module load. */
export const ARTICLES: ArticleWithRelations[] = loadAll();
