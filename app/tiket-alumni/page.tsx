"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AlumniTicketSelector } from "@/components/AlumniTicketSelector";
import { ALUMNI_TICKET_BUNDLES } from "@/data/alumniTicketBundles";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function AlumniTicketPage() {
  const { user, loading } = useAuth();
  const [selectedBundle, setSelectedBundle] = useState<typeof ALUMNI_TICKET_BUNDLES[0] | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col font-body-md">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-primary">
            <span className="material-symbols-outlined animate-spin text-[32px]">sync</span>
            <span>Memuat...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col font-body-md">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-16">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl max-w-md w-full p-8 shadow-sm text-center space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-primary text-on-primary mx-auto flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[28px]">verified_user</span>
            </div>

            <h2 className="text-2xl font-bold font-headline-md text-primary">
              Akses Terbatas - Khusus Alumni
            </h2>

            <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed font-medium">
              Halaman Tiket Alumni hanya dapat diakses oleh alumni SMK yang sudah login. Silakan masuk ke akun Anda terlebih dahulu.
            </p>

            <div className="pt-3 space-y-3">
              <Link
                href="/login"
                className="w-full py-3 px-6 rounded-full bg-primary hover:bg-neutral-800 text-on-primary font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 transition transform active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                <span>Masuk ke Akun Sekarang</span>
              </Link>

              <Link
                href="/merchandise"
                className="block text-xs text-on-surface-variant hover:text-primary font-semibold"
              >
                ← Kembali ke Merchandise Umum
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleOpenSelector = (bundle: typeof ALUMNI_TICKET_BUNDLES[0]) => {
    setSelectedBundle(bundle);
  };

  const handleCloseSelector = () => {
    setSelectedBundle(null);
  };

  return (
    <>
      <Navbar />

      <main className="flex-grow pt-2 pb-16 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 fade-in">
        <div className="mb-10 md:mb-16 mt-4 md:mt-8 border-b border-neutral-200 pb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px] text-amber-700">verified_user</span>
            </div>
            <div>
              <h1 className="font-dot-matrix text-5xl md:text-7xl lg:text-[80px] font-bold text-neutral-900 tracking-widest uppercase mb-2 opacity-90">
                TIKET ALUMNI
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl leading-relaxed font-medium">
                Tiket masuk eksklusif untuk alumni SMK dengan bundling merchandise official GALAKSI XII.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-10 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] text-amber-700 mt-0.5 shrink-0">info</span>
            <div className="text-xs text-amber-800 leading-relaxed space-y-1">
              <p className="font-bold">Syarat Pembelian Tiket Alumni:</p>
              <p>• Khusus alumni SMK (Semua jurusan)</p>
              <p>• Wajib melampirkan <strong>Kartu Pelajar</strong> atau <strong>SKL (Surat Keterangan Lulus)</strong></p>
              <p>• Wajib mengisi tahun lulus (minimal 2000)</p>
              <p>• Tiket sudah termasuk bundling merchandise (1 tiket = 1 merch)</p>
              <p>• Verifikasi manual oleh panitia (1-2 hari kerja)</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {ALUMNI_TICKET_BUNDLES.map((bundle) => (
            <div
              key={bundle.id}
              onClick={() => handleOpenSelector(bundle)}
              className="group bg-white p-5 sm:p-6 border border-neutral-200 hover:border-amber-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer relative"
              style={{ borderRadius: '2px' }}
            >
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100 mb-4 flex items-center justify-center p-2" style={{ borderRadius: '2px' }}>
                <img src={bundle.imageUrl} alt={bundle.name} className="object-cover w-full h-full mix-blend-multiply group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 bg-amber-600 text-white font-black text-[9px] tracking-wider uppercase rounded-full">
                    ALUMNI ONLY
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <span className="font-dot-matrix text-[10px] font-bold text-amber-600 tracking-widest uppercase block">
                  {"//"} TIKET ALUMNI BUNDLE
                </span>
                <h3 className="font-sans font-bold text-sm md:text-base text-neutral-900 mb-2 leading-snug">
                  {bundle.name}
                </h3>
                <p className="text-xs text-neutral-500 line-clamp-2">{bundle.description}</p>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-700">Harga Tiket</span>
                    <span className="font-bold text-amber-900">Rp {bundle.ticketPrice.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-amber-200 pt-1">
                    <span className="text-amber-700">Merchandise</span>
                    <span className="font-bold text-amber-900">Rp {(bundle.totalPrice - bundle.ticketPrice).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-amber-800 border-t border-amber-300 pt-2">
                    <span>TOTAL</span>
                    <span>Rp {bundle.totalPrice.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-dashed border-neutral-200">
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                    <span>Pilih varian merch di halaman selanjutnya</span>
                  </div>
                  <span className="material-symbols-outlined text-neutral-400 group-hover:text-amber-600 transition-colors">chevron_right</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/merchandise"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 font-bold text-xs rounded-full shadow-sm transition"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Kembali ke Merchandise Umum</span>
          </Link>
        </div>
      </main>

      <Footer />

      {selectedBundle && (
        <AlumniTicketSelector
          bundle={selectedBundle}
          onClose={handleCloseSelector}
        />
      )}
    </>
  );
}