"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AlumniTicketSelector } from "@/components/AlumniTicketSelector";
import { AlumniTicketBundle } from "@/types/merch";
import { ALUMNI_TICKET_BUNDLES } from "@/data/alumniTicketBundles";
import { fetchAlumniTicketBundlesFromFirebase } from "@/lib/firebaseService";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/context/SiteContext";
import { useRouter } from "next/navigation";

export default function AlumniTicketPage() {
  const { user, loading } = useAuth();
  const { addBundleToCart } = useCart();
  const [selectedBundle, setSelectedBundle] = useState<AlumniTicketBundle | null>(null);
  const [bundles, setBundles] = useState<AlumniTicketBundle[]>([]);

  const { siteSettings, loading: settingsLoading } = useSiteSettings();
  const router = useRouter();

  // Baca dari Firebase sebagai sumber kebenaran.
  // Fallback = localStorage, lalu ALUMNI_TICKET_BUNDLES (seed default) bila keduanya kosong
  useEffect(() => {
    let cancelled = false;
    const saved = localStorage.getItem("gala_merch_bundles");
    let hasLocal = false;
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AlumniTicketBundle[];
        if (parsed.length > 0) {
          hasLocal = true;
          queueMicrotask(() => {
            if (!cancelled) setBundles(parsed);
          });
        }
      } catch { /* ignore */ }
    }
    // Jika tidak ada localStorage, tampilkan seed default sementara loading Firebase
    if (!hasLocal) {
      queueMicrotask(() => {
        if (!cancelled) setBundles(ALUMNI_TICKET_BUNDLES);
      });
    }

    (async () => {
      const fbBundles = await fetchAlumniTicketBundlesFromFirebase();
      if (cancelled) return;
      if (fbBundles.length > 0) {
        setBundles(fbBundles);
        localStorage.setItem("gala_merch_bundles", JSON.stringify(fbBundles));
      } else if (!hasLocal) {
        // Firebase kosong & tidak ada localStorage -> persist seed ke localStorage
        localStorage.setItem("gala_merch_bundles", JSON.stringify(ALUMNI_TICKET_BUNDLES));
      }
    })().catch((err) => console.warn("Gagal fetch bundle:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!settingsLoading && siteSettings.tiketAlumni.locked && !loading && !user) {
      router.push("/login");
    }
  }, [settingsLoading, siteSettings.tiketAlumni.locked, loading, user, router]);

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col font-body-md">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-primary">
            <span className="material-symbols-outlined animate-spin text-[32px]">sync</span>
            <span>Memuat...</span>
          </div>
        </main>
      </div>
    );
  }

  if (!siteSettings.tiketAlumni.visible) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-500 flex-col gap-4">
        <span className="material-symbols-outlined text-[48px]">confirmation_number</span>
        <h2 className="text-xl font-bold">Halaman Tidak Tersedia</h2>
        <p className="text-sm">Tiket alumni sedang ditutup atau belum tersedia.</p>
        <button onClick={() => router.push("/")} className="mt-4 px-4 py-2 bg-neutral-900 text-white rounded-lg">Kembali ke Beranda</button>
      </div>
    );
  }

  const handleOpenSelector = (bundle: AlumniTicketBundle) => {
    setSelectedBundle(bundle);
  };

  const handleCloseSelector = () => {
    setSelectedBundle(null);
  };

  const handleQuickAdd = (e: React.MouseEvent, bundle: AlumniTicketBundle) => {
    e.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }
    addBundleToCart(bundle);
  };

  return (
    <>
      <Navbar />

      <main className="flex-grow pt-2 pb-16 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 fade-in">
        <div className="mb-10 md:mb-16 mt-4 md:mt-8 border-b border-neutral-200 pb-8">
            <div>
              <h1 className="font-dot-matrix text-3xl md:text-7xl lg:text-[80px] font-bold text-neutral-900 tracking-widest uppercase mb-2 opacity-90">
                TIKET & BUNDLING MERCH
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl leading-relaxed font-medium">
                Tiket masuk puncak Dies Natalis - SMK NEGERI 3 Jepara
              </p>
            </div>
          </div>

        {bundles.length === 0 ? (
          <div className="py-20 text-center text-gray-400 space-y-3 bg-white rounded-3xl border border-gray-200/80 shadow-sm">
            <span className="material-symbols-outlined text-[48px] text-gray-300">confirmation_number</span>
            <p className="text-sm font-medium text-gray-500">Belum ada bundling. Admin bisa menambah via Dashboard → Bundling.</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              onClick={() => handleOpenSelector(bundle)}
              className="group bg-white p-4 sm:p-5 border border-neutral-200 hover:border-neutral-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer relative rounded-[20px]"
            >
              {/* Decoration corners */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div>
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100 mb-4 flex items-center justify-center p-2 rounded-2xl">
                  <img src={bundle.imageUrl} alt={bundle.name} className="object-cover w-full h-full mix-blend-multiply group-hover:scale-110 transition-transform duration-700 ease-in-out rounded-xl" />
                </div>

                <span className="font-dot-matrix text-[11px] font-bold text-neutral-400 tracking-widest uppercase block mb-2">
                  {"//"} TIKET BUNDLE
                </span>
                <h3 className="font-sans font-bold text-sm md:text-base text-neutral-900 mb-4 leading-snug">
                  {bundle.name}
                </h3>
              </div>

              <div className="flex items-end justify-between pt-4 border-t border-dashed border-neutral-200">
                <div>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-neutral-400 block mb-1">TOTAL</span>
                  <span className="font-dot-matrix text-lg md:text-xl font-bold text-neutral-900 tracking-wider">
                    Rp {bundle.totalPrice.toLocaleString("id-ID")}
                  </span>
                </div>

                <button
                  onClick={(e) => handleQuickAdd(e, bundle)}
                  className="shrink-0 bg-neutral-900 text-white w-11 h-11 flex items-center justify-center hover:bg-[#e45b45] active:scale-95 transition-colors rounded-xl"
                  title="Tambah ke keranjang"
                >
                  <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        )}


      </main>

      {selectedBundle && (
        <AlumniTicketSelector
          bundle={selectedBundle}
          onClose={handleCloseSelector}
        />
      )}
    </>
  );
}