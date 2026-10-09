"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

type Result = {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  code: string | null;
};

/**
 * Site-wide search as a command palette (⌘K / Ctrl+K / "/") instead of a
 * dedicated page. Queries the existing /api/search route. Renders its own
 * trigger so it can drop straight into the header nav.
 */
export function SiteSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  // results tagged with the query they belong to, so a stale response never
  // renders against a newer query (and we avoid synchronous setState in effects)
  const [data, setData] = React.useState<{ q: string; items: Result[] } | null>(
    null,
  );

  // global shortcuts: ⌘K / Ctrl+K toggles, "/" opens when not already typing
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "/" && !open) {
        const el = e.target as HTMLElement | null;
        const typing =
          el &&
          (el.tagName === "INPUT" ||
            el.tagName === "TEXTAREA" ||
            el.isContentEditable);
        if (!typing) {
          e.preventDefault();
          setOpen(true);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // debounced fetch against /api/search — every setState lives in the async
  // callback, never synchronously in the effect body
  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        const json = (await res.json()) as { results: Result[] };
        setData({ q, items: json.results ?? [] });
      } catch {
        /* aborted or failed — keep whatever is on screen */
      }
    }, 200);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [query]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setData(null);
    }
  }

  function go(slug: string) {
    handleOpenChange(false);
    router.push(`/blog/${slug}`);
  }

  const trimmed = query.trim();
  const settled = data !== null && data.q === trimmed;
  const items = settled ? data.items : [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search posts"
        className="no-underline-link group inline-flex items-center gap-2 text-muted-2 transition-colors hover:text-accent"
      >
        <span>
          [<span className="text-link group-hover:text-accent">search</span>]
        </span>
        <kbd className="hidden border border-border px-1.5 py-px text-[0.65rem] leading-none text-muted-2 sm:inline-block">
          /
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="grep -ri 'heap overflow' ./posts"
        />
        <CommandList>
          {trimmed.length < 2 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-2">
              {"// type at least 2 characters to search"}
            </p>
          ) : !settled ? (
            <p className="px-3 py-8 text-center text-sm text-muted-2">
              searching…
            </p>
          ) : items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-2">
              no matches found
            </p>
          ) : (
            <CommandGroup
              heading={`${items.length} ${items.length === 1 ? "match" : "matches"}`}
            >
              {items.map((r) => (
                <CommandItem key={r.slug} value={r.slug} onSelect={() => go(r.slug)}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {r.code && (
                        <span className="shrink-0 text-[0.7rem] text-accent">
                          {r.code}
                        </span>
                      )}
                      <span className="truncate text-foreground">{r.title}</span>
                    </div>
                    {r.excerpt && (
                      <p className="mt-0.5 truncate text-xs text-muted-2">
                        {r.excerpt}
                      </p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
