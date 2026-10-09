<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md

Personal cybersecurity research blog. Terminal-native dark aesthetic.

## Commands
- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` — production build (also runs tsc + eslint)
- `npm run typecheck` / `npm run lint`
- Install deps with `npm install --legacy-peer-deps` (React 19 peer ranges).

## Stack & conventions
- Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4 (CSS `@theme`).
- Content is flat files in the repo — no database. Articles live as
  `content/articles/<slug>.md` (YAML front matter + Markdown/HTML body), parsed
  once at module load by `src/lib/articles.ts` (gray-matter + markdown-it).
- Security-header/CSP-nonce stamping is `src/lib/security-headers.ts`,
  applied from `src/proxy.ts` (Next 16 renamed middleware→proxy).
- Design tokens + prose + hljs theme live in `src/app/globals.css`.
- Site identity / category taxonomy: `src/lib/site.ts` (single source of truth
  for categories; an article's `category` front-matter must match a slug here).
- Public data access: `src/lib/queries.ts` — in-memory filters over the loaded
  articles. Types: `src/lib/content.types.ts`.
- Article HTML is sanitized + highlighted server-side in `src/lib/content.ts`
  (`processArticleHtml`); every article body still passes through it at render.

## Adding a post
Add a Markdown file under `content/articles/` with front matter (`title`,
`slug`, `excerpt`, `category`, `tags`, optional `cover`/`featured`,
`publishedAt`) and commit. Set `published: false` to keep it as a draft.

See README.md for full setup and deploy.
