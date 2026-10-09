/**
 * Live-switchable color palettes. The actual colors live in globals.css under
 * `[data-theme="<key>"]`; this module is the source of truth for the keys, the
 * picker labels, and the swatch previews shown in the header toggle.
 *
 * Keep `key`s in sync with the `[data-theme]` blocks in globals.css.
 */

export const THEME_STORAGE_KEY = "cyberblog-theme";

export type ThemeKey =
  | "matrix"
  | "ice"
  | "arc"
  | "plasma"
  | "solar"
  | "mono";

export interface ThemeMeta {
  key: ThemeKey;
  name: string;
  /** short, terminal-flavoured descriptor shown beside the name in the picker */
  hint: string;
  /** preview chips: page background, accent (headings/markers), link color */
  swatch: { bg: string; accent: string; link: string };
}

export const DEFAULT_THEME: ThemeKey = "matrix";

export const THEMES: ThemeMeta[] = [
  { key: "matrix", name: "matrix", hint: "green / blue", swatch: { bg: "#0a0a0a", accent: "#b8ff5a", link: "#55b7ff" } },
  { key: "ice", name: "ice", hint: "cyan / coral", swatch: { bg: "#0a0a0a", accent: "#39e0ff", link: "#ff7a5a" } },
  { key: "arc", name: "arc", hint: "blue / yellow", swatch: { bg: "#0a0a0a", accent: "#3d8bff", link: "#ffd83d" } },
  { key: "plasma", name: "plasma", hint: "magenta / cyan", swatch: { bg: "#0a0a0a", accent: "#ff3d97", link: "#2fe6e6" } },
  { key: "solar", name: "solar", hint: "yellow / indigo", swatch: { bg: "#0a0a0a", accent: "#ffe14d", link: "#8b7bff" } },
  { key: "mono", name: "mono", hint: "monochrome", swatch: { bg: "#0a0a0a", accent: "#f2f2f2", link: "#ffffff" } },
];

/**
 * Runs before first paint (injected at the top of <body>) to apply the saved
 * palette and avoid a flash of the default theme. Kept tiny and dependency-free.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t){document.documentElement.dataset.theme=t;}}catch(e){}})();`;
