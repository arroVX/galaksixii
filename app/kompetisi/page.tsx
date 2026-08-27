"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { GalleryItem } from "@/types/merch";
import { INITIAL_GALLERY } from "@/data/mockGallery";
import { fetchGalleryFromFirebase } from "@/lib/firebaseService";

const CATEGORY_ICONS: Record<string, string> = {
  "Liga Olahraga": "sports_soccer",
  "Liga E-Sport": "sports_esports",
  "Pentas Seni": "music_note",
  Bazar: "storefront",
  "Puncak Acara": "celebration"
};

export default function KompetisiPage() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  React.useEffect(() => {
    // Hydrasi cache galeri dari localStorage saat mount (sumber eksternal, tidak tersedia saat SSR).
    let initial: GalleryItem[] = INITIAL_GALLERY;
    const saved = localStorage.getItem("gala_merch_gallery");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as GalleryItem[];
        if (Array.isArray(parsed) && parsed.length > 0) initial = parsed;
      } catch {
        initial = INITIAL_GALLERY;
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrasi cache galeri dari localStorage (sumber eksternal).
    setGallery(initial);
    if (!saved) {
      localStorage.setItem("gala_merch_gallery", JSON.stringify(INITIAL_GALLERY));
    }

    // Tarik data terbaru dari Firestore (hasil kelola admin) bila tersedia.
    const loadFirebase = async () => {
      try {
        const remote = await fetchGalleryFromFirebase();
        if (remote.length > 0) {
          const map = new Map<string, GalleryItem>();
          initial.forEach((g) => map.set(g.id, g));
          remote.forEach((g) => map.set(g.id, g));
          const merged = Array.from(map.values()).sort((a, b) => b.year - a.year);
          setGallery(merged);
          localStorage.setItem("gala_merch_gallery", JSON.stringify(merged));
        }
      } catch (err) {
        console.warn("Gagal memuat galeri dari Firebase:", err);
      }
    };
    loadFirebase();
  }, []);

  const years = Array.from(new Set(gallery.map((g) => g.year))).sort((a, b) => b - a);
  const activeYear = selectedYear ?? years[0] ?? new Date().getFullYear();

  const categories = ["Semua", ...Array.from(new Set(gallery.filter((g) => g.year === activeYear).map((g) => g.category)))];

  const filtered = gallery
    .filter((g) => g.year === activeYear)
    .filter((g) => selectedCategory === "Semua" || g.category === selectedCategory)
    .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));

  return (
    <div className="min-h-screen text-on-background font-body-md">
      <Navbar />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16 flex-grow fade-in">
        {/* ===== HEADER ===== */}
        <section className="text-center mb-10 md:mb-14">
          <span className="inline-flex items-center gap-2 border border-outline-variant/60 bg-surface-container-lowest px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.2em] uppercase text-on-surface-variant mb-5">
            <span className="material-symbols-outlined text-[14px]">photo_library</span>
            Dokumentasi GALAKSI XII
          </span>
          <h1 className="font-serif-title text-4xl md:text-6xl font-black tracking-tight text-neutral-900 leading-[1.05] mb-4">
            Dari Liga <span className="text-primary">hingga</span> Puncak Acara
          </h1>
          <p className="text-neutral-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Jejak semangat, tawa, dan karya siswa SMKN 3 Jepara — terdokumentasi dari edisi ke edisi.
            Foto lengkap akan terus diperbarui oleh panitia melalui dashboard.
          </p>
        </section>

        {/* ===== FILTER TAHUN (TAB) ===== */}
        {years.length > 0 && (
          <section className="flex items-center justify-center gap-2 flex-wrap mb-6">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => {
                  setSelectedYear(y);
                  setSelectedCategory("Semua");
                }}
                className={`px-5 py-2 rounded-full text-xs font-bold tracking-wider transition-all ${
                  y === activeYear
                    ? "bg-neutral-900 text-white shadow-md"
                    : "bg-surface-container-lowest border border-outline-variant/50 text-on-surface-variant hover:border-neutral-400"
                }`}
              >
                {y === years[0] ? `GALAKSI XII • ${y}` : `ARSIP ${y}`}
              </button>
            ))}
          </section>
        )}

        {/* ===== FILTER KATEGORI ===== */}
        <section className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                cat === selectedCategory
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-transparent border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              {cat !== "Semua" && (
                <span className="material-symbols-outlined text-[13px] align-[-2px] mr-1">
                  {CATEGORY_ICONS[cat] ?? "image"}
                </span>
              )}
              {cat}
            </button>
          ))}
        </section>

        {/* ===== GRID GALERI ===== */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-outline-variant/60 rounded-3xl bg-surface-container-lowest/50">
            <span className="material-symbols-outlined text-5xl text-outline mb-3 block">photo_off</span>
            <p className="text-sm text-on-surface-variant font-semibold">Belum ada dokumentasi pada filter ini.</p>
            <p className="text-xs text-on-surface-variant/70 mt-1">Panitia akan segera mengunggah momen terbaru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => setLightbox(item)}
                className="group relative overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left aspect-[4/5]"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  /* PLACEHOLDER — foto asli diisi panitia via dashboard */
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(circle,_rgba(0,0,0,0.06)_1px,_transparent_1px)] [background-size:12px_12px] bg-surface-container-low group-hover:bg-surface-container transition-colors">
                    <span className="material-symbols-outlined text-4xl text-outline group-hover:text-primary transition-colors">
                      {CATEGORY_ICONS[item.category] ?? "add_photo_alternate"}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">
                      Menunggu Dokumentasi
                    </span>
                  </div>
                )}

                {/* Overlay caption */}
                <div className="absolute inset-x-0 bottom-0 p-3 pt-8 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <p className="text-white text-[11px] md:text-xs font-bold leading-snug line-clamp-2">{item.title}</p>
                  <p className="text-white/70 text-[9px] uppercase tracking-widest mt-0.5">{item.category}</p>
                </div>

                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-neutral-900/80 backdrop-blur text-white text-[11px] font-bold rounded-full tracking-wider z-10">
                  {item.category}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Catatan arsip */}
        <p className="text-center text-[11px] text-on-surface-variant/70 mt-12 max-w-lg mx-auto leading-relaxed">
          Arsip tahun-tahun sebelumnya juga tersedia — pilih tab tahun di atas untuk melihat dokumentasi edisi lalu.
        </p>
      </main>

      {/* ===== LIGHTBOX ===== */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-surface-container-lowest rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video bg-surface-container-low flex items-center justify-center">
              {lightbox.imageUrl ? (
                <img src={lightbox.imageUrl} alt={lightbox.title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-3 text-on-surface-variant/60">
                  <span className="material-symbols-outlined text-6xl">
                    {CATEGORY_ICONS[lightbox.category] ?? "add_photo_alternate"}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em]">
                    Foto akan segera diunggah panitia
                  </span>
                </div>
              )}
              <button
                onClick={() => setLightbox(null)}
                aria-label="Tutup"
                className="absolute top-3 right-3 w-11 h-11 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-5 md:p-6">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-primary text-on-primary text-[9px] font-bold rounded-full uppercase tracking-widest">
                  {lightbox.category}
                </span>
                <span className="px-2.5 py-0.5 border border-outline-variant text-on-surface-variant text-[9px] font-bold rounded-full tracking-widest">
                  {lightbox.year}
                </span>
              </div>
              <h3 className="font-serif-title font-bold text-lg md:text-xl text-neutral-900">{lightbox.title}</h3>
              {lightbox.caption && (
                <p className="text-xs md:text-sm text-on-surface-variant mt-1.5 leading-relaxed">{lightbox.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
