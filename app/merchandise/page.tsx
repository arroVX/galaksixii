"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ProductModal } from "@/components/ProductModal";
import { AdminDashboard } from "@/components/admin";
import { Product } from "@/types/merch";
import { INITIAL_PRODUCTS } from "@/data/mockProducts";

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

const loadInitialProducts = (): Product[] => {
  if (typeof window === "undefined") return INITIAL_PRODUCTS;
  const saved = localStorage.getItem("gala_merch_products");
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Product[];
      if (parsed.length > 0) return parsed;
    } catch { /* ignore */ }
  }
  localStorage.setItem("gala_merch_products", JSON.stringify(INITIAL_PRODUCTS));
  return INITIAL_PRODUCTS;
};

export default function MerchandisePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>(loadInitialProducts);
  const [activeView, setActiveView] = useState<"shop" | "admin">("shop");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);

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
          <h1 className="font-dot-matrix text-5xl md:text-7xl lg:text-[80px] font-bold text-neutral-900 tracking-widest uppercase mb-4 opacity-90">
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
                className={`whitespace-nowrap px-4 py-2 text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-all border ${
                  activeFilter === filter.id 
                    ? "bg-neutral-900 text-white border-neutral-900 shadow-md" 
                    : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400 hover:text-neutral-900"
                }`}
                style={{ borderRadius: '2px' }}
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
              className="w-full bg-neutral-50 border border-neutral-200 pl-11 pr-4 py-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all" 
              style={{ borderRadius: '2px' }}
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
                className="group bg-white p-4 sm:p-5 border border-neutral-200 hover:border-neutral-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer relative"
                style={{ borderRadius: '2px' }}
              >
                {/* Decoration corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div>
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100 mb-4 flex items-center justify-center p-2" style={{ borderRadius: '2px' }}>
                    <img src={product.images?.[0] || product.imageUrl || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518"} alt={product.name} className="object-cover w-full h-full mix-blend-multiply group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                  </div>

                  <span className="font-dot-matrix text-[10px] font-bold text-neutral-400 tracking-widest uppercase block mb-2">
                    {"//"} {getDisplayCategory(product)}
                  </span>
                  <h3 className="font-sans font-bold text-sm md:text-base text-neutral-900 mb-4 leading-snug">
                    {product.name}
                  </h3>
                </div>

                <div className="flex items-end justify-between pt-4 border-t border-dashed border-neutral-200">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest uppercase text-neutral-400 block mb-1">HARGA</span>
                    <span className="font-dot-matrix text-lg md:text-xl font-bold text-neutral-900 tracking-wider">
                      Rp {product.price.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <button 
                    onClick={(e) => handleAddToCart(e, product)} 
                    className="shrink-0 bg-neutral-900 text-white w-10 h-10 flex items-center justify-center hover:bg-[#e45b45] active:scale-95 transition-colors"
                    style={{ borderRadius: '2px' }}
                    title="Tambah ke keranjang"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
        )}

      {/* Modals */}
      <ProductModal product={selectedProductModal} onClose={() => setSelectedProductModal(null)} />
    </>
  );
}
