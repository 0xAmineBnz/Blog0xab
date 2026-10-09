"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  THEMES,
  THEME_STORAGE_KEY,
  DEFAULT_THEME,
  type ThemeKey,
} from "@/lib/themes";

// Theme lives on <html data-theme> (set pre-paint by the layout script). We read
// it through an external store so there's no setState-in-effect on mount, and so
// changes — including from other tabs — flow back into the UI automatically.
const THEME_EVENT = "cyberblog:themechange";

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): ThemeKey {
  const t = document.documentElement.dataset.theme as ThemeKey | undefined;
  return t && THEMES.some((x) => x.key === t) ? t : DEFAULT_THEME;
}

function getServerSnapshot(): ThemeKey {
  return DEFAULT_THEME;
}

/**
 * Terminal-styled palette switcher. Renders as nav chrome — `[ theme: name ▾ ]`
 * — and opens a small panel of palettes with live swatch previews.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const apply = (key: ThemeKey) => {
    document.documentElement.setAttribute("data-theme", key);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, key);
    } catch {
      /* private mode / storage disabled — selection just won't persist */
    }
    window.dispatchEvent(new Event(THEME_EVENT));
    setOpen(false);
  };

  const active = THEMES.find((t) => t.key === theme) ?? THEMES[0];

  return (
    <div ref={ref} className="relative ml-auto text-muted-2">
      [
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Switch color palette"
        onClick={() => setOpen((v) => !v)}
        className="no-underline-link inline-flex items-center gap-1.5 align-baseline hover:opacity-80"
      >
        <span
          aria-hidden
          className="inline-block size-2.5 border"
          style={{ background: active.swatch.accent, borderColor: active.swatch.link }}
        />
        <span className="text-muted">theme:</span>
        <span className="text-accent">{active.name}</span>
        <span className="text-muted-2">{open ? "▴" : "▾"}</span>
      </button>
      ]
      {open && (
        <div
          role="menu"
          aria-label="Color palette"
          className="absolute right-0 z-50 mt-2 w-56 border border-border-strong bg-surface p-1 text-left shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
        >
          {THEMES.map((t) => {
            const isActive = t.key === theme;
            return (
              <button
                key={t.key}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => apply(t.key)}
                className="flex w-full items-center gap-2.5 px-2 py-1.5 text-left hover:bg-[var(--accent-dim)]"
              >
                <span
                  aria-hidden
                  className="flex shrink-0 border border-border-strong"
                  title={t.hint}
                >
                  <span className="size-3" style={{ background: t.swatch.bg }} />
                  <span className="size-3" style={{ background: t.swatch.accent }} />
                  <span className="size-3" style={{ background: t.swatch.link }} />
                </span>
                <span className={isActive ? "text-accent" : "text-foreground"}>
                  {t.name}
                </span>
                <span className="text-xs text-muted-2">{t.hint}</span>
                <span aria-hidden className="ml-auto text-accent">
                  {isActive ? "●" : ""}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
