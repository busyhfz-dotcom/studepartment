type Control = "play" | "pause" | "close" | "subject" | "role" | "filter";

export function ControlIcon({ name, className }: { name: Control; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      {name === "play" && <path fill="currentColor" d="M9 5.7a.8.8 0 0 0-1.2.7v11.2a.8.8 0 0 0 1.2.7l8.9-5.6a.8.8 0 0 0 0-1.4Z" />}
      {name === "pause" && <g fill="currentColor"><rect x="7.5" y="5.5" width="3" height="13" rx="1.2" /><rect x="13.5" y="5.5" width="3" height="13" rx="1.2" /></g>}
      {name === "filter" && <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M3 5h10m5 0h3M3 12h3m5 0h10M3 19h10m5 0h3" />
        <circle cx="15.5" cy="5" r="2.5" /><circle cx="8.5" cy="12" r="2.5" /><circle cx="15.5" cy="19" r="2.5" />
      </g>}
      {name === "close" && <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
      {name === "subject" && <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Zm-8 9 8 4.5 8-4.5m-16 4.5 8 4.5 8-4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
      {name === "role" && <path d="M9 7V5h6v2M4 7h16v13H4V7Zm0 5h16m-9 0v2h2v-2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}
