"use client";

// This boundary only fires if the root layout itself throws, so it cannot
// assume globals.css, fonts, or any other app chrome has loaded — it must
// render a fully self-contained <html>/<body> with inline styles.
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
          background: "#f4f5f2",
          color: "#26302c",
        }}
      >
        <strong style={{ fontSize: 14, fontWeight: 800, marginBottom: 40 }}>Studepartment</strong>
        <h1 style={{ maxWidth: 560, fontSize: 32, lineHeight: 1.15, letterSpacing: "-.03em", margin: "0 0 12px" }}>
          The application failed to load.
        </h1>
        <p style={{ maxWidth: 460, color: "#6f7a74", fontSize: 14, lineHeight: 1.6, margin: "0 0 28px" }}>
          This was a rendering issue, not a data change — your account and research context are unaffected.
        </p>
        <button
          onClick={() => reset()}
          type="button"
          style={{
            minHeight: 43,
            padding: "0 20px",
            color: "#f7fbf9",
            border: "1px solid #101815",
            borderRadius: 10,
            background: "#101815",
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
