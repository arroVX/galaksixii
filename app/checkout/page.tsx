"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Order, OrderItem, DeliveryMethod } from "@/types/merch";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, clearCart, totalItemCount } = useCart();
  const { user } = useAuth();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("081234567890");
  const [addressOrClass, setAddressOrClass] = useState("Kelas / Umum");
  
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("PICKUP_AULA_SMKN3");
  const [codLocationDetail, setCodLocationDetail] = useState("Halte SMKN 2 Jepara");
  
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BANK_TRANSFER_QRIS">("COD");
  const [copiedBank, setCopiedBank] = useState(false);
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize from user if available
  useEffect(() => {
    if (user) {
      if (user.displayName) setCustomerName(user.displayName);
      if (user.phone) setPhone(user.phone);
      if (user.address || user.classGroup) setAddressOrClass(user.address || user.classGroup || "Kelas / Umum");
    }
  }, [user]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0 && !isSubmitting) {
      router.push("/");
    }
  }, [cart.length, isSubmitting, router]);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText("1234567890");
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fakeUrl = URL.createObjectURL(file);
      setProofFile(fakeUrl);
    }
  };

  const handleSubmitOrder = () => {
    if (!customerName || !phone) {
      alert("Mohon lengkapi Nama Lengkap dan No. WhatsApp.");
      return;
    }

    setIsSubmitting(true);

    const orderItems: OrderItem[] = cart.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
      stockType: item.stockType
    }));

    const deliveryLabel = deliveryMethod === "PICKUP_AULA_SMKN3" 
      ? "Ambil Sendiri di Aula SMKN 3 Jepara"
      : `COD Area Jepara (${codLocationDetail})`;

    const newOrder: Order = {
      id: "ORD-" + Math.floor(100000 + Math.random() * 900000),
      userId: user?.uid || "guest-" + Date.now(),
      userEmail: user?.email || `${customerName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      customerName,
      phone,
      addressOrClass: `${addressOrClass} • [PENGAMBILAN: ${deliveryLabel}]`,
      deliveryMethod,
      deliveryLocationDetail: deliveryMethod === "PICKUP_AULA_SMKN3" ? "Aula SMKN 3 Jepara" : codLocationDetail,
      notes,
      items: orderItems,
      subtotal,
      shippingFee: 0,
      totalPrice: subtotal,
      paymentMethod,
      paymentProofUrl: proofFile || undefined,
      status: paymentMethod === "COD" ? "Diverifikasi" : "Menunggu Pembayaran",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTimeout(() => {
      const existingOrdersStr = localStorage.getItem("gala_merch_orders");
      const existingOrders: Order[] = existingOrdersStr ? JSON.parse(existingOrdersStr) : [];
      localStorage.setItem("gala_merch_orders", JSON.stringify([newOrder, ...existingOrders]));

      try {
        const { syncOrderToFirebase } = require("@/lib/firebaseService");
        syncOrderToFirebase(newOrder);
      } catch (err) {
        console.warn("Firebase sync err:", err);
      }

      clearCart();

      // For COD, we no longer need to redirect to WhatsApp since it is handled by the system

      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 800);
  };

  if (cart.length === 0 && !isSubmitting && !showSuccessModal) return null;

  return (
    <div className="min-h-screen bg-background text-on-background py-10 px-4 sm:px-6 lg:px-8 font-body-md flex flex-col items-center selection:bg-primary selection:text-on-primary">
      
      {/* Top Nav */}
      <div className="w-full max-w-3xl mb-8 flex items-center justify-between">
        <Link 
          href="/merchandise"
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary font-semibold text-sm transition"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Belanja
        </Link>
        <div className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-3 py-1.5 rounded-full">
          {totalItemCount} Barang di Keranjang
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl max-w-3xl w-full p-6 sm:p-10 shadow-sm relative mb-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-outline-variant/30 pb-8 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-md">
            <span className="material-symbols-outlined text-[24px]">shopping_cart_checkout</span>
          </div>
          <div>
            <h1 className="font-bold text-primary text-3xl font-headline-md tracking-tight">Checkout Pemesanan</h1>
            <p className="text-sm text-on-surface-variant mt-1">Lengkapi data diri, pilih opsi pengambilan, dan cara pembayaran</p>
          </div>
        </div>

        <div className="space-y-8">
          
          {/* 1. INFORMASI PEMESAN */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">person</span> Informasi Pemesan
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">No. WhatsApp *</label>
                <input
                  type="text"
                  required
                  placeholder="081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Kelas / Identitas Siswa</label>
              <input
                type="text"
                placeholder="Contoh: XII MIPA 2 SMKN 3 Jepara / Umum"
                value={addressOrClass}
                onChange={(e) => setAddressOrClass(e.target.value)}
                className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              />
            </div>
          </div>

          {/* 2. SISTEM PENGAMBILAN MERCHANDISE */}
          <div className="space-y-4 pt-4 border-t border-outline-variant/30">
            <h4 className="font-bold text-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">location_on</span> Metode Pengambilan Merchandise *
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1 */}
              <div
                onClick={() => setDeliveryMethod("PICKUP_AULA_SMKN3")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  deliveryMethod === "PICKUP_AULA_SMKN3"
                    ? "bg-primary text-on-primary border-primary shadow-md"
                    : "bg-surface-container-lowest border-outline-variant/50 text-on-surface hover:border-outline hover:bg-surface"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    deliveryMethod === "PICKUP_AULA_SMKN3" ? "bg-on-primary text-primary" : "bg-surface-container-high text-on-surface-variant"
                  }`}>
                    <span className="material-symbols-outlined text-[20px]">domain</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm font-headline-md">Ambil di Aula SMKN 3</h5>
                    <span className="text-xs opacity-80 block font-medium">Khusus Murid / Siswa Internal</span>
                  </div>
                </div>
                <p className={`text-xs leading-relaxed ${deliveryMethod === "PICKUP_AULA_SMKN3" ? "text-white/80" : "text-on-surface-variant"}`}>
                  Silakan ambil pesanan Anda langsung di Aula SMKN 3 Jepara pada saat hari H acara / jam kerja.
                </p>
              </div>

              {/* Option 2 */}
              <div
                onClick={() => setDeliveryMethod("COD_JEPARA")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  deliveryMethod === "COD_JEPARA"
                    ? "bg-primary text-on-primary border-primary shadow-md"
                    : "bg-surface-container-lowest border-outline-variant/50 text-on-surface hover:border-outline hover:bg-surface"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    deliveryMethod === "COD_JEPARA" ? "bg-on-primary text-primary" : "bg-surface-container-high text-on-surface-variant"
                  }`}>
                    <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm font-headline-md">COD Area Jepara</h5>
                    <span className="text-xs opacity-80 block font-medium">Pembeli Umum / Luar Sekolah</span>
                  </div>
                </div>
                <p className={`text-xs leading-relaxed ${deliveryMethod === "COD_JEPARA" ? "text-white/80" : "text-on-surface-variant"}`}>
                  Kami akan mengantarkan pesanan ke titik pertemuan di sekitar area Jepara Kota.
                </p>
              </div>
            </div>

            {deliveryMethod === "COD_JEPARA" && (
              <div className="mt-3 animate-in slide-in-from-top-2 fade-in">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Titik Lokasi COD (Pertemuan)</label>
                <div className="relative">
                  <select
                    value={codLocationDetail}
                    onChange={(e) => setCodLocationDetail(e.target.value)}
                    className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  >
                    <option value="Halte SMKN 2 Jepara">Halte SMKN 2 Jepara</option>
                    <option value="Aula SMKN 3 Jepara">Aula SMKN 3 Jepara</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. METODE PEMBAYARAN */}
          <div className="space-y-4 pt-4 border-t border-outline-variant/30">
            <h4 className="font-bold text-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">credit_card</span> Metode Pembayaran
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setPaymentMethod("COD")}
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition ${
                  paymentMethod === "COD"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : "border-outline-variant/50 bg-surface-container-lowest text-on-surface hover:border-outline"
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === "COD" ? "border-emerald-500" : "border-outline"
                }`}>
                  {paymentMethod === "COD" && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-[20px] ${paymentMethod === "COD" ? "text-emerald-600" : "text-outline"}`}>payments</span>
                  <span className="font-bold text-sm">Bayar di Tempat (COD)</span>
                </div>
              </div>

              <div
                onClick={() => setPaymentMethod("BANK_TRANSFER_QRIS")}
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition ${
                  paymentMethod === "BANK_TRANSFER_QRIS"
                    ? "border-primary bg-surface-container text-primary"
                    : "border-outline-variant/50 bg-surface-container-lowest text-on-surface hover:border-outline"
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === "BANK_TRANSFER_QRIS" ? "border-primary" : "border-outline"
                }`}>
                  {paymentMethod === "BANK_TRANSFER_QRIS" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-[20px] ${paymentMethod === "BANK_TRANSFER_QRIS" ? "text-primary" : "text-outline"}`}>qr_code_scanner</span>
                  <span className="font-bold text-sm">Transfer Bank / QRIS</span>
                </div>
              </div>
            </div>

            {paymentMethod === "BANK_TRANSFER_QRIS" && (
              <div className="mt-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-2 fade-in">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-bold text-primary text-sm mb-1">Transfer Bank BNI</h5>
                    <p className="text-xs text-on-surface-variant mb-2 font-medium">a.n. Salsabila Rahma</p>
                    <div className="flex items-center gap-2">
                      <code className="bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-outline-variant/30 font-bold text-sm text-primary">
                        2041317529
                      </code>
                      <button
                        onClick={handleCopyAccount}
                        className="p-1.5 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-on-surface-variant hover:text-primary transition flex items-center gap-1.5"
                      >
                        {copiedBank ? <span className="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span> : <span className="material-symbols-outlined text-[16px]">content_copy</span>}
                        <span className="text-[10px] font-bold">{copiedBank ? "Tersalin" : "Salin"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-outline-variant/30">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2">Upload Bukti Pembayaran (Opsional)</label>
                  <label className="w-full flex items-center justify-center gap-2 bg-surface-container-lowest border-2 border-dashed border-outline-variant rounded-xl p-6 cursor-pointer hover:border-outline hover:bg-surface transition">
                    <span className="material-symbols-outlined text-[20px] text-outline">upload_file</span>
                    <span className="text-xs font-medium text-on-surface-variant">
                      {proofFile ? "Bukti sudah dipilih. Klik untuk mengubah." : "Pilih file gambar / foto bukti transfer"}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-outline-variant/30">
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Catatan Pesanan (Opsional)</label>
            <textarea
              placeholder="*Catatan untuk Panitia Galaksi XII"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-24 resize-none transition"
            />
          </div>

          {/* Action Footer */}
          <div className="mt-10 pt-6 border-t border-outline-variant/30 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-6">
            
            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex-1 w-full max-w-sm">
              <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-widest block mb-1">TOTAL PEMBAYARAN:</span>
              <p className="text-3xl font-black text-primary font-headline-md">
                Rp {subtotal.toLocaleString("id-ID")}
              </p>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-primary hover:bg-neutral-800 text-on-primary font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition transform active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Memproses Pesanan...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Konfirmasi & Buat Pesanan</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* Checkout Success Modal */}
      {showSuccessModal && mounted && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => router.push("/orders")}></div>
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl z-10 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100">
              <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            
            <h3 className="font-bold text-2xl text-slate-900 mb-2 font-serif-title">Pesanan Berhasil!</h3>
            <p className="text-xs text-slate-500 mb-8 leading-relaxed max-w-[250px] mx-auto">
              Terima kasih! Pesanan Anda telah diterima dan sedang diproses. Silakan pantau status pesanan Anda.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => router.push("/orders")}
                className="w-full bg-slate-900 text-white hover:bg-slate-800 font-bold py-3.5 px-4 rounded-full text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                Cek Pesanan Saya <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              </button>
              <button 
                onClick={() => router.push("/")}
                className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold py-3.5 px-4 rounded-full text-xs transition-all active:scale-95"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
