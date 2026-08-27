"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Order, OrderItem, DeliveryMethod, Product } from "@/types/merch";
import { syncOrderToFirebase, syncProductToFirebase } from "@/lib/firebaseService";
import { useMounted } from "@/lib/useMounted";
import { AlertModal } from "@/components/ui/AlertModal";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, clearCart, totalItemCount } = useCart();
  const { user } = useAuth();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressOrClass, setAddressOrClass] = useState("");

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("PICKUP_AULA_SMKN3");
  const [codLocationDetail, setCodLocationDetail] = useState("Halte SMKN 2 Jepara");

  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BANK_TRANSFER_QRIS">("COD");
  const [copiedBank, setCopiedBank] = useState(false);
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const mounted = useMounted();

  const [errors, setErrors] = useState({
    customerName: false,
    phone: false,
    addressOrClass: false,
    proofFile: false
  });

  // Redirect if cart is empty
  React.useEffect(() => {
    if (cart.length === 0 && !isSubmitting && !showInvoiceModal) {
      router.push("/keranjang");
    }
  }, [cart.length, isSubmitting, showInvoiceModal, router]);

  const clearError = (field: keyof typeof errors) => {
    setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const validate = (): boolean => {
    const newErrors = {
      customerName: customerName.trim() === "",
      phone: phone.trim() === "",
      addressOrClass: addressOrClass.trim() === "",
      proofFile: paymentMethod === "BANK_TRANSFER_QRIS" && !proofFile
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleCopyAccount = async () => {
    const accountNumber = "2041317529";
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(accountNumber);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = accountNumber;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    } catch {
      setClipboardError("Gagal menyalin nomor rekening. Salin manual: " + accountNumber);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          setProofFile(canvas.toDataURL("image/jpeg", 0.7));
          clearError("proofFile");
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitOrder = async () => {
    if (!validate()) return;

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

    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    let guestId = localStorage.getItem("gala_merch_guest_id");
    if (!guestId) {
      guestId = `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("gala_merch_guest_id", guestId);
    }

    const newOrder: Order = {
      id: orderId,
      userId: user?.uid || guestId,
      userEmail: user?.email || "",
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

    try {
      const result = await syncOrderToFirebase(newOrder);
      setSyncFailed(!result.rtdbOk && !result.firestoreOk);
    } catch (err) {
      console.error("Gagal sinkronisasi ke Firebase:", err);
      setSyncFailed(true);
    }

    try {
      const saved = localStorage.getItem("gala_merch_products");
      if (saved) {
        const products: Product[] = JSON.parse(saved);
        for (const item of cart) {
          const idx = products.findIndex((p) => p.id === item.productId);
          if (idx === -1) continue;
          const updated: Product = { ...products[idx] };
          if (updated.stockType === "READY") {
            updated.stockCount = Math.max(0, (updated.stockCount || 0) - item.quantity);
          }
          updated.soldCount = (updated.soldCount ?? 0) + item.quantity;
          products[idx] = updated;
          const r = await syncProductToFirebase(updated);
          if (!r.rtdbOk && !r.firestoreOk) {
            console.warn(`Stok produk ${updated.id} gagal disinkronkan ke Firebase`);
          }
        }
        localStorage.setItem("gala_merch_products", JSON.stringify(products));
      }
    } catch (e) {
      console.error("Gagal memperbarui stok produk:", e);
    }

    const existingOrdersStr = localStorage.getItem("gala_merch_orders");
    const existingOrders: Order[] = existingOrdersStr ? JSON.parse(existingOrdersStr) : [];
    localStorage.setItem("gala_merch_orders", JSON.stringify([newOrder, ...existingOrders]));

    clearCart();
    setLastOrder(newOrder);
    setIsSubmitting(false);
    setShowInvoiceModal(true);
  };

  if (cart.length === 0 && !isSubmitting && !showInvoiceModal) return null;

  const inputClass = (hasError: boolean) =>
    `w-full bg-surface border rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 transition ${
      hasError
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "border-outline-variant/50 focus:border-primary focus:ring-primary"
    }`;

  return (
    <div className="min-h-screen bg-background text-on-background py-10 px-4 sm:px-6 lg:px-8 font-body-md flex flex-col items-center selection:bg-primary selection:text-on-primary">

      {/* Top Nav */}
      <div className="w-full max-w-3xl mb-8 flex items-center justify-between">
        <Link
          href="/keranjang"
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary font-semibold text-sm transition"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Keranjang
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
                  placeholder="Contoh: Budi Santoso"
                  value={customerName}
                  onChange={(e) => { setCustomerName(e.target.value); clearError("customerName"); }}
                  className={inputClass(errors.customerName)}
                />
                {errors.customerName && <p className="text-[11px] text-red-500 mt-1 font-medium">Wajib diisi</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">No. WhatsApp *</label>
                  <input
                    type="tel"
                    placeholder="081234567890"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); clearError("phone"); }}
                  className={inputClass(errors.phone)}
                />
                {errors.phone && <p className="text-[11px] text-red-500 mt-1 font-medium">Wajib diisi</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Kelas / Identitas Siswa *</label>
              <input
                type="text"
                placeholder="Contoh: XII MIPA 2 SMKN 3 Jepara / Umum"
                value={addressOrClass}
                onChange={(e) => { setAddressOrClass(e.target.value); clearError("addressOrClass"); }}
                className={inputClass(errors.addressOrClass)}
              />
              {errors.addressOrClass && <p className="text-[11px] text-red-500 mt-1 font-medium">Wajib diisi</p>}
            </div>
          </div>

          {/* 2. SISTEM PENGAMBILAN MERCHANDISE */}
          <div className="space-y-4 pt-4 border-t border-outline-variant/30">
            <h4 className="font-bold text-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">location_on</span> Metode Pengambilan Merchandise *
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div
                onClick={() => setDeliveryMethod("COD_AREA_JEPARA")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  deliveryMethod === "COD_AREA_JEPARA"
                    ? "bg-primary text-on-primary border-primary shadow-md"
                    : "bg-surface-container-lowest border-outline-variant/50 text-on-surface hover:border-outline hover:bg-surface"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    deliveryMethod === "COD_AREA_JEPARA" ? "bg-on-primary text-primary" : "bg-surface-container-high text-on-surface-variant"
                  }`}>
                    <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm font-headline-md">COD Area Jepara</h5>
                    <span className="text-xs opacity-80 block font-medium">Pembeli Umum / Luar Sekolah</span>
                  </div>
                </div>
                <p className={`text-xs leading-relaxed ${deliveryMethod === "COD_AREA_JEPARA" ? "text-white/80" : "text-on-surface-variant"}`}>
                  Kami akan mengantarkan pesanan ke titik pertemuan di sekitar area Jepara Kota.
                </p>
              </div>
            </div>

            {deliveryMethod === "COD_AREA_JEPARA" && (
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
                        className="p-2.5 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-on-surface-variant hover:text-primary transition flex items-center gap-1.5"
                      >
                        {copiedBank ? <span className="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span> : <span className="material-symbols-outlined text-[16px]">content_copy</span>}
                        <span className="text-[10px] font-bold">{copiedBank ? "Tersalin" : "Salin"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-outline-variant/30">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2">Upload Bukti Pembayaran *</label>
                  {proofFile ? (
                    <div className="space-y-3">
                      <div className={`rounded-xl overflow-hidden border ${errors.proofFile ? "border-red-500" : "border-outline-variant/30"}`}>
                        <img src={proofFile} alt="Bukti pembayaran" className="w-full max-h-48 object-contain bg-surface" />
                      </div>
                      <label className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-[11px] font-bold text-on-surface-variant hover:bg-surface cursor-pointer transition">
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        Ganti Foto
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      </label>
                    </div>
                  ) : (
                    <>
                      <label className={`w-full flex items-center justify-center gap-2 bg-surface-container-lowest border-2 border-dashed rounded-xl p-6 cursor-pointer hover:border-outline hover:bg-surface transition ${
                        errors.proofFile ? "border-red-500" : "border-outline-variant"
                      }`}>
                        <span className="material-symbols-outlined text-[20px] text-outline">upload_file</span>
                        <span className="text-xs font-medium text-on-surface-variant">Pilih file gambar / foto bukti transfer</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      </label>
                      {errors.proofFile && <p className="text-[11px] text-red-500 mt-1 font-medium">Wajib upload bukti transfer</p>}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-outline-variant/30">
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Catatan Pesanan (Opsional)</label>
            <textarea
              placeholder="Catatan untuk Panitia Galaksi XII"
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

      {/* Invoice Modal */}
      {showInvoiceModal && mounted && lastOrder && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl z-10 animate-in zoom-in-95 overflow-hidden max-h-[90vh] flex flex-col">

            {/* Invoice Content (scrollable) */}
            <div className="overflow-y-auto p-6 sm:p-8">
              <div className="bg-white p-6 sm:p-8">
                {/* Invoice Header */}
                <div className="text-center mb-6 pb-4 border-b border-neutral-200">
                  <h2 className="text-lg font-bold text-neutral-900">GALAKSI XII</h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5">SMKN 3 Jepara — Invoice Pesanan</p>
                </div>

                {/* Order Info */}
                <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
                  <div>
                    <span className="text-neutral-400">Kode Pesanan</span>
                    <p className="font-bold text-neutral-900 font-mono">{lastOrder.id}</p>
                  </div>
                  <div>
                    <span className="text-neutral-400">Tanggal</span>
                    <p className="font-bold text-neutral-900">
                      {new Date(lastOrder.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-400">Nama Pemesan</span>
                    <p className="font-bold text-neutral-900">{lastOrder.customerName}</p>
                  </div>
                  <div>
                    <span className="text-neutral-400">No. WhatsApp</span>
                    <p className="font-bold text-neutral-900">{lastOrder.phone}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-5">
                  <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Detail Pesanan</h3>
                  <div className="space-y-2">
                    {lastOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-neutral-100 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-neutral-900 truncate">{item.name}</p>
                          <p className="text-neutral-400">{item.selectedSize} · Rp {item.price.toLocaleString("id-ID")} × {item.quantity}</p>
                        </div>
                        <span className="font-bold text-neutral-900 ml-3">
                          Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="border-t border-neutral-200 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Subtotal</span>
                    <span className="font-bold text-neutral-900">Rp {lastOrder.subtotal.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Pengiriman</span>
                    <span className="font-bold text-emerald-600">GRATIS</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-neutral-200">
                    <span className="font-bold text-neutral-900">Total</span>
                    <span className="font-bold text-neutral-900 text-sm">Rp {lastOrder.totalPrice.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                {/* Payment & Delivery */}
                <div className="mt-5 pt-4 border-t border-neutral-200 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-neutral-400">Pembayaran</span>
                    <p className="font-bold text-neutral-900">{lastOrder.paymentMethod === "COD" ? "COD" : "Transfer Bank / QRIS"}</p>
                  </div>
                  <div>
                    <span className="text-neutral-400">Pengambilan</span>
                    <p className="font-bold text-neutral-900">
                      {lastOrder.deliveryMethod === "PICKUP_AULA_SMKN3" ? "Aula SMKN 3" : "COD Jepara"}
                    </p>
                  </div>
                </div>

                {syncFailed && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800">
                    <p className="font-bold mb-1">Catatan: Pesanan belum terkirim ke server</p>
                    <p>Screenshot invoice ini & kirim ke panitia via WhatsApp.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-neutral-100 p-6 sm:p-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push("/merchandise")}
                className="flex-1 py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                Konfirmasi
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <AlertModal
        isOpen={!!clipboardError}
        onClose={() => setClipboardError(null)}
        title="Gagal Menyalin"
        message={clipboardError || ""}
        icon="content_copy"
        iconColor="amber"
        buttonText="Tutup"
      />

    </div>
  );
}
