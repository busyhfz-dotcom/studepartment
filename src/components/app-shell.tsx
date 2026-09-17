import {
  Bell,
  BookOpenText,
  CircleUserRound,
  Compass,
  LayoutDashboard,
  Network,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/primitives";
import { currentResearcher } from "@/lib/demo-data";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/opportunities", label: "Opportunities", icon: BookOpenText },
  { href: "/network", label: "Introductions", icon: Network },
  { href: "/profile", label: "Scientific profile", icon: CircleUserRound },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><Logo /></div>
        <nav className="side-nav" aria-label="Primary navigation">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link className="sidebar-link" href={href} key={href}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-intelligence">
          <span className="spark-box"><Sparkles size={16} /></span>
          <div>
            <strong>Profile intelligence</strong>
            <p>3 signals can improve your discovery quality.</p>
          </div>
          <Link href="/profile">Review profile</Link>
        </div>
        <div className="sidebar-user">
          <Avatar initials={currentResearcher.initials} size="sm" />
          <div><strong>{currentResearcher.name}</strong><span>Researcher</span></div>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <div className="global-search">
            <Search size={17} />
            <span>Search researchers, topics, labs or opportunities…</span>
            <kbd>⌘ K</kbd>
          </div>
          <button className="icon-button" type="button" aria-label="Notifications"><Bell size={18} /></button>
          <Link className="topbar-profile" href="/profile"><Avatar initials={currentResearcher.initials} size="sm" /></Link>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
