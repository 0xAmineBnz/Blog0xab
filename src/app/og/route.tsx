import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const runtime = "edge";

// Satori has no system-font access: the JetBrains Mono TTFs must be handed to
// ImageResponse explicitly or the card silently renders in the bundled
// Noto Sans instead of the blog's monospace.
const FONTS = [
  {
    url: "https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Regular.ttf",
    weight: 400,
  },
  {
    url: "https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Bold.ttf",
    weight: 700,
  },
] as const;

let fontsPromise: Promise<
  { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" }[]
> | undefined;

function loadFonts() {
  return (fontsPromise ??= Promise.all(
    FONTS.map(async ({ url, weight }) => ({
      name: "JetBrains Mono",
      data: await fetch(url).then((res) => res.arrayBuffer()),
      weight,
      style: "normal" as const,
    })),
  ));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") ?? siteConfig.title).slice(0, 120);
  const cat = (searchParams.get("cat") ?? "").slice(0, 32);
  const excerpt = (searchParams.get("excerpt") ?? "").slice(0, 180);
  const fonts = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0a0a",
          color: "#d4d4d4",
          padding: "58px 76px",
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        <div style={{ display: "flex", color: "#fff07a", fontSize: "34px", fontWeight: 700 }}>
          ./{siteConfig.name}
        </div>
        <div style={{ display: "flex", marginTop: "12px", color: "#8a8a8a", fontSize: "20px" }}>
          {"// "}
          {siteConfig.roles.join("  ·  ")}
        </div>
        <div style={{ display: "flex", marginTop: "22px", color: "#5e5e5e", fontSize: "19px" }}>
          [<span style={{ color: "#8b7bff" }}>Home</span>]{"  "}
          [<span style={{ color: "#8b7bff" }}>About</span>]
        </div>
        <div style={{ display: "flex", marginTop: "24px", borderTop: "1px dashed #333333" }} />
        <div style={{ display: "flex", marginTop: "24px", color: "#5e5e5e", fontSize: "18px" }}>
          ~/blog / <span style={{ color: "#8a8a8a" }}>{cat.toLowerCase()}</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "16px",
            color: "#fff07a",
            fontSize: title.length > 64 ? "42px" : "50px",
            fontWeight: 700,
            lineHeight: 1.15,
          }}
        >
          {title}
        </div>
        {excerpt ? (
          <div style={{ display: "flex", marginTop: "14px", color: "#8a8a8a", fontSize: "19px", lineHeight: 1.35 }}>
            {excerpt}
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            marginTop: "auto",
            borderTop: "1px dashed #333333",
            paddingTop: "20px",
            color: "#8a8a8a",
            fontSize: "18px",
          }}
        >
          <span style={{ color: "#ffe14d" }}>$ </span> cat ./research
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts,
      // The card is a pure function of (title, cat), so it never needs to be
      // re-rendered for the same inputs. Cache aggressively so a CDN or
      // platform crawler can absorb repeat hits instead of re-running Satori.
      headers: {
        "Cache-Control": "public, immutable, no-transform, max-age=31536000",
      },
    },
  );
}
