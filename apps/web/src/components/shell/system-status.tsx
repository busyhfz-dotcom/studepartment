"use client";

import { useEffect, useState } from "react";
import styles from "./product-shell.module.css";

type State = "checking" | "ready" | "degraded";

export function SystemStatus() {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function check() {
      try {
        const response = await fetch("/api/health/ready", {
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (active) setState(response.ok ? "ready" : "degraded");
      } catch {
        if (active && !controller.signal.aborted) setState("degraded");
      }
    }

    void check();
    const timer = window.setInterval(() => void check(), 60_000);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  const label = state === "ready"
    ? "System ready"
    : state === "degraded"
      ? "System degraded"
      : "Checking system";

  return (
    <div
      className={[
        styles.systemState,
        state === "ready" ? styles.systemReady : "",
        state === "degraded" ? styles.systemDegraded : "",
        state === "checking" ? styles.systemChecking : "",
      ].filter(Boolean).join(" ")}
      role="status"
      title="Application and database readiness"
    >
      <span aria-hidden="true" />
      {label}
    </div>
  );
}
