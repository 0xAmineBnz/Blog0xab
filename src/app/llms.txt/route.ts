import { getLatestArticles } from "@/lib/queries";
import { siteConfig, CATEGORIES } from "@/lib/site";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

/**
 * llms.txt — a concise, AI-readable index of the site (GEO / AI search).
 * https://llmstxt.org
 */
export async function GET() {
  const base = siteConfig.url;
  const articles = await getLatestArticles(25);

  const lines = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    `Author: ${siteConfig.author.name} (${siteConfig.author.alias}). ${siteConfig.author.affiliation}.`,
    "",
    "## Categories",
    ...CATEGORIES.map((c) => `- [${c.name}](${base}/categories/${c.slug}): ${c.blurb}`),
    "",
    "## Recent research",
    ...articles.map(
      (a) =>
        `- [${a.title}](${base}/blog/${a.slug})${a.excerpt ? `: ${a.excerpt}` : ""}`,
    ),
    "",
    "## Feeds",
    `- [Sitemap](${base}/sitemap.xml)`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
