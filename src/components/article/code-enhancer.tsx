"use client";

import * as React from "react";

const COPY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

/**
 * Progressively enhances server-rendered code blocks: wraps each
 * `pre[data-lang]` with an editor-style header (language label + copy button).
 * Done imperatively to avoid re-rendering sanitized article HTML through React.
 */
export function CodeEnhancer({ targetId = "article-body" }: { targetId?: string }) {
  React.useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;

    const cleanups: Array<() => void> = [];
    const blocks = root.querySelectorAll<HTMLPreElement>("pre[data-lang]");

    blocks.forEach((pre) => {
      if (pre.dataset.enhanced === "1") return;
      pre.dataset.enhanced = "1";
      const lang = pre.getAttribute("data-lang") || "text";

      const wrapper = document.createElement("div");
      wrapper.className = "code-block group relative my-6";

      const bar = document.createElement("div");
      bar.className =
        "flex items-center justify-between rounded-t-[var(--radius)] border border-b-0 border-border bg-surface px-3 py-1.5";
      bar.innerHTML = `<span class="font-mono text-[0.7rem] uppercase tracking-wider text-muted-2">${escapeHtml(
        lang,
      )}</span>`;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", "Copy code");
      btn.className =
        "inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 font-mono text-[0.7rem] text-muted-2 transition-colors hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";
      btn.innerHTML = `${COPY_SVG}<span>copy</span>`;

      const onClick = async () => {
        const code = pre.querySelector("code")?.textContent ?? "";
        try {
          await navigator.clipboard.writeText(code);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = code;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        btn.innerHTML = `${CHECK_SVG}<span>copied</span>`;
        btn.classList.add("!text-accent");
        window.setTimeout(() => {
          btn.innerHTML = `${COPY_SVG}<span>copy</span>`;
          btn.classList.remove("!text-accent");
        }, 1600);
      };
      btn.addEventListener("click", onClick);
      bar.appendChild(btn);

      // restyle pre to dock under the bar
      pre.classList.add("!mt-0", "!rounded-t-none");

      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(bar);
      wrapper.appendChild(pre);

      cleanups.push(() => btn.removeEventListener("click", onClick));
    });

    return () => cleanups.forEach((fn) => fn());
  }, [targetId]);

  return null;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );
}
