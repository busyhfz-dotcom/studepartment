import Link from "next/link";
import styles from "./discovery-scope-nav.module.css";

type Scope = "researchers" | "laboratories" | "institutions";

const scopes: Array<{ key: Scope; href: string; label: string; description: string }> = [
  { key: "researchers", href: "/discover", label: "Researchers", description: "People and expertise" },
  { key: "laboratories", href: "/discover/labs", label: "Laboratories", description: "Teams and methods" },
  { key: "institutions", href: "/discover/institutions", label: "Institutions", description: "Organizations and ecosystems" },
];

export function DiscoveryScopeNav({ active }: { active: Scope }) {
  return (
    <nav className={styles.scopeNav} aria-label="Discovery scope">
      {scopes.map((scope) => (
        <Link
          className={`${styles.scopeLink} ${scope.key === active ? styles.active : ""}`}
          href={scope.href}
          key={scope.key}
        >
          <span>{scope.label}</span>
          <small>{scope.description}</small>
        </Link>
      ))}
    </nav>
  );
}
