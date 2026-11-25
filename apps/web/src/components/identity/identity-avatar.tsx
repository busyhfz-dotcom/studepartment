"use client";

import { useState } from "react";
import { InstitutionalMark } from "@/components/opportunities/brand-mark";
import styles from "./identity-avatar.module.css";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "ID";
}

export function IdentityAvatar({
  name,
  src,
  website,
  verified = false,
  kind = "person",
  size = "large",
}: {
  name: string;
  src?: string | null;
  website?: string | null;
  verified?: boolean;
  kind?: "person" | "organization";
  size?: "small" | "medium" | "large";
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  // Only same-origin uploads are shown: a remote image URL would expose every viewer's IP address to its host.
  const safeSrc = src && src.startsWith("/") && !src.startsWith("//") ? src : null;

  return (
    <span className={`${styles.avatar} ${styles[size]} ${styles[kind]}`} aria-label={`${name} ${kind === "person" ? "profile photo" : "logo"}`}>
      <span className={styles.fallback} aria-hidden="true">{initials(name)}</span>
      {kind === "organization" && verified ? <InstitutionalMark name={name} website={website} className={styles.mark} /> : null}
      {safeSrc && failedSrc !== safeSrc ? <img alt="" src={safeSrc} onError={() => setFailedSrc(safeSrc)} /> : null}
    </span>
  );
}
