import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-lg space-y-8">
        <div className="space-y-3">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-neutral-500">GALAKSI XII</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            Gala Aksi Siswa
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Merchandise official & tiket alumni event Dies Natalis SMKN 3 Jepara edisi ke-12.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/merchandise"
            className="w-full sm:w-auto px-8 py-3.5 bg-white text-neutral-950 rounded-xl text-sm font-bold hover:bg-neutral-100 transition-colors active:scale-95"
          >
            Jelajahi Merchandise
          </Link>
          <Link
            href="/tiket-alumni"
            className="w-full sm:w-auto px-8 py-3.5 bg-neutral-800 text-white rounded-xl text-sm font-bold hover:bg-neutral-700 transition-colors active:scale-95"
          >
            Tiket Alumni
          </Link>
        </div>

        <p className="text-[11px] text-neutral-600">
          SMKN 3 Jepara &middot; HUT &amp; Dies Natalis 2026
        </p>
      </div>
    </main>
  );
}
