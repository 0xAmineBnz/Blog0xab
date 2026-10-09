import { NextResponse } from "next/server";
import { searchArticles } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const articles = await searchArticles(q);
  const results = articles.slice(0, 8).map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    category: a.category?.name ?? null,
    code: a.category?.code ?? null,
  }));

  return NextResponse.json({ results });
}
