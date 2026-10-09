import "server-only";
import { parse } from "node-html-parser";
import sanitizeHtml from "sanitize-html";
import hljs from "highlight.js";
import { slugify } from "./utils";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

const ALLOWED_LANGS = new Set(hljs.listLanguages());

/** Conservative allowlist for article HTML (headings, code, tables, media). */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "a", "ul", "ol", "li", "blockquote",
    "strong", "em", "s", "u", "code", "pre", "br", "hr",
    "img", "figure", "figcaption",
    "table", "thead", "tbody", "tr", "th", "td",
    "span", "div", "input", "mark", "sub", "sup",
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    code: ["class"],
    pre: ["class"],
    span: ["class", "data-type"],
    ul: ["data-type"],
    li: ["data-checked", "data-type"],
    input: ["type", "checked", "disabled"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
    "*": ["id"],
  },
  // `data:` is intentionally NOT in the global list (it would allow
  // `<a href="data:text/html,…">`); it is permitted only on <img>.
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        rel: "noopener noreferrer nofollow",
        ...(attribs.target ? { target: "_blank" } : {}),
      },
    }),
  },
  // keep code content intact
  nonTextTags: ["style", "script", "textarea", "noscript"],
};

/**
 * Sanitize stored article HTML, inject stable heading ids, build a table of
 * contents, and apply syntax highlighting to code blocks at render time.
 */
export function processArticleHtml(rawHtml: string): {
  html: string;
  toc: TocItem[];
} {
  if (!rawHtml) return { html: "", toc: [] };

  const clean = sanitizeHtml(rawHtml, SANITIZE_OPTIONS);
  const root = parse(clean, {
    blockTextElements: { pre: true, code: true },
  });

  // --- headings → ids + toc -------------------------------------------------
  const toc: TocItem[] = [];
  const usedIds = new Set<string>();
  for (const h of root.querySelectorAll("h2, h3, h4")) {
    const text = h.textContent.trim();
    if (!text) continue;
    const base = slugify(text) || "section";
    let id = base;
    let n = 2;
    while (usedIds.has(id)) id = `${base}-${n++}`;
    usedIds.add(id);
    h.setAttribute("id", id);
    toc.push({ id, text, level: Number(h.tagName.substring(1)) });
  }

  // --- code blocks → highlight ----------------------------------------------
  for (const pre of root.querySelectorAll("pre")) {
    const code = pre.querySelector("code");
    if (!code) continue;
    const cls = code.getAttribute("class") ?? "";
    const match = cls.match(/language-([\w-]+)/i);
    let lang = match?.[1]?.toLowerCase();
    const source = decodeEntities(code.textContent);

    let highlighted: string;
    try {
      if (lang && ALLOWED_LANGS.has(lang)) {
        highlighted = hljs.highlight(source, {
          language: lang,
          ignoreIllegals: true,
        }).value;
      } else {
        const auto = hljs.highlightAuto(source);
        highlighted = auto.value;
        lang = auto.language ?? "text";
      }
    } catch {
      highlighted = escapeHtml(source);
      lang = lang ?? "text";
    }

    code.set_content(highlighted);
    code.setAttribute("class", `hljs language-${lang}`);
    pre.setAttribute("class", "code-block-pre");
    pre.setAttribute("data-lang", lang);
  }

  return { html: root.toString(), toc };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Strip tags to plaintext (used to derive excerpts / reading time on save). */
export function htmlToText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}
