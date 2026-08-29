"use client";

import React, { useState } from "react";
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prevBundleId, setPrevBundleId] = useState<string | null>(null);
  if (bundle.id !== prevBundleId) {
    setPrevBundleId(bundle.id);
  }

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
      bundleItems: bundle.items
    };

    sessionStorage.setItem("alumni_ticket_checkout", JSON.stringify(checkoutData));
    onClose();
    router.push("/checkout-alumni");
  };

  if (!user) return null;

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

          {/* LEFT: Product Image */}
          <div className="w-full lg:w-1/2 shrink-0">
            <div className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] w-full rounded-[2.5rem] overflow-hidden bg-slate-100 shadow-xl group">
              <img
                src={bundle.imageUrl}
                alt={bundle.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute bottom-5 right-5 bg-[#111] text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-xl">
                Rp {bundle.totalPrice.toLocaleString("id-ID")}
              </div>
            </div>

            {/* Bundle Items Grid */}
            <div className="mt-6 grid grid-cols-3 gap-2">
              {bundle.items.map((item, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-2 flex flex-col items-center gap-1.5">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full aspect-square object-cover rounded-xl bg-slate-50"
                  />
                  <span className="text-[11px] font-bold text-slate-500 text-center leading-tight line-clamp-2">{item.name}</span>
                </div>
              ))}
            </div>
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
                    <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-50 border border-slate-100" />
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