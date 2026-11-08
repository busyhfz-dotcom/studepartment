export function PathIllustration({posting=false}:{posting?:boolean}) {
  return <svg viewBox="0 0 180 112" fill="none" aria-hidden="true">
    <ellipse cx="91" cy="100" rx="76" ry="7" fill="currentColor" opacity=".07"/>
    {posting ? <>
      <rect x="54" y="17" width="101" height="66" rx="8" fill="white" fillOpacity=".38" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M72 34h39M72 44h63M72 54h49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".5"/>
      <circle cx="38" cy="47" r="10" fill="#b38365"/>
      <path d="M22 90V73c0-13 32-13 32 0v17" fill="white" fillOpacity=".8" stroke="currentColor" strokeWidth="1.5"/>
      <path d="m48 69 26-9M33 61l5 12 5-12M126 88h30M141 77v11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M139 80c-18-4-9-18 1-10 0-17 18-13 8 1 16-3 18 12-9 9Z" fill="#6f9e8b"/>
    </> : <>
      <path d="m77 91 20-17 44 2-12 20Z" fill="white" fillOpacity=".55" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M105 83h22M100 88h21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
      <circle cx="50" cy="38" r="10" fill="#b38365"/><circle cx="120" cy="35" r="10" fill="#775c51"/>
      <path d="M32 88V66c0-16 36-16 36 0v22" fill="white" fillOpacity=".8" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M102 70V61c0-15 36-15 36 0v9" fill="currentColor" fillOpacity=".16" stroke="currentColor" strokeWidth="1.5"/>
      <path d="m57 67 29 12m25-16-25 16M44 53l6 16 6-16M115 50l5 13 5-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="m76 17 4 5 9-11M149 45l4 4 7-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".5"/>
    </>}
    <path d="M17 98h146" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".3"/>
  </svg>;
}
