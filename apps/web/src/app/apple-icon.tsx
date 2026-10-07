import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #263b8d 0%, #080e20 100%)",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
          <path
            d="M9.2 8.8h8.4a5.2 5.2 0 0 1 0 10.4h-3.2a4.6 4.6 0 0 0 0 9.2h8.4"
            stroke="#9aafff"
            strokeWidth="2.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9.2" cy="8.8" r="2.4" fill="#9aafff" />
          <circle cx="22.8" cy="23.8" r="2.4" fill="#9aafff" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
