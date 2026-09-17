import Link from "next/link";

export default function NotFound() {
  return <main className="not-found"><div><p className="eyebrow">404 · Scientific context lost</p><h1>This page is not in the graph.</h1><p>The profile or opportunity may have moved, become private, or never existed.</p><Link className="button button-primary" href="/dashboard">Return to workspace</Link></div></main>;
}
