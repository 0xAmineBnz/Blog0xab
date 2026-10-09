# 0xAB — cybersecurity research blog

A dark, terminal-native personal research blog for DevSecOps, DevOps,
application security and cloud security work. Built to feel like it was made by
someone who secures their own apps, not a marketing team.

> Design DNA: monospace chrome, hairline borders, near-black surfaces, a single
> restrained terminal-green accent (`#00FF88`), engineering-grid backdrops and
> editor-style code blocks. Inspired by classic minimal hacker blogs, rebuilt as
> a fast, modern, production app.

---

## Stack

| Layer        | Choice                                                        |
| ------------ | ------------------------------------------------------------ |
| Framework    | **Next.js 16** (App Router, React 19, Server Components)      |
| Language     | **TypeScript** (strict)                                       |
| Styling      | **Tailwind CSS v4** + custom design tokens                   |
| UI           | shadcn-style primitives (Radix) + bespoke terminal components |
| Content      | **Flat files** — `content/articles/*.md` (gray-matter + markdown-it) |
| Highlighting | `highlight.js` (server-rendered)                             |
| Deploy       | **Vercel** / any Node.js host                                  |

There is **no database and no CMS**. Every article is a Markdown file committed
to the repo; the site reads them at startup and renders in memory.

---

## Features

**Public site**
- Homepage: `whoami`, featured + latest research, category filter, paginated index
- Article pages: sticky table of contents, server-side syntax highlighting,
  per-block copy buttons, estimated reading time, related posts, JSON-LD
- Categories, tag pages
- Global search: ⌘K command palette (in-memory ranking over title/excerpt/body)
- SEO: per-page metadata, Open Graph + **dynamic OG images**, `sitemap.xml`,
  `robots.txt`, `llms.txt`, web manifest, accessible markup

**Security**
- Per-request **CSP nonce** + `strict-dynamic`, stamped in
  `src/lib/security-headers.ts` (applied from `src/proxy.ts`)
- Hardening headers on every response: HSTS, `X-Frame-Options: DENY`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP, CORP
- Article HTML is sanitized (`sanitize-html`) **at render time** on every page

---

## Quick start

```bash
# 1. install
npm install --legacy-peer-deps

# 2. configure env (optional — set the deployed site's canonical URL)
cp .env.example .env.local
#    → set NEXT_PUBLIC_SITE_URL

# 3. run
npm run dev      # http://localhost:3000
```

No database to provision — the sample articles under `content/articles/` render
immediately.

---

## Writing a post

Add a Markdown file under **`content/articles/<slug>.md`** and commit it.

```md
---
title: "House of Force is dead — tcache poisoning in modern glibc"
slug: house-of-force-is-dead-tcache-poisoning
excerpt: "One-line summary shown in listings and meta tags."
category: application-security      # MUST match a slug in src/lib/site.ts
tags: [heap, glibc, tcache, pwn]
cover: /covers/house-of-force.png   # optional; a file under public/
featured: true                      # optional (default false)
published: true                     # optional (default true; false = draft)
publishedAt: 2026-08-18             # ISO date
---

<!-- Body: Markdown, or raw HTML (a body starting with `<` is passed through
     verbatim). Either way it is sanitized + syntax-highlighted at render. -->
## Background
...
```

Notes:
- `category` must be one of the slugs defined in `src/lib/site.ts` (`CATEGORIES`).
- Tags are free-form; tag pages are generated from the union of all tags.
- `reading_minutes` is derived automatically (~200 wpm); do not set it.
- Cover images live in `public/` (e.g. `public/covers/…`) and are referenced by
  their absolute path (`/covers/…`).

---

## Environment variables

| Variable               | Required | Notes                                           |
| ---------------------- | -------- | ----------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | prod     | Canonical origin (OG, sitemap, canonical URLs) |

The site also builds and serves without environment variables; set the URL
when deploying so canonical links and generated metadata use the right origin.

---

## Project structure

```
content/
└─ articles/                 # one Markdown file per post (the entire "CMS")
src/
├─ app/
│  ├─ (site)/                 # public site (shares header/footer layout)
│  │  ├─ page.tsx             # homepage = paginated post index
│  │  ├─ about/               # about page
│  │  ├─ blog/[slug]/         # article page
│  │  ├─ categories/[slug]/   # category pages
│  │  └─ tags/[slug]/         # tag pages
│  ├─ api/search/route.ts     # ⌘K search endpoint
│  ├─ og/route.tsx            # dynamic OG image (next/og)
│  ├─ sitemap.ts · robots.ts · llms.txt · manifest.ts
│  ├─ layout.tsx · globals.css   # root layout, fonts, design tokens
│  └─ not-found.tsx
├─ components/
│  ├─ ui/                     # command (⌘K), dialog, sonner (toasts)
│  ├─ site/                   # header, footer, article list, search, …
│  └─ article/                # code-enhancer (copy buttons / lang labels)
├─ lib/
│  ├─ articles.ts             # loads + parses content/articles/*.md
│  ├─ queries.ts              # public data access (in-memory filters)
│  ├─ content.ts              # sanitize · highlight · TOC pipeline
│  ├─ content.types.ts        # hand-written content types
│  ├─ csp.ts · security-headers.ts   # CSP + hardening headers
│  └─ site.ts · utils.ts · themes.ts
└─ proxy.ts                   # security headers and CSP nonce
```

---

## Deploy

**Vercel:** push to GitHub, import the repo, set `NEXT_PUBLIC_SITE_URL` to the
production domain, and deploy.

**Any Node.js host:** use Node.js 24, install dependencies with
`npm ci --legacy-peer-deps`, build with `npm run build`, and run with
`npm start`. Set `NEXT_PUBLIC_SITE_URL` in the host's environment.

Publishing a new post = commit a file under `content/articles/` and redeploy.

---

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build (types + lint + prerender)
npm run start      # serve the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

---

## Customization

Identity, navigation and the category taxonomy live in **`src/lib/site.ts`**.
The full design system (palette, fonts, terminal motifs, prose styles, the
custom `highlight.js` theme) lives in **`src/app/globals.css`** — change the
tokens at the top to re-skin the whole site.
