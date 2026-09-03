"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ProductModal } from "@/components/ProductModal";
import { AdminDashboard } from "@/components/admin";
import { Product } from "@/types/merch";
import { fetchProductsFromFirebase } from "@/lib/firebaseService";

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/context/SiteContext";

const SKELETON_COUNT = 8;

function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="bg-white p-4 sm:p-5 border border-neutral-200 rounded-[20px] flex flex-col justify-between"
    >
      <div>
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100 mb-4 rounded-2xl animate-pulse flex items-center justify-center">
          <span className="material-symbols-outlined text-[40px] text-neutral-300">image</span>
        </div>
        <div className="h-3 w-24 bg-neutral-200 rounded-full mb-3 animate-pulse" />
        <div className="h-4 w-full bg-neutral-200 rounded-lg mb-2 animate-pulse" />
        <div className="h-4 w-2/3 bg-neutral-200 rounded-lg mb-2 animate-pulse" />
      </div>
      <div className="flex items-end justify-between pt-4 border-t border-dashed border-neutral-200 mt-2">
        <div className="space-y-2">
          <div className="h-3 w-12 bg-neutral-200 rounded-full animate-pulse" />
          <div className="h-5 w-24 bg-neutral-200 rounded-lg animate-pulse" />
        </div>
        <div className="w-11 h-11 bg-neutral-200 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat produk dari database"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6"
    >
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
      <span className="sr-only">Memuat produk dari database...</span>
    </div>
  );
}

function MerchandiseContentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeView, setActiveView] = useState<"shop" | "admin">(searchParams.get("admin") === "true" ? "admin" : "shop");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const { siteSettings, loading: settingsLoading } = useSiteSettings();
  const pageLoading = settingsLoading || authLoading;

  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);

  // Guard admin view — non-admin dipaksa kembali ke shop
  useEffect(() => {
    if (activeView === "admin" && !isAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- redirect guard
      setActiveView("shop");
      router.replace("/");
    }
  }, [activeView, isAdmin, router]);

  useEffect(() => {
    if (!pageLoading && siteSettings.merchandise.locked && !user) {
      router.replace("/login");
    }
  }, [pageLoading, siteSettings.merchandise.locked, user, router]);

  useEffect(() => {
    if (!pageLoading && !siteSettings.merchandise.visible && activeView !== "admin") {
      router.replace("/tiket-alumni");
    }
  }, [pageLoading, siteSettings.merchandise.visible, activeView, router]);

  useEffect(() => {
    let cancelled = false;
    const loadProducts = async () => {
      // Jangan tampilkan skeleton terlalu cepat bila cache sudah ada,
      // tapi tetap tandai loading untuk background refresh.
      let hasCache = false;
      try {
        const saved = localStorage.getItem("gala_merch_products");
        if (saved) {
          const parsed = JSON.parse(saved) as Product[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            hasCache = true;
            if (!cancelled) setProducts(parsed);
          }
        }
      } catch { /* abaikan cache rusak */ }

      // Hanya tampilkan skeleton penuh bila belum ada data sama sekali.
      if (!cancelled && !hasCache) setProductsLoading(true);
      if (!cancelled) setProductsError(null);

      try {
        const firebaseProducts = await fetchProductsFromFirebase();
        if (cancelled) return;
        // Firebase adalah sumber kebenaran: sinkronkan apa adanya,
        // termasuk kasus kosong agar tidak menampilkan data basi selamanya.
        setProducts(firebaseProducts);
        try {
          localStorage.setItem("gala_merch_products", JSON.stringify(firebaseProducts));
        } catch { /* storage penuh / privat, abaikan */ }
      } catch (err) {
        console.warn("Gagal fetch produk dari Firebase:", err);
        if (!cancelled) {
          // Jika masih ada cache, tetap tampilkan cache + banner error.
          // Jika tidak ada cache sama sekali, tampilkan empty-state error + retry.
          setProductsError(hasCache
            ? "Gagal memperbarui katalog. Menampilkan data terakhir yang tersimpan."
            : "Gagal memuat produk dari database. Periksa koneksi lalu coba lagi.");
        }
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    };

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleRetryProducts = () => {
    setProductsError(null);
    // Paksa skeleton penuh hanya bila belum ada data untuk ditampilkan.
    if (products.length === 0) setProductsLoading(true);
    setReloadKey((k) => k + 1);
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }
    // Quick add memakai varian pertama sebagai default.
    const size = product.variants?.sizes?.[0] ?? "Standard";
    const color = product.variants?.colors?.[0] ?? "Standard";
    addToCart(product, size, color, 1);
  };

  const getMappedCategory = (product: Product) => {
    const cat = (product.category || "").toLowerCase();
    const name = product.name.toLowerCase();
    
    if (cat.includes("apparel") || name.includes("topi") || name.includes("totebag") || name.includes("baju") || name.includes("kaos")) {
      return "apparel";
    }
    if (cat.includes("lengkap") || name.includes("tumbler") || name.includes("notebook") || name.includes("botol")) {
      return "perlengkapan";
    }
    return "aksesoris";
  };

  const getDisplayCategory = (product: Product) => {
    const map = getMappedCategory(product);
    if (map === "apparel") return "APPAREL";
    if (map === "perlengkapan") return "PERLENGKAPAN";
    return "AKSESORIS";
  };

  const filteredProducts = products.filter((p) => {
    const queryMatches = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const filterMatches = activeFilter === "all" || getMappedCategory(p) === activeFilter;
    return queryMatches && filterMatches;
  });

  const showSkeleton = productsLoading && products.length === 0 && activeView !== "admin";
  const showRefreshing = productsLoading && products.length > 0 && activeView !== "admin";

  if (pageLoading) {
    return (
      <>
        <Navbar activeView={activeView} setActiveView={setActiveView} />
        <main className="flex-grow pt-2 pb-16 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="mb-10 md:mb-16 mt-4 md:mt-8 border-b border-neutral-200 pb-8">
            <div className="h-10 md:h-20 w-3/4 bg-neutral-200 rounded-2xl animate-pulse mb-4" />
            <div className="h-4 w-1/2 bg-neutral-200 rounded-full animate-pulse" />
          </div>
          <ProductGridSkeleton />
        </main>
      </>
    );
  }

  if (!siteSettings.merchandise.visible && activeView !== "admin") {
    // Tetap render Navbar + pesan agar tidak terlihat blank saat redirect.
    return (
      <>
        <Navbar activeView={activeView} setActiveView={setActiveView} />
        <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-20 text-center">
          <div className="flex items-center justify-center gap-3 text-neutral-400">
            <span className="material-symbols-outlined animate-spin text-[28px]">sync</span>
            <span className="text-sm font-medium tracking-wide">Mengalihkan ke halaman yang tersedia...</span>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
        <Navbar activeView={activeView} setActiveView={setActiveView} />

        {activeView === "admin" ? (
          <AdminDashboard
            products={products}
            setProducts={setProducts}
            onExit={() => setActiveView("shop")}
          />
        ) : (
        <main className="flex-grow pt-2 pb-16 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 fade-in">
        
        {/* Title & Description */}
        <div className="mb-10 md:mb-16 mt-4 md:mt-8 border-b border-neutral-200 pb-8">
          <h1 className="font-dot-matrix text-3xl md:text-7xl lg:text-[80px] font-bold text-neutral-900 tracking-widest uppercase mb-4 opacity-90">
            OFFICIAL MERCHANDISE
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl leading-relaxed font-medium">
            Koleksi suvenir & produk official merchandise eksklusif Gala Aksi Siswa (GALAKSI XII) SMKN 3 Jepara edisi HUT & Dies Natalis.
          </p>
        </div>

        {/* Filter & Search Controls Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-6 mb-10">
          {/* Category Filter Pills (Left) */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: "all", label: "SEMUA PRODUK" },
              { id: "aksesoris", label: "AKSESORIS & STIKER" },
              { id: "apparel", label: "TOPI & TAS" },
              { id: "perlengkapan", label: "PERLENGKAPAN" }
            ].map((filter) => (
              <button 
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`whitespace-nowrap px-4 py-2.5 text-[11px] sm:text-xs font-bold tracking-widest uppercase transition-all border rounded-full ${
                  activeFilter === filter.id 
                    ? "bg-neutral-900 text-white border-neutral-900 shadow-md" 
                    : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400 hover:text-neutral-900"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Search Bar (Right) */}
          <div className="relative w-full md:w-[320px]">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-[18px]">search</span>
            <input 
              type="text" 
              placeholder="Cari produk merchandise..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 pl-11 pr-4 py-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all rounded-2xl" 
            />
          </div>
        </div>

        {/* Product Grid */}
        {productsError && products.length > 0 && (
          <div className="mb-6 flex items-start justify-between gap-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-3">
            <p className="text-xs font-medium leading-relaxed">{productsError}</p>
            <button
              type="button"
              onClick={handleRetryProducts}
              className="shrink-0 text-xs font-bold underline underline-offset-2 hover:text-amber-900"
            >
              Coba lagi
            </button>
          </div>
        )}
        {showRefreshing && (
          <div className="mb-6 flex items-center gap-2 text-xs font-medium text-neutral-400">
            <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
            Memperbarui katalog dari database...
          </div>
        )}
        {showSkeleton ? (
          <ProductGridSkeleton />
        ) : productsError && products.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-gray-200/80 shadow-sm px-6">
            <span className="material-symbols-outlined text-[48px] text-gray-300">cloud_off</span>
            <p className="text-sm font-bold text-neutral-900">Katalog belum bisa dimuat</p>
            <p className="text-sm font-medium text-gray-500 max-w-md mx-auto">{productsError}</p>
            <button
              type="button"
              onClick={handleRetryProducts}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white text-xs font-bold tracking-widest uppercase rounded-full hover:bg-neutral-700 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Coba lagi
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-gray-200/80 shadow-sm px-6">
            <span className="material-symbols-outlined text-[48px] text-gray-300">inventory_2</span>
            <p className="text-sm font-bold text-neutral-900">Belum ada produk di katalog</p>
            <p className="text-sm font-medium text-gray-500 max-w-md mx-auto">Katalog masih kosong di database. Silakan kembali lagi nanti.</p>
            <button
              type="button"
              onClick={handleRetryProducts}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-neutral-300 text-neutral-700 text-xs font-bold tracking-widest uppercase rounded-full hover:border-neutral-900 hover:text-neutral-900 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Muat ulang
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-gray-400 space-y-3 bg-white rounded-3xl border border-gray-200/80 shadow-sm">
            <span className="material-symbols-outlined text-[48px] text-gray-300">inventory_2</span>
            <p className="text-sm font-medium text-gray-500">Tidak ada produk yang sesuai dengan filter Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {filteredProducts.map((product) => {
              const imageSrc = product.images?.[0] || product.imageUrl || "";
              return (
              <button 
                key={product.id}
                type="button"
                aria-label={`Lihat detail ${product.name}`}
                onClick={() => setSelectedProductModal(product)} 
                className="group bg-white p-4 sm:p-5 border border-neutral-200 hover:border-neutral-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer relative text-left rounded-[20px]"
              >
                {/* Decoration corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div>
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100 mb-4 flex items-center justify-center p-2 rounded-2xl">
                    {imageSrc ? (
                      <img src={imageSrc} alt={product.name} loading="lazy" decoding="async" style={{ imageRendering: "auto" }} className="object-cover w-full h-full mix-blend-multiply group-hover:scale-110 transition-transform duration-700 ease-in-out rounded-xl" />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-neutral-300 w-full h-full">
                        <span className="material-symbols-outlined text-[48px]">image_not_supported</span>
                        <span className="text-[11px] font-bold tracking-widest uppercase">Belum ada foto</span>
                      </div>
                    )}
                  </div>

                  <span className="font-dot-matrix text-[11px] font-bold text-neutral-400 tracking-widest uppercase block mb-2">
                    {"//"} {getDisplayCategory(product)}
                  </span>
                  <h3 className="font-sans font-bold text-sm md:text-base text-neutral-900 mb-2 leading-snug">
                    {product.name}
                  </h3>
                </div>

                <div className="flex items-end justify-between pt-4 border-t border-dashed border-neutral-200">
                  <div>
                    <span className="text-[11px] font-bold tracking-widest uppercase text-neutral-400 block mb-1">HARGA</span>
                    <span className="font-dot-matrix text-lg md:text-xl font-bold text-neutral-900 tracking-wider">
                      Rp {product.price.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <button 
                    onClick={(e) => handleAddToCart(e, product)} 
                    className="shrink-0 bg-neutral-900 text-white w-11 h-11 flex items-center justify-center hover:bg-[#e45b45] active:scale-95 transition-colors rounded-xl"
                    title="Tambah ke keranjang"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
              </button>
              );
            })}
          </div>
        )}
      </main>
        )}

      {/* Modals */}
      <ProductModal product={selectedProductModal} onClose={() => setSelectedProductModal(null)} />
    </>
  );
}

export function MerchandiseView() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center font-body-md">
        <div className="flex items-center gap-3 text-neutral-400">
          <span className="material-symbols-outlined animate-spin text-[32px]">sync</span>
          <span className="text-sm font-medium tracking-wide">Memuat halaman...</span>
        </div>
      </div>
    }>
      <MerchandiseContentInner />
    </Suspense>
  );
}
