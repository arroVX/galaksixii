import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md space-y-6">
        <p className="text-6xl font-bold text-neutral-200">404</p>
        <h1 className="text-xl font-bold text-neutral-900">Halaman Tidak Ditemukan</h1>
        <p className="text-sm text-neutral-500">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <Link
          href="/merchandise"
          className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-colors active:scale-95"
        >
          Kembali ke Merchandise
        </Link>
      </div>
    </main>
  );
}
