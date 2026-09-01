"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlumniTicketBundle } from "@/types/merch";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft } from "lucide-react";

interface AlumniTicketSelectorProps {
  bundle: AlumniTicketBundle;
  onClose: () => void;
}

export const AlumniTicketSelector: React.FC<AlumniTicketSelectorProps> = ({ bundle, onClose }) => {
  const router = useRouter();
  const { user, showAuthAlert } = useAuth();

  const [isSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carousel — sama seperti ProductModal (swipe + keyboard + mouse drag)
  // Fallback: jika bundle.images belum diisi (data lama Firebase), pakai item images agar slider tetap berfungsi
  const allImages = useMemo(
    () =>
      Array.from(
        new Set(
          [
            bundle.imageUrl,
            ...(bundle.images || []),
            ...bundle.items.map((i) => i.imageUrl).filter(Boolean) as string[],
          ].filter(Boolean) as string[]
        )
      ),
    [bundle.imageUrl, bundle.images, bundle.items]
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset index saat bundle berganti
    setCurrentImageIndex(0);
  }, [bundle.id]);

  useEffect(() => {
    if (allImages.length <= 1) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [allImages.length, handlePrevImage, handleNextImage]);

  const onTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const threshold = 35;
    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) handleNextImage();
      else handlePrevImage();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };
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

  const handleContinue = () => {
    setError(null);

    if (!user) {
      showAuthAlert("Silakan masuk terlebih dahulu untuk membeli tiket.");
      return;
    }

    const checkoutData = {
      bundleId: bundle.id,
      bundleName: bundle.name,
      bundleImageUrl: bundle.imageUrl,
      ticketPrice: bundle.ticketPrice,
      totalPrice: bundle.totalPrice,
      bundleItems: bundle.items,
      isAlumniOnly: bundle.isAlumniOnly ?? true
    };

    sessionStorage.setItem("alumni_ticket_checkout", JSON.stringify(checkoutData));
    onClose();
    router.push("/checkout-alumni");
  };



  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-[#F8F8F6] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col min-h-full relative">

        <div className="mb-6 sm:mb-10">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-full text-slate-700 text-xs font-bold shadow-sm hover:bg-slate-50 hover:scale-105 transition-all"
          >
            <ArrowLeft size={16} />
            Kembali ke Tiket & Bundling
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start flex-1 pb-20">

          {/* LEFT: Bundle Image — swipe jari ke samping untuk lihat foto lain */}
          <div className="w-full lg:w-1/2 shrink-0">
            <div
              role="region"
              aria-roledescription="carousel"
              aria-label={`Galeri ${bundle.name}`}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseLeave}
              style={{ touchAction: "pan-y" }}
              className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] w-full rounded-[2.5rem] overflow-hidden bg-slate-100 shadow-xl group select-none cursor-grab active:cursor-grabbing"
            >
              <img
                src={allImages[currentImageIndex] || bundle.imageUrl}
                alt={`${bundle.name} foto ${currentImageIndex + 1} dari ${allImages.length}`}
                draggable={false}
                className="w-full h-full object-cover select-none pointer-events-none"
              />
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    aria-label="Foto sebelumnya"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur hover:bg-white rounded-full hidden lg:flex items-center justify-center shadow-lg text-slate-800 transition-all active:scale-95 z-10 lg:opacity-0 lg:group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    aria-label="Foto berikutnya"
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur hover:bg-white rounded-full hidden lg:flex items-center justify-center shadow-lg text-slate-800 transition-all active:scale-95 z-10 lg:opacity-0 lg:group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10" aria-hidden="true">
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        aria-label={`Lihat foto ${idx + 1}`}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`h-2 rounded-full transition-all ${idx === currentImageIndex ? "bg-white w-4" : "bg-white/50 w-2"}`}
                      />
                    ))}
                  </div>
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10">
                    {currentImageIndex + 1} / {allImages.length}
                  </div>
                </>
              )}
              <div className="absolute bottom-5 right-5 bg-[#111] text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-xl z-10">
                Rp {bundle.totalPrice.toLocaleString("id-ID")}
              </div>
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto hide-scrollbar pb-2 px-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Lihat foto ${idx + 1}`}
                    aria-current={idx === currentImageIndex ? "true" : undefined}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${idx === currentImageIndex ? "border-slate-800 opacity-100 scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}
                  >
                    <img src={img} alt={`${bundle.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Form */}
          <div className="w-full lg:w-1/2 flex flex-col pt-2 sm:pt-6">

            <div className="flex items-center gap-3 mb-5">
              <span className="px-3 py-1 bg-slate-200/70 text-slate-700 font-black text-[10px] tracking-wider uppercase rounded-full">
                TIKET ALUMNI BUNDLE
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[52px] font-black font-serif-title text-slate-900 leading-[1.1] tracking-tight mb-5">
              {bundle.name}
            </h1>

            <p className="text-slate-600 leading-relaxed font-medium mb-6 text-sm">
              {bundle.description}
            </p>

            {/* Detail Bundle */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 mb-8 shadow-sm space-y-3">
              <h3 className="flex items-center gap-2 text-[11px] font-black text-slate-900 tracking-widest mb-4">
                <span className="material-symbols-outlined text-[16px] text-slate-700">shopping_bag</span> ISI BUNDLE
              </h3>

              <div className="space-y-2.5">
                {bundle.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-50 border border-slate-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300">
                        <span className="material-symbols-outlined text-[16px]">image</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-3 mt-3 space-y-1.5">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Harga Tiket</span>
                  <span className="font-bold text-slate-900">Rp {bundle.ticketPrice.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold text-lg">
                  <span>Total</span>
                  <span>Rp {bundle.totalPrice.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 mb-4 animate-in slide-in-from-top-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </div>
            )}

            {/* Action Bar */}
            <div className="mt-auto bg-[#222] p-2.5 rounded-full flex items-center justify-center shadow-2xl w-full gap-2">
              <button
                onClick={handleContinue}
                disabled={isSubmitting}
                className="flex-[1.2] py-3 px-6 bg-white text-slate-900 hover:bg-slate-100 rounded-full flex items-center justify-center gap-2 text-xs font-black transition-colors shadow-inner disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">confirmation_number</span>
                <span>{isSubmitting ? "Memproses..." : "Lanjut ke Checkout"}</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};