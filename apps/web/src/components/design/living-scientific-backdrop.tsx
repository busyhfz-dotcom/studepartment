"use client";
import { useEffect, useRef } from "react";
import { mountDnaMotion } from "./dna-motion";
import styles from "./living-scientific-backdrop.module.css";

export function ScientificBackdrop({ tone = "dark", className = "" }: {
  tone?: "dark" | "light";
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvas.current) return mountDnaMotion(canvas.current, tone);
  }, [tone]);
  return <div className={`${styles.backdrop} ${styles[tone]} ${className}`} aria-hidden="true"><canvas ref={canvas} className={styles.molecule} /></div>;
}
