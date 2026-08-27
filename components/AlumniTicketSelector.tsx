"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlumniTicketBundle } from "@/types/merch";
import { AlumniVerificationUpload } from "@/components/AlumniVerificationUpload";
import { GRADUATION_YEAR_MIN, GRADUATION_YEAR_MAX } from "@/data/alumniTicketBundles";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft } from "lucide-react";

interface AlumniTicketSelectorProps {
  bundle: AlumniTicketBundle;
  onClose: () => void;
}

export const AlumniTicketSelector: React.FC<AlumniTicketSelectorProps> = ({ bundle, onClose }) => {
  const router = useRouter();
  const { user, showAuthAlert } = useAuth();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [verificationType, setVerificationType] = useState<"KARTU_PELAJAR" | "SKL">("KARTU_PELAJAR");
  const [verificationFileUrl, setVerificationFileUrl] = useState<string | null>(null);
  const [verificationFileName, setVerificationFileName] = useState<string | null>(null);
  const [graduationYear, setGraduationYear] = useState<number | "">(new Date().getFullYear());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizes = bundle.merchVariants.sizes;
  const colors = bundle.merchVariants.colors;

  const [prevBundleId, setPrevBundleId] = useState<string | null>(null);
  if (bundle.id !== prevBundleId) {
    setPrevBundleId(bundle.id);
    if (sizes.length > 0) setSelectedSize(sizes[0]);
    if (colors.length > 0) setSelectedColor(colors[0]);
  }

  const handleContinue = () => {
    setError(null);

    if (!selectedSize || !selectedColor) {
      setError("Pilih ukuran dan warna merchandise terlebih dahulu.");
      return;
    }

    if (!verificationFileUrl) {
      setError("Upload bukti verifikasi (Kartu Pelajar / SKL) terlebih dahulu.");
      return;
    }

    if (!graduationYear || graduationYear < GRADUATION_YEAR_MIN || graduationYear > GRADUATION_YEAR_MAX) {
      setError(`Masukkan tahun lulus yang valid (${GRADUATION_YEAR_MIN} - ${GRADUATION_YEAR_MAX}).`);
      return;
    }

    if (!user) {
      showAuthAlert("Silakan masuk terlebih dahulu untuk membeli tiket alumni.");
      return;
    }

    const checkoutData = {
      bundleId: bundle.id,
      bundleName: bundle.name,
      ticketPrice: bundle.ticketPrice,
      merchProductId: bundle.merchProductId,
      totalPrice: bundle.totalPrice,
      selectedSize,
      selectedColor,
      verificationType,
      verificationFileUrl,
      verificationFileName,
      graduationYear: Number(graduationYear)
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
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-full text-slate-700 text-xs font-bold shadow-sm hover:bg-slate-50 hover:scale-105 transition-all"
          >
            <ArrowLeft size={16} />
            Kembali ke Tiket Alumni
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
          </div>

          {/* RIGHT: Form */}
          <div className="w-full lg:w-1/2 flex flex-col pt-2 sm:pt-6">

            <div className="flex items-center gap-3 mb-5">
              <span className="px-3 py-1 bg-slate-200/70 text-slate-700 font-black text-[10px] tracking-wider uppercase rounded-full">
                TIKET ALUMNI BUNDLE
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-black font-serif-title text-slate-900 leading-[1.1] tracking-tight mb-5">
              {bundle.name}
            </h1>

            <p className="text-slate-600 leading-relaxed font-medium mb-6 text-sm">
              {bundle.description}
            </p>

            {/* Detail & Deskripsi Box */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 mb-8 shadow-sm space-y-3">
              <h3 className="flex items-center gap-2 text-[11px] font-black text-slate-900 tracking-widest mb-4">
                <span className="material-symbols-outlined text-[16px] text-slate-700">shopping_bag</span> DETAIL BUNDLE
              </h3>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Harga Tiket Alumni</span>
                <span className="font-bold text-slate-900">Rp {bundle.ticketPrice.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600 border-t border-slate-100 pt-3">
                <span>Merchandise</span>
                <span className="font-bold text-slate-900">Rp {(bundle.totalPrice - bundle.ticketPrice).toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold text-lg border-t border-slate-200 pt-3">
                <span>Total</span>
                <span className="text-slate-900">Rp {bundle.totalPrice.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* Variant Selectors */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 mb-8 shadow-sm space-y-5">
              <h3 className="flex items-center gap-2 text-[11px] font-black text-slate-900 tracking-widest">
                <span className="material-symbols-outlined text-[16px] text-slate-700">straighten</span> PILIH VARIAN MERCHANDISE
              </h3>

              {sizes.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-black text-slate-900 tracking-widest mb-3">UKURAN</h4>
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
                  <h4 className="text-[11px] font-black text-slate-900 tracking-widest mb-3">WARNA</h4>
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

            {/* Verifikasi Alumni */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 mb-8 shadow-sm space-y-5">
              <h3 className="flex items-center gap-2 text-[11px] font-black text-slate-900 tracking-widest">
                <span className="material-symbols-outlined text-[16px] text-slate-700">verified_user</span> VERIFIKASI ALUMNI (WAJIB)
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">
                Tiket alumni khusus untuk alumni SMK. Wajib melampirkan bukti verifikasi dan tahun lulus.
              </p>

              <div>
                <label className="text-[11px] font-black text-slate-900 tracking-widest mb-3 block">JENIS VERIFIKASI *</label>
                <div className="grid grid-cols-2 gap-3">
                  {["KARTU_PELAJAR", "SKL"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setVerificationType(type as "KARTU_PELAJAR" | "SKL")}
                      className={`p-4 rounded-2xl border-2 text-center transition ${
                        verificationType === type
                          ? "border-slate-900 bg-slate-900 text-white shadow-md"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-900"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[24px] block mb-2 ${verificationType === type ? "text-white" : "text-slate-400"}`}>
                        {type === "KARTU_PELAJAR" ? "badge" : "description"}
                      </span>
                      <div className="font-bold text-xs">
                        {type === "KARTU_PELAJAR" ? "Kartu Pelajar" : "SKL"}
                      </div>
                      <div className={`text-[10px] mt-1 ${verificationType === type ? "text-white/70" : "text-slate-400"}`}>
                        {type === "KARTU_PELAJAR" ? "Kartu pelajar SMK" : "Surat Keterangan Lulus"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <AlumniVerificationUpload
                onFileChange={(url, name) => {
                  setVerificationFileUrl(url);
                  setVerificationFileName(name);
                }}
                currentFileUrl={verificationFileUrl}
                currentFileName={verificationFileName}
                label={`Upload ${verificationType === "KARTU_PELAJAR" ? "Kartu Pelajar" : "SKL"} *`}
              />

              <div>
                <label className="block text-[11px] font-black text-slate-900 tracking-widest mb-3">TAHUN LULUS *</label>
                <div className="relative">
                  <select
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-900 appearance-none focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
                  >
                    <option value="">Pilih Tahun Lulus</option>
                    {Array.from({ length: GRADUATION_YEAR_MAX - GRADUATION_YEAR_MIN + 1 }, (_, i) => GRADUATION_YEAR_MAX - i).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Rentang: {GRADUATION_YEAR_MIN} - {GRADUATION_YEAR_MAX}</p>
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