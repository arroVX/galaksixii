"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductModal } from "@/components/ProductModal";
import { CartDrawer } from "@/components/CartDrawer";
import { AuthModal } from "@/components/AuthModal";
import { AdminAuthModal } from "@/components/AdminAuthModal";
import { OrderTrackingModal } from "@/components/OrderTrackingModal";
import { Product } from "@/types/merch";
import { INITIAL_PRODUCTS } from "@/data/mockProducts";
import { useCart } from "@/context/CartContext";

import { useAuth } from "@/context/AuthContext";

export default function MerchandisePage() {
  const { user } = useAuth();
  const { toastMessage, addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);

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

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    addToCart(product, "Standard", "Standard", 1); // Quick add defaults
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

  return (
    <div className="min-h-screen bg-[#f7f7f5] bg-dotted-grid text-neutral-900 flex flex-col font-body-md selection:bg-neutral-900 selection:text-white">
      
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        openAuthModal={() => setIsAuthOpen(true)}
        openAdminAuthModal={() => setIsAdminAuthOpen(true)}
        openOrderTracking={() => setIsOrderTrackingOpen(true)}
        activeView="shop"
        setActiveView={() => {}}
      />

      <main className="flex-grow pt-2 pb-16 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 fade-in">
        
        {/* Modern Tech Header Banner */}
        <div className="mb-10 mt-4 md:mt-8 relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-neutral-200/80 text-neutral-800 font-grotesk font-semibold text-xs tracking-wide mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>GALAKSI XII — Official Catalog</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-grotesk text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 leading-tight mb-2">
                Official Merchandise
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl leading-relaxed">
                Koleksi suvenir & produk official merchandise eksklusif Gala Aksi Siswa (GALAKSI XII) SMKN 3 Jepara edisi HUT & Dies Natalis.
              </p>
            </div>

            <div className="hidden lg:flex items-center gap-2 font-grotesk text-xs text-neutral-600 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-neutral-200/80 shadow-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-neutral-900"></span>
              <span>Secure Pre-Order System</span>
            </div>
          </div>
        </div>

        {/* Modern Tech Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10">
          <div className="bg-white/90 backdrop-blur-sm border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-neutral-900 transition-colors">
            <span className="font-grotesk text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">TOTAL KATALOG</span>
            <div className="font-grotesk font-bold text-2xl sm:text-3xl text-neutral-900">{products.length < 10 ? `0${products.length}` : products.length}</div>
            <span className="text-[11px] text-neutral-500 mt-2 font-medium">Item Terverifikasi</span>
          </div>

          <div className="bg-white/90 backdrop-blur-sm border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-neutral-900 transition-colors">
            <span className="font-grotesk text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">EDISI EVENT</span>
            <div className="font-grotesk font-bold text-2xl sm:text-3xl text-neutral-900">12th</div>
            <span className="text-[11px] text-neutral-500 mt-2 font-medium">Dies Natalis SMKN 3</span>
          </div>

          <div className="bg-white/90 backdrop-blur-sm border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-neutral-900 transition-colors">
            <span className="font-grotesk text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">SISTEM PESAN</span>
            <div className="font-grotesk font-bold text-xl sm:text-2xl text-neutral-900">Fast PO</div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-2">● Pre-Order & Ready</span>
          </div>

          <div className="bg-white/90 backdrop-blur-sm border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-neutral-900 transition-colors">
            <span className="font-grotesk text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">AMBIL PESANAN</span>
            <div className="font-grotesk font-bold text-base sm:text-lg text-neutral-900 truncate">SMKN 3 Jepara</div>
            <span className="text-[11px] text-neutral-500 mt-2 font-medium">Free Pickup Station</span>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div className="bg-white/80 backdrop-blur-md border border-neutral-200/80 rounded-2xl p-3 mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {[
              { id: "all", label: "Semua Produk" },
              { id: "aksesoris", label: "Aksesoris & Stiker" },
              { id: "apparel", label: "Topi & Tas" },
              { id: "perlengkapan", label: "Perlengkapan" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl font-grotesk text-xs font-semibold transition-all flex items-center gap-2 ${
                  activeFilter === tab.id
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/80 border border-neutral-200/60"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeFilter === tab.id ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-400'}`}></span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-[280px]">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2 font-grotesk text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-all"
            />
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-neutral-400 space-y-3 bg-white/90 backdrop-blur-sm rounded-3xl border border-neutral-200/80 shadow-sm">
            <span className="material-symbols-outlined text-[48px] text-neutral-300">inventory_2</span>
            <p className="text-xs font-grotesk text-neutral-500">Tidak ada produk yang sesuai dengan filter Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {filteredProducts.map((product) => (
              <div 
                key={product.id}
                onClick={() => setSelectedProductModal(product)} 
                className="group bg-white/90 backdrop-blur-sm rounded-3xl p-4 border border-neutral-200/80 shadow-sm hover:shadow-xl hover:border-neutral-900 transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden"
              >
                <div>
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-neutral-100 mb-3 flex items-center justify-center p-2 border border-neutral-100">
                    <img src={product.images?.[0] || product.imageUrl || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518"} alt={product.name} className="object-cover w-full h-full rounded-xl group-hover:scale-105 transition-transform duration-300 ease-out" />
                    
                    <div className="absolute top-2.5 left-2.5 bg-neutral-900/80 backdrop-blur-md text-white font-grotesk text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-white/20 uppercase tracking-wider">
                      Official
                    </div>

                    <button type="button" aria-label="Add to Wishlist" className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-neutral-400 hover:text-red-500 hover:scale-110 transition-all shadow-sm" onClick={(e) => { e.stopPropagation(); alert('Disimpan ke Favorit!'); }}>
                      <span className="material-symbols-outlined text-[17px]">favorite</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-900"></span>
                    <span className="font-grotesk text-[11px] font-semibold text-neutral-400 tracking-wider uppercase block">
                      {getDisplayCategory(product)}
                    </span>
                  </div>

                  <h3 className="font-grotesk font-bold text-sm md:text-base text-neutral-900 mb-4 leading-snug line-clamp-1 group-hover:text-neutral-900 transition-colors">
                    {product.name}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                  <div>
                    <span className="font-grotesk text-[10px] text-neutral-400 block leading-none mb-0.5 font-medium">Mulai dari</span>
                    <span className="font-grotesk font-bold text-sm md:text-base text-neutral-900">
                      Rp {product.price.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <button 
                    onClick={(e) => handleAddToCart(e, product)} 
                    className="shrink-0 bg-neutral-900 text-white px-4 py-2 rounded-full text-xs font-grotesk font-bold flex items-center gap-1.5 hover:bg-neutral-800 active:scale-95 transition-all shadow-md group-hover:bg-black"
                  >
                    <span className="material-symbols-outlined text-[14px]">shopping_bag</span> Beli
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Modals */}
      <ProductModal product={selectedProductModal} onClose={() => setSelectedProductModal(null)} />
      <CartDrawer />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <AdminAuthModal isOpen={isAdminAuthOpen} onClose={() => setIsAdminAuthOpen(false)} onSuccess={() => {}} />
      <OrderTrackingModal isOpen={isOrderTrackingOpen} onClose={() => setIsOrderTrackingOpen(false)} />
    </div>
  );
}
