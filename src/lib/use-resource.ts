"use client";

import { useEffect, useState } from "react";

export function useResource<T>(load: (signal: AbortSignal) => Promise<T>, enabled = true) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setData(undefined);
    setError("");
    if (!enabled) return () => controller.abort();
    load(controller.signal).then((value) => {
      if (!controller.signal.aborted) setData(value);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        console.error("Thaqalayn content could not be loaded", error);
        setError(error instanceof Error ? error.message : "Could not load content from ThaqalaynAPI.");
      }
    });
    return () => controller.abort();
  }, [load, attempt, enabled]);
  return { data, error, retry: () => setAttempt((value) => value + 1) };
}
