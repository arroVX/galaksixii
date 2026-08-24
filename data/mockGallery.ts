import { GalleryItem } from "@/types/merch";

/**
 * Seed awal galeri dokumentasi — semua item sengaja TANPA imageUrl
 * agar tampil sebagai placeholder. Panitia mengisi foto asli
 * lewat dashboard admin (tab Galeri).
 */
export const INITIAL_GALLERY: GalleryItem[] = [
  // ===== GALAKSI XII (2026) =====
  { id: "gal-2026-01", title: "Kick Off Liga Futsal Antar Kelas", category: "Liga Olahraga", year: 2026, caption: "Gilang hotnya pembukaan liga futsal GALAKSI XII." },
  { id: "gal-2026-02", title: "Babak Penyisihan Basket 3v3", category: "Liga Olahraga", year: 2026, caption: "Sembilan tim bertarung di lapangan upt." },
  { id: "gal-2026-03", title: "Try Out & Audisi Pentas Seni", category: "Pentas Seni", year: 2026, caption: "Seleksi penampilan band dan tari." },
  { id: "gal-2026-04", title: "Bazar UMKM Siswa", category: "Bazar", year: 2026, caption: "Kios kuliner & kriya milik siswa." },
  { id: "gal-2026-05", title: "Grand Final Liga", category: "Liga Olahraga", year: 2026, caption: "Perebutan juara umum liga antar kelas." },
  { id: "gal-2026-06", title: "Puncak Acara & Pentas Seni Malam", category: "Puncak Acara", year: 2026, caption: "Malam puncak HUT ke-12 SMKN 3 Jepara." },

  // ===== EDISI SEBELUMNYA (ARSIP) =====
  { id: "gal-2025-01", title: "Opening Ceremony GALAKSI XI", category: "Puncak Acara", year: 2025, caption: "Arsip dokumentasi edisi sebelumnya." },
  { id: "gal-2025-02", title: "Final Mobile Legends Antar Jurusan", category: "Liga E-Sport", year: 2025, caption: "Liga e-sport terbesar dalam sejarah event." },
  { id: "gal-2025-03", title: "Pentas Seni & Lomba Band", category: "Pentas Seni", year: 2025, caption: "Penampilan guest star alumni." },
  { id: "gal-2024-01", title: "Liga Voli Kelas X-XII", category: "Liga Olahraga", year: 2024, caption: "Dua pekan penuh pertandingan seru." },
  { id: "gal-2024-02", title: "Stand Bazar Kriya & Kuliner", category: "Bazar", year: 2024, caption: "Kolaborasi jurusan Tata Boga & Kriya." },
  { id: "gal-2024-03", title: "Penutupan & Pembagian Juara Umum", category: "Puncak Acara", year: 2024, caption: "Penyerahan piala bergilir juara umum." }
];
