"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMounted } from "@/lib/useMounted";
import { AlumniTicket, AlumniVerificationType, AlumniTicketBundleItem, Order, OrderItem } from "@/types/merch";
import { syncOrderToFirebase, syncAlumniTicketToFirebase } from "@/lib/firebaseService";
import { AlumniVerificationUpload } from "@/components/AlumniVerificationUpload";
import { ALUMNI_TICKET_BUNDLES, GRADUATION_YEAR_MIN, GRADUATION_YEAR_MAX } from "@/data/alumniTicketBundles";
import { DeliveryMethod } from "@/types/merch";
import Link from "next/link";

interface CheckoutData {
  bundleId: string;
  bundleName: string;
  ticketPrice: number;
  totalPrice: number;
  bundleItems: AlumniTicketBundleItem[];
  verificationType: AlumniVerificationType;
  verificationFileUrl: string;
  verificationFileName: string;
  graduationYear: number;
}

export default function CheckoutAlumniPage() {
  const router = useRouter();
  const { user } = useAuth();
  const mounted = useMounted();

  useEffect(() => {
    const saved = sessionStorage.getItem("alumni_ticket_checkout");
    if (!saved) {
      router.push("/tiket-alumni");
      return;
    }
  }, [router]);

  // Hydrasi data checkout dari sessionStorage — pola "adjust state during render", bukan effect.
  const [loadedCheckoutData, setLoadedCheckoutData] = useState<CheckoutData | null>(null);
  const savedCheckoutRaw = typeof window !== "undefined" ? sessionStorage.getItem("alumni_ticket_checkout") : null;
  if (savedCheckoutRaw && !loadedCheckoutData) {
    try {
      const data = JSON.parse(savedCheckoutRaw) as CheckoutData;
      setLoadedCheckoutData(data);
    } catch {
      // ignore
    }
  }

  const checkoutData = loadedCheckoutData;
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("081234567890");
  const [addressOrClass, setAddressOrClass] = useState("Alumni SMK");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("PICKUP_AULA_SMKN3");
  const [codLocationDetail, setCodLocationDetail] = useState("Halte SMKN 2 Jepara");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BANK_TRANSFER_QRIS">("COD");
  const [copiedBank, setCopiedBank] = useState(false);
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [verificationType, setVerificationType] = useState<AlumniVerificationType>("KARTU_PELAJAR");
  const [verificationFileUrl, setVerificationFileUrl] = useState<string | null>(null);
  const [verificationFileName, setVerificationFileName] = useState<string | null>(null);
  const [graduationYear, setGraduationYear] = useState<number | "">("");

  // Prefill dari checkoutData sekali saja — pola "adjust state during render".
  const [initializedFromCheckout, setInitializedFromCheckout] = useState(false);
  if (checkoutData && !initializedFromCheckout) {
    setInitializedFromCheckout(true);
    setVerificationType(checkoutData.verificationType);
    setVerificationFileUrl(checkoutData.verificationFileUrl);
    setVerificationFileName(checkoutData.verificationFileName);
    setGraduationYear(checkoutData.graduationYear);
  }

  const [initializedForUserId, setInitializedForUserId] = useState<string | null>(null);
  if (user && user.uid !== initializedForUserId) {
    setInitializedForUserId(user.uid);
    if (user.displayName) setCustomerName(user.displayName);
    if (user.phone) setPhone(user.phone);
    if (user.address || user.classGroup) setAddressOrClass(user.address || user.classGroup || "Alumni SMK");
  }

  const bundle = useMemo(
    () => ALUMNI_TICKET_BUNDLES.find((b) => b.id === checkoutData?.bundleId) ?? null,
    [checkoutData]
  );

  const handleCopyAccount = async () => {
    const accountNumber = "1234567890";
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
      alert(`Gagal menyalin nomor rekening. Salin manual: ${accountNumber}`);
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
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setProofFile(dataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitOrder = async () => {
    if (!customerName || !phone) {
      alert("Mohon lengkapi Nama Lengkap dan No. WhatsApp.");
      return;
    }
    if (!checkoutData) {
      alert("Data checkout tidak ditemukan. Silakan kembali dan pilih tiket lagi.");
      return;
    }
    if (!verificationFileUrl) {
      alert("Upload bukti verifikasi (Kartu Pelajar / SKL) terlebih dahulu.");
      return;
    }
    if (!graduationYear || graduationYear < GRADUATION_YEAR_MIN || graduationYear > GRADUATION_YEAR_MAX) {
      alert(`Masukkan tahun lulus yang valid (${GRADUATION_YEAR_MIN} - ${GRADUATION_YEAR_MAX}).`);
      return;
    }

    setIsSubmitting(true);

    const orderItems: OrderItem[] = [
      {
        productId: checkoutData.bundleId,
        name: checkoutData.bundleName,
        price: checkoutData.totalPrice,
        selectedSize: "-",
        selectedColor: "-",
        quantity: 1,
        imageUrl: bundle?.imageUrl || "",
        stockType: "READY"
      }
    ];

    const deliveryLabel = deliveryMethod === "PICKUP_AULA_SMKN3"
      ? "Ambil Sendiri di Aula SMKN 3 Jepara"
      : `COD Area Jepara (${codLocationDetail})`;

    const orderId = `TKT-ALM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

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
      notes: `${notes}\n\n[TIKET ALUMNI]\nTahun Lulus: ${graduationYear}\nJenis Verifikasi: ${verificationType}\nFile Verifikasi: ${verificationFileName || "uploaded"}`.trim(),
      items: orderItems,
      subtotal: checkoutData.totalPrice,
      shippingFee: 0,
      totalPrice: checkoutData.totalPrice,
      paymentMethod,
      paymentProofUrl: proofFile || undefined,
      status: paymentMethod === "COD" ? "Diverifikasi" : "Menunggu Pembayaran",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const alumniTicket: AlumniTicket = {
      id: ticketId,
      orderId: orderId,
      userId: user?.uid || guestId,
      verificationType,
      verificationFileUrl,
      graduationYear: Number(graduationYear),
      bundleId: checkoutData.bundleId,
      bundleName: checkoutData.bundleName,
      bundleItems: checkoutData.bundleItems,
      status: "PENDING_VERIFICATION",
      createdAt: new Date().toISOString()
    };

    try {
      const orderResult = await syncOrderToFirebase(newOrder);
      const ticketResult = await syncAlumniTicketToFirebase(alumniTicket);
      setSyncFailed(!orderResult.rtdbOk && !orderResult.firestoreOk && !ticketResult.rtdbOk && !ticketResult.firestoreOk);
    } catch (err) {
      console.error("Gagal sinkronisasi ke Firebase:", err);
      setSyncFailed(true);
    }

    setLastOrderId(orderId);

    const existingTicketsStr = localStorage.getItem("gala_alumni_tickets");
    const existingTickets: AlumniTicket[] = existingTicketsStr ? JSON.parse(existingTicketsStr) : [];
    localStorage.setItem("gala_alumni_tickets", JSON.stringify([alumniTicket, ...existingTickets]));

    const existingOrdersStr = localStorage.getItem("gala_merch_orders");
    const existingOrders: Order[] = existingOrdersStr ? JSON.parse(existingOrdersStr) : [];
    localStorage.setItem("gala_merch_orders", JSON.stringify([newOrder, ...existingOrders]));

    sessionStorage.removeItem("alumni_ticket_checkout");
    setIsSubmitting(false);
    setShowSuccessModal(true);
  };

  if (!checkoutData || !bundle) return null;

  return (
    <div className="min-h-screen bg-background text-on-background py-10 px-4 sm:px-6 lg:px-8 font-body-md flex flex-col items-center selection:bg-primary selection:text-on-primary">

      {/* Top Nav */}
      <div className="w-full max-w-3xl mb-8 flex items-center justify-between">
        <Link
          href="/tiket-alumni"
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary font-semibold text-sm transition"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Tiket Alumni
        </Link>
        <div className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-3 py-1.5 rounded-full">
          <span className="material-symbols-outlined text-[14px] align-middle mr-1">verified_user</span>
          Checkout Alumni
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl max-w-3xl w-full p-6 sm:p-10 shadow-sm relative mb-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-outline-variant/30 pb-8 mb-8">
          <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <span className="material-symbols-outlined text-[24px]">verified_user</span>
          </div>
          <div>
            <h1 className="font-bold text-amber-600 text-3xl font-headline-md tracking-tight">Checkout Tiket Alumni</h1>
            <p className="text-sm text-on-surface-variant mt-1">Lengkapi data diri, verifikasi alumni, dan pilih cara pembayaran</p>
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
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Kelas / Asal Sekolah</label>
              <input
                type="text"
                placeholder="Contoh: XII RPL 1 SMKN 3 Jepara"
                value={addressOrClass}
                onChange={(e) => setAddressOrClass(e.target.value)}
                className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              />
            </div>
          </div>

          {/* 2. VERIFIKASI ALUMNI */}
          <div className="space-y-4 pt-4 border-t border-outline-variant/30">
            <h4 className="font-bold text-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">verified_user</span> Verifikasi Alumni (Wajib)
            </h4>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5">
              <p className="text-xs text-slate-500 leading-relaxed">
                Tiket alumni khusus untuk alumni SMK. Wajib melampirkan bukti verifikasi dan tahun lulus.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setVerificationType("KARTU_PELAJAR")}
                  className={`p-5 rounded-2xl border-2 cursor-pointer text-center transition ${
                    verificationType === "KARTU_PELAJAR"
                      ? "border-slate-900 bg-slate-900 text-white shadow-md"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-900"
                  }`}
                >
                  <span className={`material-symbols-outlined text-[28px] block mb-2 ${verificationType === "KARTU_PELAJAR" ? "text-white" : "text-slate-400"}`}>badge</span>
                  <div className="font-bold text-sm">Kartu Pelajar</div>
                  <div className={`text-xs mt-1 ${verificationType === "KARTU_PELAJAR" ? "text-white/70" : "text-slate-400"}`}>Kartu pelajar SMK</div>
                </div>

                <div
                  onClick={() => setVerificationType("SKL")}
                  className={`p-5 rounded-2xl border-2 cursor-pointer text-center transition ${
                    verificationType === "SKL"
                      ? "border-slate-900 bg-slate-900 text-white shadow-md"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-900"
                  }`}
                >
                  <span className={`material-symbols-outlined text-[28px] block mb-2 ${verificationType === "SKL" ? "text-white" : "text-slate-400"}`}>description</span>
                  <div className="font-bold text-sm">SKL</div>
                  <div className={`text-xs mt-1 ${verificationType === "SKL" ? "text-white/70" : "text-slate-400"}`}>Surat Keterangan Lulus</div>
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
          </div>

          {/* 3. DETAIL BUNDLE */}
          <div className="space-y-4 pt-4 border-t border-outline-variant/30">
            <h4 className="font-bold text-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">shopping_bag</span> Detail Bundle
            </h4>

            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={bundle.imageUrl}
                  alt={bundle.name}
                  className="w-16 h-16 rounded-xl object-cover bg-white border border-outline-variant/30"
                />
                <div className="flex-1">
                  <p className="font-bold text-primary text-sm font-headline-md">{bundle.name}</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Tahun Lulus: {graduationYear} • Verifikasi: {verificationType === "KARTU_PELAJAR" ? "Kartu Pelajar" : "SKL"}
                  </p>
                </div>
                <span className="font-bold text-primary font-headline-md text-sm">
                  Rp {checkoutData.totalPrice.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="border-t border-outline-variant/30 pt-3 space-y-1.5">
                {checkoutData.bundleItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5">
                    <img src={item.imageUrl} alt={item.name} className="w-8 h-8 rounded-lg object-cover bg-white border border-outline-variant/30" />
                    <span className="text-xs text-on-surface-variant flex-1">{item.name}</span>
                    <span className="text-[10px] text-on-surface-variant">x{item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-outline-variant/30 pt-3 flex justify-between text-xs">
                <span className="text-on-surface-variant">Harga Tiket Alumni</span>
                <span className="font-bold text-primary">Rp {checkoutData.ticketPrice.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          {/* 4. SISTEM PENGAMBILAN */}
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
                    <span className="text-xs opacity-80 block font-medium">Khusus Alumni / Siswa Internal</span>
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
                    <span className="text-xs opacity-80 block font-medium">Pembeli Umum / Alumni</span>
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

          {/* 5. METODE PEMBAYARAN */}
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

          {/* 6. CATATAN */}
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
              <p className="text-3xl font-black text-amber-600 font-headline-md">
                Rp {checkoutData.totalPrice.toLocaleString("id-ID")}
              </p>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition transform active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Memproses Pesanan...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Konfirmasi & Buat Pesanan Tiket Alumni</span>
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
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border ${syncFailed ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
              <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>{syncFailed ? "cloud_off" : "check_circle"}</span>
            </div>

            <h3 className="font-bold text-2xl text-slate-900 mb-2 font-serif-title">{syncFailed ? "Pesanan Tersimpan di Perangkat" : "Pesanan Tiket Alumni Berhasil!"}</h3>

            {syncFailed ? (
              <div className="text-xs text-slate-500 mb-6 leading-relaxed space-y-2 max-w-[280px] mx-auto">
                <p>
                  Pesanan Anda tersimpan, namun <strong>belum terkirim ke server panitia</strong> (kendala jaringan).
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
                  <p className="font-bold text-amber-800 mb-1">PENTING — lakukan salah satu:</p>
                  <p className="text-amber-800">
                    1. Screenshot halaman ini &amp; pesan WhatsApp ke panitia, atau<br />
                    2. Buka menu Pesanan saat sinyal membaik lalu hubungi panitia dengan kode:
                  </p>
                  <p className="font-mono font-bold text-amber-900 mt-1.5 select-all">{lastOrderId}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mb-8 leading-relaxed max-w-[250px] mx-auto">
                Terima kasih! Pesanan tiket alumni Anda telah diterima. Verifikasi akan diproses dalam 1-2 hari kerja.
              </p>
            )}

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