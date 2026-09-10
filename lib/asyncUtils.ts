"use client";

/**
 * Batasi janji async agar UI tidak menggantung selamanya saat jaringan stall
 * (kasus intermiten "halaman tidak bisa dimuat" di deploy).
 * Promise asli tetap jalan di background; yang dibatalkan hanya penantiannya.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout ${ms}ms: ${label}`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  }) as Promise<T>;
}

/** Batas default untuk baca Firebase dari client (jaringan seluler lambat). */
export const FIREBASE_READ_TIMEOUT_MS = 12000;
