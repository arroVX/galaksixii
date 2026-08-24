"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Deteksi mount di client tanpa setState dalam effect
 * (aman terhadap aturan react-hooks/set-state-in-effect).
 * Bernilai false saat SSR/hydration pertama, true setelahnya.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
