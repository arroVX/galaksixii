"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/merch";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Info, Plus, Minus, ShoppingBag, Zap } from "lucide-react";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const router = useRouter();
  const { addToCart } = useCart();
  const { user, showAuthAlert } = useAuth();
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");

  const sizes = product?.variants?.sizes ?? [];
  const colors = product?.variants?.colors ?? [];
  const maxQuantity = !product
    ? 1
    : product.stockType === "READY"
      ? Math.max(1, product.stockCount || 1)
      : 99;

  // Tentukan seluruh gambar yang ada — memoize biar referensi stabil untuk callback
  const allImages = useMemo(
    () => Array.from(new Set([product?.imageUrl, ...(product?.images || [])])).filter(Boolean) as string[],
    [product?.imageUrl, product?.images]
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Refs untuk swipe — support touch + mouse/pointer
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  const handleNextImage = useCallback(() => {
    if (allImages.length <= 1) return;
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const handlePrevImage = useCallback(() => {
    if (allImages.length <= 1) return;
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  useEffect(() => {
    if (product) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form saat produk berganti (derived state)
      setQuantity(1);
      setSelectedSize(product.variants?.sizes?.[0] ?? "Standard");
      setSelectedColor(product.variants?.colors?.[0] ?? "Standard");
      setCurrentImageIndex(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  // Keyboard ArrowLeft / ArrowRight untuk slide — pakai callback yang memoize
  useEffect(() => {
    if (!product || allImages.length <= 1) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [product, allImages.length, handlePrevImage, handleNextImage]);

  // --- Swipe touch (pakai changedTouches biar reliable even tanpa move) ---
  const onTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - touchStartX.current;
    const dy = endY - touchStartY.current;
    // Abaikan swipe vertikal (scroll) — hanya kalau horizontal > vertikal
    const threshold = 35;
    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) handleNextImage();
      else handlePrevImage();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // --- Mouse drag untuk test di desktop ---
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    if (allImages.length <= 1) return;
    isDragging.current = true;
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current || touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.clientX - touchStartX.current;
    const dy = e.clientY - touchStartY.current;
    const threshold = 35;
    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) handleNextImage();
      else handlePrevImage();
    }
    isDragging.current = false;
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const onMouseLeave = () => {
    isDragging.current = false;
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (!product) return null;

  const isPO = product.stockType === "PRE_ORDER";
  
  // Format price
  const formattedPrice = `Rp ${product.price.toLocaleString("id-ID")}`;

  const handleAction = (isBuyNow: boolean) => {
    if (!user) {
      showAuthAlert("Silakan masuk atau daftar akun terlebih dahulu untuk berbelanja.");
      return;
    }
    addToCart(product, selectedSize || "Standard", selectedColor || "Standard", quantity);
    onClose();
    if (isBuyNow) {
      router.push("/checkout");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-[#F8F8F6] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
      
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col min-h-full relative">
        
        {/* Back Button (Top Left) */}
        <div className="mb-6 sm:mb-10">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-full text-slate-700 text-xs font-bold shadow-sm hover:bg-slate-50 hover:scale-105 transition-all"
          >
            <ArrowLeft size={16} />
            Kembali ke Toko
          </button>
        </div>

        {/* Main Content: 2 Columns */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start flex-1 pb-20">
          
          {/* LEFT: Product Image — swipe jari ke samping untuk lihat foto lain */}
          <div className="w-full lg:w-1/2 shrink-0">
            <div
              role="region"
              aria-roledescription="carousel"
              aria-label={`Galeri ${product.name}`}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseLeave}
              style={{ touchAction: "pan-y" }}
              className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] w-full rounded-[2.5rem] overflow-hidden bg-slate-100 shadow-xl group select-none cursor-grab active:cursor-grabbing"
            >
              <img
                src={allImages[currentImageIndex] || product.imageUrl}
                alt={`${product.name} foto ${currentImageIndex + 1} dari ${allImages.length}`}
                draggable={false}
                className="w-full h-full object-cover select-none pointer-events-none"
              />
              
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    aria-label="Foto sebelumnya"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur hover:bg-white rounded-full flex items-center justify-center shadow-lg text-slate-800 transition-all active:scale-95 z-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    aria-label="Foto berikutnya"
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur hover:bg-white rounded-full flex items-center justify-center shadow-lg text-slate-800 transition-all active:scale-95 z-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                  
                  {/* Dots */}
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10" aria-hidden="true">
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        aria-label={`Lihat foto ${idx + 1}`}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50 w-2'}`}
                      />
                    ))}
                  </div>
                  {/* Counter untuk aksesibilitas */}
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10">
                    {currentImageIndex + 1} / {allImages.length}
                  </div>
                </>
              )}

              {/* Price Tag Capsule */}
              <div className="absolute bottom-5 right-5 bg-[#111] text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-xl z-10">
                {formattedPrice}
              </div>
            </div>

            {/* Thumbnails below image */}
            {allImages.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto hide-scrollbar pb-2 px-1">
                {allImages.map((img, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    aria-label={`Lihat foto ${idx + 1}`}
                    aria-current={idx === currentImageIndex ? "true" : undefined}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${idx === currentImageIndex ? 'border-slate-800 opacity-100 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Details */}
          <div className="w-full lg:w-1/2 flex flex-col pt-2 sm:pt-6">
            
            {/* Category & Status Pills */}
            <div className="flex items-center gap-3 mb-5">
              <span className="px-3 py-1 bg-slate-200/70 text-slate-700 font-black text-[11px] tracking-wider uppercase rounded-full">
                {product.category}
              </span>
              <span className={`px-3 py-1 font-black text-[10px] tracking-wider uppercase rounded-full ${isPO ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                {isPO ? "PRE-ORDER" : "IN STOCK"}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-[52px] font-black font-serif-title text-slate-900 leading-[1.1] tracking-tight mb-5">
              {product.name}
            </h1>

            {/* Detail & Deskripsi Box */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 mb-8 shadow-sm">
              <h3 className="flex items-center gap-2 text-[11px] font-black text-slate-900 tracking-widest mb-4">
                <Info size={16} className="text-slate-700" /> DETAIL & DESKRIPSI
              </h3>
              <div className="text-[13px] text-slate-600 leading-relaxed font-medium">
                {product.description || "Koleksi official merchandise Galaksi. Dibuat dengan material premium dan didesain secara khusus untuk memperingati Dies Natalis SMKN 3 Jepara."}
              </div>
            </div>

            {/* Variant Selectors */}
            {(sizes.length > 0 || colors.length > 0) && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 mb-8 shadow-sm space-y-5">
                {sizes.length > 0 && (
                  <div>
                    <h3 className="text-[11px] font-black text-slate-900 tracking-widest mb-3">UKURAN</h3>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                            selectedSize === s
                              ? "bg-slate-900 text-white shadow-md"
                              : "bg-white border border-slate-300 text-slate-700 hover:border-slate-900"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {colors.length > 0 && (
                  <div>
                    <h3 className="text-[11px] font-black text-slate-900 tracking-widest mb-3">WARNA</h3>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((c) => (
                        <button
                          key={c}
                          onClick={() => setSelectedColor(c)}
                          className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                            selectedColor === c
                              ? "bg-slate-900 text-white shadow-md"
                              : "bg-white border border-slate-300 text-slate-700 hover:border-slate-900"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stock Info */}
            {!isPO ? (
              <p className={`text-xs font-semibold mb-8 ${maxQuantity <= 1 ? "text-red-500" : "text-slate-500"}`}>
                {maxQuantity <= 1
                  ? "Stok hampir habis — segera amankan pesananmu!"
                  : `Tersedia ${product.stockCount} unit`}
              </p>
            ) : (
              <p className="text-xs font-semibold text-amber-600 mb-8">
                Pre-order — estimasi rilis: {product.poReleaseDate ?? "menyusul"}
              </p>
            )}

            {/* Action Bar (Black Capsule) */}
            <div className="mt-auto bg-[#222] p-2.5 rounded-full flex items-center justify-between shadow-2xl max-w-lg w-full gap-1.5 overflow-hidden">
              
              {/* Left: Quantity Selector */}
              <div className="flex items-center gap-2.5 px-3 shrink-0">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="text-white font-bold text-sm w-5 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Middle: Keranjang */}
              <button 
                onClick={() => handleAction(false)}
                className="flex-1 min-w-0 py-3 px-2 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center gap-1.5 text-xs font-bold transition-colors"
              >
                <ShoppingBag size={14} className="shrink-0" />
                <span className="truncate">+ Keranjang</span>
              </button>

              {/* Right: Beli Sekarang */}
              <button 
                onClick={() => handleAction(true)}
                className="flex-[1.2] min-w-0 py-3 px-2 bg-white text-slate-900 hover:bg-slate-100 rounded-full flex items-center justify-center gap-1.5 text-xs font-black transition-colors shadow-inner"
              >
                <Zap size={14} className="shrink-0" />
                <span className="truncate">Beli Sekarang</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
