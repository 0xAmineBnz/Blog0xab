import type { MetadataRoute } from "next";
import { getAllPublishedRefs, getAllTags } from "@/lib/queries";
import { siteConfig, CATEGORIES } from "@/lib/site";

// The one surviving `revalidate` in the app, and it genuinely works: a metadata
// route does not render through the root layout, so no per-request CSP nonce is
// involved and Next can actually cache the output.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const [articles, tags] = await Promise.all([
    getAllPublishedRefs(),
    getAllTags(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${base}/categories/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${base}/blog/${a.slug}`,
    lastModified: new Date(a.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const tagRoutes: MetadataRoute.Sitemap = tags.map((t) => ({
    url: `${base}/tags/${t.slug}`,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes, ...tagRoutes];
}
