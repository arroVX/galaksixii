"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CartProvider, useCart } from "@/context/CartContext";
import { Product } from "@/types/merch";
import { INITIAL_PRODUCTS } from "@/data/mockProducts";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductModal } from "@/components/ProductModal";
import { CartDrawer } from "@/components/CartDrawer";
import { AuthModal } from "@/components/AuthModal";
import { AdminAuthModal } from "@/components/AdminAuthModal";
import { OrderTrackingModal } from "@/components/OrderTrackingModal";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { ElasticPullToRefresh } from "@/components/ElasticPullToRefresh";
import { DevModal } from "@/components/DevModal";

function MainApp() {
  const router = useRouter();
  const { toastMessage } = useCart();
  const { user, isAdmin } = useAuth();
  const [activeView, setActiveView] = useState<"shop" | "admin">("shop");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("view") === "admin") {
        setActiveView("admin");
      }
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      setActiveView("admin");
    }
  }, [isAdmin]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);
  const [isDevModalOpen, setIsDevModalOpen] = useState(true);

  // Countdown state
  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });

  useEffect(() => {
    const targetDate = new Date().getTime() + (14 * 24 * 60 * 60 * 1000) + (8 * 60 * 60 * 1000);
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = targetDate - now;
      if (diff > 0) {
        setTimeLeft({
          days: String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, "0"),
          hours: String(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, "0"),
          minutes: String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0"),
          seconds: String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, "0")
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("gala_merch_products");
    if (saved) {
      try {
        setProducts(JSON.parse(saved));
      } catch (e) {
        setProducts(INITIAL_PRODUCTS);
      }
    } else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem("gala_merch_products", JSON.stringify(INITIAL_PRODUCTS));
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-body-md selection:bg-primary selection:text-on-primary">
      {/* Global Toast used instead */}

      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        openAuthModal={() => setIsAuthOpen(true)}
        openAdminAuthModal={() => setIsAdminAuthOpen(true)}
        openOrderTracking={() => setIsOrderTrackingOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {activeView === "admin" ? (
        <main className="flex-1 pt-6 md:pt-8 w-full flex flex-col">
          <AdminDashboard products={products} setProducts={setProducts} />
        </main>
      ) : (
        <main className="w-full flex flex-col items-center flex-grow">
          {/* Hero Banner Section */}
          <section className="w-full max-w-7xl mx-auto px-6 md:px-16 py-4 md:py-10 fade-in">
            <div className="relative w-full rounded-3xl bg-gradient-to-br from-[#1c1c1e] via-[#111113] to-[#0a0a0c] text-white p-6 sm:p-10 md:p-14 overflow-hidden shadow-2xl flex flex-col justify-between min-h-[420px] md:min-h-[500px]">
              
              {/* Large Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-10">
                <span className="font-bold text-[85px] sm:text-[140px] md:text-[200px] leading-none tracking-tighter text-white uppercase text-center font-display-lg whitespace-nowrap">
                  GALAKSI
                </span>
              </div>

              {/* Top Tag */}
              <div className="relative z-10 flex justify-between items-center mb-10">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-4 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-white/90">
                    GALAKSI XII • SMKN 3 JEPARA
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80">
                  <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                </div>
              </div>

              {/* Headline */}
              <div className="relative z-10 my-auto text-left max-w-2xl">
                <h1 className="font-headline-md text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-3 leading-tight">
                  Elevate Your Festivity With <span className="italic font-normal font-serif text-white/80">Galaksi XII</span>
                </h1>
                <p className="font-body-md text-sm sm:text-base md:text-lg text-white/70 leading-relaxed max-w-lg mb-6">
                  Koleksi official merchandise eksklusif, turnamen liga olahraga, dan selebrasi pentas seni SMKN 3 Jepara.
                </p>
              </div>

              {/* Signature Capsule Action Bar */}
              <div className="relative z-10 w-full bg-[#2a2a2d]/80 backdrop-blur-xl border border-white/15 rounded-full p-2 flex items-center justify-between shadow-2xl mt-4">
                <Link href="/merchandise" className="bg-white text-[#111113] hover:bg-white/90 font-bold px-6 py-3 rounded-full text-xs sm:text-sm transition-all shadow flex items-center gap-2 active:scale-95">
                  Beli Merch
                  <span className="material-symbols-outlined text-[16px]">local_mall</span>
                </Link>
                <div className="flex items-center gap-2 pr-3">
                  <Link href="/kompetisi" className="hidden sm:inline-flex items-center text-xs text-white/80 hover:text-white font-medium mr-2">
                    Lihat Hasil Liga &rarr;
                  </Link>
                  <div className="flex items-center text-white/40 tracking-[0.2em] font-bold text-sm select-none">
                    &gt;&gt;&gt;
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Live Countdown Section */}
          <section className="w-full max-w-7xl mx-auto px-6 md:px-16 py-6 md:py-10 reveal">
            <div className="bg-primary text-on-primary rounded-3xl p-6 sm:p-8 md:p-12 shadow-xl flex flex-col lg:flex-row justify-between items-center gap-8 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="text-center lg:text-left z-10">
                <div className="inline-flex items-center gap-2 bg-white/10 px-3.5 py-1 rounded-full mb-3 text-[11px] sm:text-xs tracking-wider uppercase font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Menuju Pembukaan Galaksi XII
                </div>
                <h2 className="font-headline-md text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Pentas Seni & Opening Ceremony</h2>
                <p className="font-body-md text-white/80 text-sm sm:text-base max-w-md">Persiapkan dirimu untuk selebrasi pentas musik, tarian, liga olahraga, dan bazar siswa terbesar SMKN 3 Jepara!</p>
              </div>

              <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-6 z-10 w-full lg:w-auto">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 md:p-6 text-center border border-white/10">
                  <span className="font-display-lg text-2xl sm:text-4xl md:text-5xl font-bold block">{timeLeft.days}</span>
                  <span className="text-[9px] sm:text-[11px] md:text-xs uppercase tracking-widest text-white/70 font-semibold">Hari</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 md:p-6 text-center border border-white/10">
                  <span className="font-display-lg text-2xl sm:text-4xl md:text-5xl font-bold block">{timeLeft.hours}</span>
                  <span className="text-[9px] sm:text-[11px] md:text-xs uppercase tracking-widest text-white/70 font-semibold">Jam</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 md:p-6 text-center border border-white/10">
                  <span className="font-display-lg text-2xl sm:text-4xl md:text-5xl font-bold block">{timeLeft.minutes}</span>
                  <span className="text-[9px] sm:text-[11px] md:text-xs uppercase tracking-widest text-white/70 font-semibold">Menit</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 md:p-6 text-center border border-white/10">
                  <span className="font-display-lg text-2xl sm:text-4xl md:text-5xl font-bold block text-emerald-400">{timeLeft.seconds}</span>
                  <span className="text-[9px] sm:text-[11px] md:text-xs uppercase tracking-widest text-white/70 font-semibold">Detik</span>
                </div>
              </div>
            </div>
          </section>

          {/* Event Highlights Section */}
          <section className="w-full bg-surface-container-low py-16 md:py-20 reveal">
            <div className="max-w-7xl mx-auto px-6 md:px-16">
              <div className="text-center mb-12 md:mb-14">
                <h2 className="font-headline-md text-3xl md:text-4xl text-primary mb-3">Rangkaian Acara Galaksi XII</h2>
                <p className="font-body-md text-on-surface-variant max-w-xl mx-auto opacity-85">Kemeriahan HUT & Dies Natalis SMKN 3 Jepara yang menyatukan bakat seni, olahraga, dan kewirausahaan siswa.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/30 shadow-sm hover:shadow-lg transition-all flex flex-col items-center text-center group cursor-default">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary transition-all">
                    <span className="material-symbols-outlined text-3xl">sports_basketball</span>
                  </div>
                  <h3 className="font-headline-md text-2xl text-primary mb-3 font-bold">Liga Olahraga</h3>
                  <p className="font-body-md text-on-surface-variant opacity-85 leading-relaxed">Saksikan persaingan ketat dan gengsi antar kelas & sekolah di cabang turnamen Basket, Futsal, dan Voli.</p>
                </div>
                <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/30 shadow-sm hover:shadow-lg transition-all flex flex-col items-center text-center group cursor-default">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary transition-all">
                    <span className="material-symbols-outlined text-3xl">music_note</span>
                  </div>
                  <h3 className="font-headline-md text-2xl text-primary mb-3 font-bold">Pentas Seni & Tari</h3>
                  <p className="font-body-md text-on-surface-variant opacity-85 leading-relaxed">Ajang ekspresi kreativitas panggung: pertunjukan band musik siswa, tari tradisional/modern, serta penampilan spesial.</p>
                </div>
                <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/30 shadow-sm hover:shadow-lg transition-all flex flex-col items-center text-center group cursor-default">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary transition-all">
                    <span className="material-symbols-outlined text-3xl">storefront</span>
                  </div>
                  <h3 className="font-headline-md text-2xl text-primary mb-3 font-bold">Bazar & Merchandise</h3>
                  <p className="font-body-md text-on-surface-variant opacity-85 leading-relaxed">Bazar kuliner kreasi siswa & stan produk UMKM, serta merchandise official edisi terbatas Gala Aksi Siswa.</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      <Footer />

      {/* Modals remain structurally identical to support interactions */}
      <ProductModal product={selectedProductModal} onClose={() => setSelectedProductModal(null)} />
      <CartDrawer />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <AdminAuthModal isOpen={isAdminAuthOpen} onClose={() => setIsAdminAuthOpen(false)} onSuccess={() => setActiveView("admin")} />
      <OrderTrackingModal isOpen={isOrderTrackingOpen} onClose={() => setIsOrderTrackingOpen(false)} />
      <DevModal isOpen={isDevModalOpen} onClose={() => { setIsDevModalOpen(false); router.push("/merchandise"); }} />
    </div>
  );
}

export default function Home() {
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1200);
    return () => clearTimeout(loadingTimer);
  }, []);

  const handleRefresh = async () => {
    await new Promise((resolve) => setTimeout(resolve, 800));
  };

  return (
    <AuthProvider>
      <CartProvider>
        {isPageLoading && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/30 backdrop-blur-2xl animate-out fade-out duration-700 pointer-events-none">
            <div className="relative flex flex-col items-center justify-center gap-6">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary animate-spin opacity-80" style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%", animationDuration: "3s" }}></div>
                <div className="absolute inset-2 bg-white/30 backdrop-blur-md border border-white/50 rounded-full shadow-lg flex items-center justify-center z-10">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                </div>
              </div>
              <span className="text-[11px] font-black tracking-[0.4em] text-primary uppercase font-sans animate-pulse">GALAKSI XII</span>
            </div>
          </div>
        )}
        <ElasticPullToRefresh onRefresh={handleRefresh}>
          <MainApp />
        </ElasticPullToRefresh>
      </CartProvider>
    </AuthProvider>
  );
}
