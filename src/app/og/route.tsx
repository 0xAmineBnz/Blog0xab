import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") ?? siteConfig.title).slice(0, 120);
  const cat = (searchParams.get("cat") ?? "").slice(0, 8);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "linear-gradient(#161616 1px, transparent 1px), linear-gradient(90deg, #161616 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          padding: "64px",
          fontFamily: "monospace",
        }}
      >
        {/* top: identity */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", color: "#b8ff5a", fontSize: "30px" }}>
            ./
          </div>
          <div style={{ display: "flex", color: "#eaeaea", fontSize: "30px", fontWeight: 700 }}>
            {siteConfig.name}
          </div>
          <div style={{ display: "flex", color: "#6b7280", fontSize: "22px", marginLeft: "8px" }}>
            {siteConfig.role}
          </div>
        </div>

        {/* middle: title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {cat ? (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                border: "1px solid rgba(184,255,90,0.4)",
                backgroundColor: "rgba(184,255,90,0.1)",
                color: "#b8ff5a",
                fontSize: "24px",
                padding: "6px 16px",
                borderRadius: "0px",
              }}
            >
              {cat}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              color: "#f5f5f5",
              fontSize: title.length > 64 ? "56px" : "72px",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>
        </div>

        {/* bottom: prompt line */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", color: "#b8ff5a", fontSize: "24px" }}>$</div>
          <div style={{ display: "flex", color: "#9ca3af", fontSize: "24px" }}>
            cat ./research --devsecops --cloud-security
          </div>
          <div
            style={{
              display: "flex",
              width: "12px",
              height: "26px",
              backgroundColor: "#b8ff5a",
              marginLeft: "4px",
            }}
          />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      // The card is a pure function of (title, cat), so it never needs to be
      // re-rendered for the same inputs. Cache aggressively so a CDN or
      // platform crawler can absorb repeat hits instead of re-running Satori.
      headers: {
        "Cache-Control": "public, immutable, no-transform, max-age=31536000",
      },
    },
  );
}
