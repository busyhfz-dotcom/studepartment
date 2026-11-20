"use client";
import { useEffect, useRef } from "react";
import { mountDnaMotion } from "./dna-motion";
import styles from "./living-scientific-backdrop.module.css";

export function ScientificBackdrop({ tone = "dark", className = "", showTranscript = false }: {
  tone?: "dark" | "light";
  className?: string;
  showTranscript?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvas.current) return mountDnaMotion(canvas.current, tone, showTranscript);
  }, [tone, showTranscript]);
  return <div className={`${styles.backdrop} ${styles[tone]} ${className}`} aria-hidden="true">
    <canvas ref={canvas} className={styles.molecule} data-transcript={showTranscript ? "" : undefined} />
  </div>;
}
