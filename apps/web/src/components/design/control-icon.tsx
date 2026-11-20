type Control = "play" | "pause" | "close";

export function ControlIcon({ name, className }: { name: Control; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      {name === "play" && <path fill="currentColor" d="M9 5.7a.8.8 0 0 0-1.2.7v11.2a.8.8 0 0 0 1.2.7l8.9-5.6a.8.8 0 0 0 0-1.4Z" />}
      {name === "pause" && <path d="M9 6.5v11m6-11v11" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />}
      {name === "close" && <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
    </svg>
  );
}
