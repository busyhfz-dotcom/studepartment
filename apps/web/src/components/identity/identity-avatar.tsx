"use client";

import { useEffect, useState } from "react";
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
  kind = "person",
  size = "large",
}: {
  name: string;
  src?: string | null;
  kind?: "person" | "organization";
  size?: "small" | "medium" | "large";
}) {
  const [showImage, setShowImage] = useState(Boolean(src));

  useEffect(() => setShowImage(Boolean(src)), [src]);

  return (
    <span className={`${styles.avatar} ${styles[size]} ${styles[kind]}`} aria-label={`${name} ${kind === "person" ? "profile photo" : "logo"}`}>
      <span className={styles.fallback} aria-hidden="true">{initials(name)}</span>
      {src && showImage ? <img alt="" src={src} onError={() => setShowImage(false)} /> : null}
    </span>
  );
}
