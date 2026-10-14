"use client";

import { useEffect, useState } from "react";
import { retryAfterSeconds } from "./retry-after";

export function useRetryCooldown() {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!remaining) return;
    const timer = window.setTimeout(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);
  function onError({ response }: { response: Response }) {
    if (response.status === 429) setRemaining(retryAfterSeconds(response.headers));
  }
  return { remaining, onError };
}
