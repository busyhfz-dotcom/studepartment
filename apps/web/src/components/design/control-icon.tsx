type Control = "play" | "pause" | "close" | "subject" | "role";

export function ControlIcon({ name, className }: { name: Control; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      {name === "play" && <path fill="currentColor" d="M9 5.7a.8.8 0 0 0-1.2.7v11.2a.8.8 0 0 0 1.2.7l8.9-5.6a.8.8 0 0 0 0-1.4Z" />}
      {name === "pause" && <path d="M9 6.5v11m6-11v11" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />}
      {name === "close" && <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
      {name === "subject" && <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Zm-8 9 8 4.5 8-4.5m-16 4.5 8 4.5 8-4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
      {name === "role" && <path d="M9 7V5h6v2M4 7h16v13H4V7Zm0 5h16m-9 0v2h2v-2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}
