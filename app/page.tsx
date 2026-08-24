"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Product, GalleryItem } from "@/types/merch";
import { INITIAL_PRODUCTS } from "@/data/mockProducts";
import { INITIAL_GALLERY } from "@/data/mockGallery";
import { fetchGalleryFromFirebase } from "@/lib/firebaseService";
import { EVENT_DATE } from "@/lib/config";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { ElasticPullToRefresh } from "@/components/ElasticPullToRefresh";

function MainApp() {
  const { isAdmin } = useAuth();
  const [activeView, setActiveView] = useState<"shop" | "admin">("shop");
  const [products, setProducts] = useState<Product[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  // Admin otomatis masuk panel admin; non-admin selalu diarahkan ke toko.
  // Pola "adjust state during render" agar tidak perlu effect.
  const [lastIsAdmin, setLastIsAdmin] = useState(isAdmin);
  if (isAdmin !== lastIsAdmin) {
    setLastIsAdmin(isAdmin);
    setActiveView(isAdmin ? "admin" : "shop");
  }

  // Countdown menuju tanggal acara (tetap, tidak reset saat reload).
  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });

  React.useEffect(() => {
    const targetDate = EVENT_DATE.getTime();
    const tick = () => {
      const diff = targetDate - Date.now();
      if (diff > 0) {
        setTimeLeft({
          days: String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, "0"),
          hours: String(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, "0"),
          minutes: String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0"),
          seconds: String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, "0")
        });
      } else {
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
      }
    };
    // Update pertama via requestAnimationFrame (bukan setState sinkron di body effect).
    const frame = requestAnimationFrame(tick);
    const interval = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(interval);
    };
  }, []);

  React.useEffect(() => {
    let savedProducts: Product[] | null = null;
    const saved = localStorage.getItem("gala_merch_products");
    if (saved) {
      try {
        savedProducts = JSON.parse(saved) as Product[];
      } catch {
        savedProducts = null;
      }
    }
    // Hydrasi cache produk dari localStorage (sumber eksternal, tidak tersedia saat SSR).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProducts(savedProducts ?? INITIAL_PRODUCTS);
    if (!savedProducts) {
      localStorage.setItem("gala_merch_products", JSON.stringify(INITIAL_PRODUCTS));
    }
  }, []);

  // Hydrasi galeri dokumentasi: cache lokal lalu gabungkan data terbaru dari Firestore.
  React.useEffect(() => {
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

  return (
    <div className="min-h-screen text-on-background flex flex-col font-body-md selection:bg-primary selection:text-on-primary">
      {/* Global Toast used instead */}

      <Navbar activeView={activeView} setActiveView={setActiveView} />

      {activeView === "admin" ? (
        <main className="flex-1 pt-6 md:pt-8 w-full flex flex-col">
          <AdminDashboard products={products} setProducts={setProducts} gallery={gallery} setGallery={setGallery} />
        </main>
      ) : (
        <main className="w-full flex flex-col items-center flex-grow">
          {/* New Tech-Minimalist Hero Section */}
          <section className="w-full max-w-7xl mx-auto px-6 md:px-16 py-12 md:py-20 flex flex-col items-center justify-center fade-in relative">
          

            {/* Central Node Map Graphic */}
            

            {/* Bottom Dot Matrix Headline */}
            <h1 className="font-dot-matrix text-[15vw] md:text-7xl lg:text-[100px] font-bold text-neutral-900 tracking-widest uppercase mt-4 md:mt-12 mb-6 text-center opacity-90 drop-shadow-sm">
              GALAKSI XII
            </h1>

            {/* Subtext and Button */}
            <p className="text-neutral-500 text-xs md:text-sm max-w-md text-center mb-8 font-body-md leading-relaxed px-4">
              Hadirkan pengalaman baru dalam perayaan sekolah. Menggabungkan semangat kompetisi, seni, dan kreativitas siswa tanpa batas.
            </p>
            
            <Link href="/merchandise" className="bg-[#e45b45] text-white hover:bg-[#d64a34] px-6 md:px-8 py-3 rounded-full text-xs md:text-sm font-semibold transition-all shadow-md flex items-center gap-2 md:gap-3 group">
              <span className="bg-white/20 text-white p-1 rounded-md flex items-center justify-center group-hover:scale-110 transition-transform">
                 <span className="material-symbols-outlined text-[14px] md:text-[16px] border-white border-[1px] rounded-sm p-px border-dotted">grid_view</span>
              </span>
              Pesan Merchandise
            </Link>
          </section>

          <div className="relative w-full max-w-3xl h-[250px] md:h-[400px] flex items-center justify-center my-4 md:my-8">
              {/* SVG Connector Lines */}
              <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                {/* Horizontal lines from nodes to center box */}
                <line x1="20%" y1="20%" x2="45%" y2="45%" stroke="#e5e5e5" strokeWidth="1.5" />
                <line x1="80%" y1="20%" x2="55%" y2="45%" stroke="#e5e5e5" strokeWidth="1.5" />
                <line x1="20%" y1="80%" x2="45%" y2="55%" stroke="#e5e5e5" strokeWidth="1.5" />
                <line x1="80%" y1="80%" x2="55%" y2="55%" stroke="#e5e5e5" strokeWidth="1.5" />
                
                {/* Dots on lines */}
                <circle cx="20%" cy="20%" r="3" fill="#111" />
                <circle cx="80%" cy="20%" r="3" fill="#111" />
                <circle cx="20%" cy="80%" r="3" fill="#111" />
                <circle cx="80%" cy="80%" r="3" fill="#111" />
              </svg>

              {/* Labels */}
              <div className="absolute top-[15%] left-[5%] md:left-[10%] text-[9px] md:text-[10px] font-medium border border-neutral-200 bg-white px-3 py-1 rounded-full text-neutral-600 shadow-sm z-10 whitespace-nowrap">Kompetisi</div>
              <div className="absolute top-[15%] right-[5%] md:right-[10%] text-[9px] md:text-[10px] font-medium border border-neutral-200 bg-white px-3 py-1 rounded-full text-neutral-600 shadow-sm z-10 whitespace-nowrap">Merchandise</div>
              <div className="absolute bottom-[15%] left-[5%] md:left-[10%] text-[9px] md:text-[10px] font-medium border border-neutral-200 bg-white px-3 py-1 rounded-full text-neutral-600 shadow-sm z-10 whitespace-nowrap">Bazar</div>
              <div className="absolute bottom-[15%] right-[5%] md:right-[10%] text-[9px] md:text-[10px] font-medium border border-neutral-200 bg-white px-3 py-1 rounded-full text-neutral-600 shadow-sm z-10 whitespace-nowrap">Tiket</div>

              {/* Center Box */}
              <div className="w-24 h-24 md:w-40 md:h-40 bg-[#f5f5f5] border-[6px] md:border-[12px] border-white/80 rounded-[28px] md:rounded-[40px] shadow-xl flex items-center justify-center z-10 p-4 md:p-8 relative">
                <div className="absolute inset-0 bg-white/20 rounded-inherit backdrop-blur-md"></div>
                <div className="w-full h-full bg-neutral-900 rounded-xl md:rounded-2xl relative overflow-hidden flex items-center justify-center group cursor-pointer hover:scale-105 transition-transform duration-500 shadow-inner z-20">
                  <div className="absolute inset-0 border-4 border-white opacity-20 rounded-xl m-1.5 md:m-2 pointer-events-none"></div>
                  <span className="material-symbols-outlined text-white text-3xl md:text-5xl group-hover:rotate-90 transition-transform duration-700">dashboard_customize</span>
                </div>
              </div>
            </div>

          {/* New Stats Bar Section */}
          <section className="w-full max-w-7xl mx-auto px-6 md:px-16 py-4 md:py-8 reveal">
            <div className="bg-white border border-neutral-100 rounded-[28px] md:rounded-[40px] p-6 sm:p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-neutral-100 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neutral-50/50 via-transparent to-transparent opacity-80"></div>
              
              {/* Stat 1 */}
              <div className="flex flex-col pt-2 md:pt-0 px-2 relative z-10">
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                  <span className="material-symbols-outlined text-neutral-900 text-[18px]">bar_chart</span>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-neutral-900 uppercase">Keterlibatan</span>
                </div>
                <div className="font-dot-matrix text-5xl md:text-6xl font-bold text-neutral-900 mb-3 tracking-wider">3x</div>
                <div className="text-xs text-neutral-500 leading-relaxed max-w-[200px]">Lebih banyak peserta kompetisi dari tahun sebelumnya</div>
              </div>
              
              {/* Stat 2 */}
              <div className="flex flex-col pt-8 md:pt-0 md:px-10 relative z-10">
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                  <span className="material-symbols-outlined text-neutral-900 text-[18px]">local_fire_department</span>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-neutral-900 uppercase">Antusiasme</span>
                </div>
                <div className="font-dot-matrix text-5xl md:text-6xl font-bold text-neutral-900 mb-3 tracking-wider">90%</div>
                <div className="text-xs text-neutral-500 leading-relaxed max-w-[200px]">Tiket pentas seni dan merchandise terjual sebelum hari H</div>
              </div>

              {/* Action Box */}
              <div className="flex flex-col pt-8 md:pt-0 md:px-10 justify-center relative z-10">
                <p className="text-[11px] md:text-xs text-neutral-600 mb-5 md:mb-6 leading-relaxed">
                  Gabung bersama ribuan siswa lainnya. Dukung tim favoritmu dan koleksi merchandise eksklusif GALAKSI XII sekarang juga.
                </p>
                <Link href="/login" className="self-start bg-white hover:bg-neutral-50 text-neutral-900 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2.5 border border-neutral-200 transition-colors shadow-sm">
                  <span className="w-6 h-6 bg-neutral-900 rounded-[6px] flex items-center justify-center">
                     <span className="w-1.5 h-1.5 bg-white rounded-full grid grid-cols-2 gap-0.5">
                       <span className="w-[3px] h-[3px] bg-white rounded-full"></span>
                       <span className="w-[3px] h-[3px] bg-white rounded-full"></span>
                       <span className="w-[3px] h-[3px] bg-white rounded-full"></span>
                       <span className="w-[3px] h-[3px] bg-white rounded-full"></span>
                     </span>
                  </span>
                  Sign up
                </Link>
              </div>
            </div>
          </section>

          {/* New Feature Highlight Section (Sim-1 style) */}
          <section className="w-full max-w-7xl mx-auto px-6 md:px-16 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-8 items-center reveal">
            <div className="flex flex-col items-start text-left max-w-lg z-10">
              <h2 className="text-4xl md:text-[54px] font-sans tracking-tight text-neutral-900 mb-2 md:mb-4 leading-[1.1] font-medium">
                Memperkenalkan
              </h2>
              <h2 className="text-4xl md:text-[54px] font-sans tracking-tight text-neutral-400 mb-8 leading-[1.1] font-medium">
                Era baru <span className="text-neutral-900 font-semibold block mt-1">selebrasi talenta dan sportivitas</span>
              </h2>
              <p className="text-xs md:text-sm text-neutral-500 leading-relaxed max-w-[320px] mb-8 font-medium">
                Dirancang khusus untuk menghargai setiap perjuangan siswa dalam berkompetisi, berkarya di pentas seni, dan membangun semangat kewirausahaan.
              </p>
              <Link href="/kompetisi" className="bg-white hover:bg-neutral-50 text-neutral-900 px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-3 border border-neutral-200 transition-colors shadow-sm">
                <span className="w-7 h-7 bg-neutral-900 rounded-lg flex items-center justify-center">
                   <div className="grid grid-cols-2 gap-[2px]">
                     <span className="w-1 h-1 bg-white rounded-full"></span>
                     <span className="w-1 h-1 bg-white rounded-full"></span>
                     <span className="w-1 h-1 bg-white rounded-full"></span>
                     <span className="w-1 h-1 bg-white rounded-full"></span>
                   </div>
                </span>
                Selengkapnya
              </Link>
            </div>
            
            <div className="relative w-full aspect-square md:aspect-auto md:h-full min-h-[300px] flex items-center justify-center pointer-events-none">
              {/* Dot Matrix Graphic Representation (Brain/Cloud) using grid or SVG */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle,_#000_1.5px,_transparent_1.5px)] [background-size:12px_12px]" style={{ WebkitMaskImage: 'radial-gradient(ellipse at right center, black 10%, transparent 60%)', maskImage: 'radial-gradient(ellipse at right center, black 10%, transparent 60%)' }}></div>
              <div className="absolute top-1/2 left-[60%] -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] opacity-25 bg-[radial-gradient(circle,_#000_2px,_transparent_2px)] [background-size:16px_16px]" style={{ WebkitMaskImage: 'polygon(50% 0%, 100% 30%, 100% 70%, 50% 100%, 0% 70%, 0% 30%)', maskImage: 'polygon(50% 0%, 100% 30%, 100% 70%, 50% 100%, 0% 70%, 0% 30%)' }}></div>
              <div className="absolute bottom-0 right-0 w-48 text-[9px] md:text-[10px] text-neutral-500 text-right leading-relaxed font-medium">
                Peringatan HUT ke-12 dan Dies Natalis SMKN 3 Jepara yang menyatukan seluruh elemen sekolah dalam satu harmoni.
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

          {/* Kept Countdown Section, removed old Event Highlights */}
        </main>
      )}

      <Footer />

      <CartDrawer />
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
    <>
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
    </>
  );
}
