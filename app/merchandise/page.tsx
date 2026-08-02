"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductModal } from "@/components/ProductModal";
import { CartDrawer } from "@/components/CartDrawer";
import { AuthModal } from "@/components/AuthModal";
import { AdminAuthModal } from "@/components/AdminAuthModal";
import { OrderTrackingModal } from "@/components/OrderTrackingModal";
import { DotMatrixBackground } from "@/components/DotMatrixBackground";
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
    <div className="min-h-screen bg-background text-on-background flex flex-col font-body-md selection:bg-primary selection:text-on-primary relative overflow-hidden">
      {/* Animated Dot Matrix Background */}
      <DotMatrixBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
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
        
        {/* Title & Description */}
        <div className="mb-8 mt-4 md:mt-8">
          <h1 className="text-3xl md:text-4xl font-bold font-headline-md text-black tracking-tight mb-2">
            Official Merchandise
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-2xl leading-relaxed">
            Koleksi suvenir & produk official merchandise eksklusif Gala Aksi Siswa (GALAKSI XII) SMKN 3 Jepara edisi HUT & Dies Natalis.
          </p>
        </div>

        {/* Filter & Search Controls Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          {/* Category Filter Pills (Left) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button 
              onClick={() => setActiveFilter("all")}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-xs transition-all ${
                activeFilter === "all" 
                  ? "bg-black text-white font-bold shadow-sm" 
                  : "bg-[#f0ecec] text-gray-700 border border-gray-200/60 font-medium hover:bg-gray-200"
              }`}
            >
              Semua Produk
            </button>
            <button 
              onClick={() => setActiveFilter("aksesoris")}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-xs transition-all ${
                activeFilter === "aksesoris" 
                  ? "bg-black text-white font-bold shadow-sm" 
                  : "bg-[#f0ecec] text-gray-700 border border-gray-200/60 font-medium hover:bg-gray-200"
              }`}
            >
              Aksesoris & Stiker
            </button>
            <button 
              onClick={() => setActiveFilter("apparel")}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-xs transition-all ${
                activeFilter === "apparel" 
                  ? "bg-black text-white font-bold shadow-sm" 
                  : "bg-[#f0ecec] text-gray-700 border border-gray-200/60 font-medium hover:bg-gray-200"
              }`}
            >
              Topi & Tas
            </button>
            <button 
              onClick={() => setActiveFilter("perlengkapan")}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-xs transition-all ${
                activeFilter === "perlengkapan" 
                  ? "bg-black text-white font-bold shadow-sm" 
                  : "bg-[#f0ecec] text-gray-700 border border-gray-200/60 font-medium hover:bg-gray-200"
              }`}
            >
              Perlengkapan
            </button>
          </div>

          {/* Search Bar (Right) */}
          <div className="relative w-full md:w-[300px]">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
            <input 
              type="text" 
              placeholder="Cari produk merchandise..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200/80 rounded-full pl-10 pr-4 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all shadow-sm" 
            />
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-gray-400 space-y-3 bg-white rounded-3xl border border-gray-200/80 shadow-sm">
            <span className="material-symbols-outlined text-[48px] text-gray-300">inventory_2</span>
            <p className="text-sm font-medium text-gray-500">Tidak ada produk yang sesuai dengan filter Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {filteredProducts.map((product) => (
              <div 
                key={product.id}
                onClick={() => setSelectedProductModal(product)} 
                className="group bg-white rounded-3xl p-3.5 border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#f7f5f5] mb-3 flex items-center justify-center p-2">
                    <img src={product.images?.[0] || product.imageUrl || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518"} alt={product.name} className="object-cover w-full h-full rounded-xl group-hover:scale-105 transition-transform duration-300 ease-out" />
                    
                    <button type="button" aria-label="Add to Wishlist" className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:scale-110 transition-all shadow-sm" onClick={(e) => { e.stopPropagation(); alert('Disimpan ke Favorit!'); }}>
                      <span className="material-symbols-outlined text-[17px]">favorite</span>
                    </button>
                  </div>

                  <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase block mb-1">
                    {getDisplayCategory(product)}
                  </span>
                  <h3 className="font-headline-md font-bold text-sm md:text-base text-gray-900 mb-3 leading-snug line-clamp-1">
                    {product.name}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-[10px] text-gray-400 block leading-none mb-0.5">Mulai dari</span>
                    <span className="font-headline-md font-bold text-sm md:text-base text-gray-900">
                      Rp {product.price.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <button 
                    onClick={(e) => handleAddToCart(e, product)} 
                    className="shrink-0 bg-black text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-neutral-800 active:scale-95 transition-all shadow-sm"
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
    </div>
  );
}
