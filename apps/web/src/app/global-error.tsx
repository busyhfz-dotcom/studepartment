"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Arial, sans-serif",
          background: "#f5f5f5",
          color: "#2e2e2e",
        }}
      >
        <strong style={{ fontSize: 14, fontWeight: 800, marginBottom: 40 }}>Provenant</strong>
        <h1 style={{ maxWidth: 560, fontSize: 32, lineHeight: 1.15, letterSpacing: "-.03em", margin: "0 0 12px" }}>
          The application failed to load.
        </h1>
        <p style={{ maxWidth: 460, color: "#777777", fontSize: 14, lineHeight: 1.6, margin: "0 0 28px" }}>
          Your account and saved work are not affected. Please reload the page.
        </p>
        <button
          onClick={() => reset()}
          type="button"
          style={{
            minHeight: 43,
            padding: "0 20px",
            color: "#fafafa",
            border: "1px solid #161616",
            borderRadius: 10,
            background: "#161616",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
