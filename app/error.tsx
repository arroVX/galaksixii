"use client";

import { useEffect } from "react";
import Link from "next/link";

// Error boundary per-segmen (docs: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md).
// Di Next 16 prop recovery bernama `unstable_retry` — menggantikan `reset`.
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Route error boundary:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md space-y-5 bg-white border border-neutral-200 rounded-3xl p-8 sm:p-10 shadow-sm">
        <span className="material-symbols-outlined text-[48px] text-neutral-300 block">
          error
        </span>
        <h1 className="text-xl font-bold text-neutral-900">
          Halaman gagal dimuat
        </h1>
        <p className="text-sm text-neutral-500 leading-relaxed">
          Terjadi gangguan sesaat saat membuka halaman ini. Coba muat ulang
          — data keranjang dan pesanan kamu tetap tersimpan di perangkat ini.
        </p>
        {error.digest && (
          <p className="text-[11px] font-mono text-neutral-400">
            Kode error: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-neutral-900 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Coba lagi
          </button>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-neutral-300 text-neutral-700 rounded-xl text-sm font-bold hover:border-neutral-900 hover:text-neutral-900 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
