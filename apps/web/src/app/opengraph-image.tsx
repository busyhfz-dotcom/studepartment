import { ImageResponse } from "next/og";
import { siteDescription, siteTagline } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 84px",
          background: "linear-gradient(155deg, #182345 0%, #080e20 56%, #0b1129 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(145deg, rgba(87,112,245,.35), rgba(255,255,255,.04))",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <path
                d="M9.2 8.8h8.4a5.2 5.2 0 0 1 0 10.4h-3.2a4.6 4.6 0 0 0 0 9.2h8.4"
                stroke="#9aafff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9.2" cy="8.8" r="2.2" fill="#9aafff" />
              <circle cx="22.8" cy="23.8" r="2.2" fill="#9aafff" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: "#f5f8f6", letterSpacing: "-0.01em" }}>
              Studepartment
            </span>
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#9aafff",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              {siteTagline}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 980 }}>
          <span
            style={{
              fontSize: 60,
              fontWeight: 600,
              lineHeight: 1.06,
              letterSpacing: "-0.02em",
              color: "#f5faf8",
            }}
          >
            Research decisions, grounded in evidence.
          </span>
          <span style={{ fontSize: 24, lineHeight: 1.5, color: "#a6b2cb", maxWidth: 860 }}>
            {siteDescription}
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
