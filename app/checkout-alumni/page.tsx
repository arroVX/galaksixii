"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useMounted } from "@/lib/useMounted";
import { AlumniTicket, AlumniVerificationType, AlumniTicketBundleItem, Order, OrderItem, DeliveryMethod, Product } from "@/types/merch";
import { syncOrderToFirebase, syncAlumniTicketToFirebase, syncProductToFirebase, uploadDataUrlToStorage } from "@/lib/firebaseService";
import { AlumniVerificationUpload } from "@/components/AlumniVerificationUpload";
import { GRADUATION_YEAR_MIN, GRADUATION_YEAR_MAX } from "@/data/alumniTicketBundles";
import { AlertModal } from "@/components/ui/AlertModal";
import Link from "next/link";

interface CheckoutData {
  bundleId: string;
  bundleName: string;
  bundleImageUrl: string;
  ticketPrice: number;
  totalPrice: number;
  bundleItems: AlumniTicketBundleItem[];
  isAlumniOnly?: boolean;
  verificationType?: AlumniVerificationType;
  verificationFileUrl?: string;
  verificationFileName?: string;
  graduationYear?: number;
}

// Verifikasi per baris bundle tiket (mode keranjang), key = cart item id.
// Helper murni di level modul agar tidak terikat fase render komponen.
interface CartBundleVerification {
  verificationType: AlumniVerificationType;
  fileUrl: string | null;
  fileName: string | null;
  graduationYear: number | "";
}

const EMPTY_CART_VERIFICATION: CartBundleVerification = {
  verificationType: "KARTU_PELAJAR",
  fileUrl: null,
  fileName: null,
  graduationYear: "",
};

export default function CheckoutAlumniPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, subtotal: cartSubtotal, clearCart, hydrated: cartHydrated } = useCart();
  const mounted = useMounted();

  const [loadedCheckoutData, setLoadedCheckoutData] = useState<CheckoutData | null>(null);
  // "single" = beli langsung satu bundle via sessionStorage (alur lama).
  // "cart" = dari keranjang; seluruh isi cart diproses + verifikasi per bundle tiket.
  const [checkoutMode, setCheckoutMode] = useState<"single" | "cart" | null>(null);
  const checkoutData = checkoutMode === "single" ? loadedCheckoutData : null;
  const isCartMode = checkoutMode === "cart";

  // Baris bundle tiket di cart yang wajib verifikasi alumni (Kartu Pelajar/SKL + tahun lulus).
  const ticketBundlesInCart = cart.filter(
    (item) => item.kind === "bundle" && item.isAlumniOnly !== false
  );

  useEffect(() => {
    if (sessionStorage.getItem("alumni_ticket_checkout_mode") === "cart") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrasi mode checkout dari sessionStorage (client-only source)
      setCheckoutMode("cart");
      return;
    }
    const saved = sessionStorage.getItem("alumni_ticket_checkout");
    if (!saved) {
      router.push("/tiket-alumni");
      return;
    }
    try {
      const data = JSON.parse(saved) as CheckoutData;
      setLoadedCheckoutData(data);
      setCheckoutMode("single");
    } catch { /* ignore */ }
  }, [router]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressOrClass, setAddressOrClass] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("PICKUP_AULA_SMKN3");
  const [codLocationDetail, setCodLocationDetail] = useState("Halte SMKN 2 Jepara");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BANK_TRANSFER_QRIS">("COD");
  const [copiedBank, setCopiedBank] = useState(false);
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [verificationType, setVerificationType] = useState<AlumniVerificationType>("KARTU_PELAJAR");
  const [verificationFileUrl, setVerificationFileUrl] = useState<string | null>(null);
  const [verificationFileName, setVerificationFileName] = useState<string | null>(null);
  const [graduationYear, setGraduationYear] = useState<number | "">("");

  // Verifikasi per baris bundle tiket (mode keranjang), key = cart item id.
  const [cartVerifications, setCartVerifications] = useState<Record<string, CartBundleVerification>>({});
  const [cartVerifyErrors, setCartVerifyErrors] = useState<Record<string, { file: boolean; year: boolean }>>({});

  const setCartVerification = (cartItemId: string, patch: Partial<CartBundleVerification>) => {
    setCartVerifications((prev) => ({
      ...prev,
      [cartItemId]: { ...(prev[cartItemId] ?? EMPTY_CART_VERIFICATION), ...patch },
    }));
    setCartVerifyErrors((prev) => ({ ...prev, [cartItemId]: { file: false, year: false } }));
  };

  const [initializedFromCheckout, setInitializedFromCheckout] = useState(false);
  useEffect(() => {
    if (checkoutData && !initializedFromCheckout) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- init form dari sessionStorage checkoutData
      setInitializedFromCheckout(true);
      if (checkoutData.verificationType) setVerificationType(checkoutData.verificationType);
      if (checkoutData.verificationFileUrl) setVerificationFileUrl(checkoutData.verificationFileUrl);
      if (checkoutData.verificationFileName) setVerificationFileName(checkoutData.verificationFileName);
      if (checkoutData.graduationYear) setGraduationYear(checkoutData.graduationYear);
    }
  }, [checkoutData, initializedFromCheckout]);

  const [errors, setErrors] = useState({
    customerName: false,
    phone: false,
    addressOrClass: false,
    verificationFile: false,
    graduationYear: false,
    proofFile: false
  });

  // Menggunakan data bundle langsung dari checkoutData

  const clearError = (field: keyof typeof errors) => {
    setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const validate = (): boolean => {
    if (isCartMode) return validateCart();
    const isAlumni = checkoutData?.isAlumniOnly !== false;
    const newErrors = {
      customerName: customerName.trim() === "",
      phone: phone.trim() === "",
      addressOrClass: addressOrClass.trim() === "",
      verificationFile: isAlumni && !verificationFileUrl,
      graduationYear: isAlumni && (!graduationYear || graduationYear < GRADUATION_YEAR_MIN || graduationYear > GRADUATION_YEAR_MAX),
      proofFile: paymentMethod === "BANK_TRANSFER_QRIS" && !proofFile
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  // Validasi mode keranjang: data pemesan + pembayaran + verifikasi tiap bundle tiket.
  // Catatan: filter dihitung ulang dari `cart` di sini (bukan memakai
  // `ticketBundlesInCart` level komponen) agar fungsi ini tidak terikat fase render
  // menurut analisis React Compiler (react-hooks/purity).
  const validateCart = (): boolean => {
    const newErrors = {
      customerName: customerName.trim() === "",
      phone: phone.trim() === "",
      addressOrClass: addressOrClass.trim() === "",
      verificationFile: false,
      graduationYear: false,
      proofFile: paymentMethod === "BANK_TRANSFER_QRIS" && !proofFile
    };
    setErrors(newErrors);

    const newVerifyErrors: Record<string, { file: boolean; year: boolean }> = {};
    const ticketLines = cart.filter(
      (item) => item.kind === "bundle" && item.isAlumniOnly !== false
    );
    for (const line of ticketLines) {
      const v = cartVerifications[line.id] ?? EMPTY_CART_VERIFICATION;
      newVerifyErrors[line.id] = {
        file: !v.fileUrl,
        year: !v.graduationYear || v.graduationYear < GRADUATION_YEAR_MIN || v.graduationYear > GRADUATION_YEAR_MAX,
      };
    }
    setCartVerifyErrors(newVerifyErrors);

    return (
      !Object.values(newErrors).some(Boolean) &&
      !Object.values(newVerifyErrors).some((e) => e.file || e.year)
    );
  };

  // Submit mode keranjang: satu Order gabungan + satu AlumniTicket per bundle tiket.
  const handleSubmitCartOrder = async () => {
    if (!validateCart()) return;
    if (cart.length === 0) return;

    setIsSubmitting(true);

    const orderItems: OrderItem[] = cart.map((item) => ({
      productId: item.kind === "bundle" ? (item.bundleId || item.productId) : item.productId,
      name: item.name,
      price: item.price,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
      quantity: item.quantity,
      imageUrl: item.imageUrl || "",
      stockType: item.kind === "bundle" ? "READY" : item.stockType
    }));

    const deliveryLabel = deliveryMethod === "PICKUP_AULA_SMKN3"
      ? "Ambil Sendiri di Aula SMKN 3 Jepara"
      : `COD Area Jepara (${codLocationDetail})`;

    const orderId = `TKT-ALM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    let guestId = localStorage.getItem("gala_merch_guest_id");
    if (!guestId) {
      guestId = `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("gala_merch_guest_id", guestId);
    }

    let finalProofUrl: string | undefined = proofFile || undefined;
    try {
      if (finalProofUrl?.startsWith("data:")) {
        finalProofUrl = await uploadDataUrlToStorage(finalProofUrl, `orders/${orderId}/payment-proof.jpg`);
      }
    } catch (e) {
      console.warn("Upload bukti ke Storage gagal, tetap pakai dataUrl:", e);
    }

    // Satu tiket per baris bundle tiket, masing-masing dengan verifikasinya sendiri.
    const cartSnapshot = [...cart];
    const newTickets: AlumniTicket[] = [];
    const newTicketVerifications: CartBundleVerification[] = [];
    for (const line of cartSnapshot) {
      if (!(line.kind === "bundle" && line.isAlumniOnly !== false)) continue;
      const v = cartVerifications[line.id] ?? EMPTY_CART_VERIFICATION;
      const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${line.productId.slice(-4).toUpperCase()}`;
      let finalVerificationUrl = v.fileUrl || "";
      try {
        if (finalVerificationUrl.startsWith("data:")) {
          finalVerificationUrl = await uploadDataUrlToStorage(finalVerificationUrl, `alumniTickets/${ticketId}/verification.jpg`);
        }
      } catch (e) {
        console.warn("Upload verifikasi ke Storage gagal, fallback ke dataUrl:", e);
      }
      newTickets.push({
        id: ticketId,
        orderId,
        userId: user?.uid || guestId,
        userEmail: user?.email || "",
        verificationType: v.verificationType,
        verificationFileUrl: finalVerificationUrl,
        graduationYear: Number(v.graduationYear),
        bundleId: line.bundleId || line.productId,
        bundleName: line.name,
        bundleItems: line.bundleItems || [],
        status: "PENDING_VERIFICATION",
        createdAt: new Date().toISOString()
      });
      newTicketVerifications.push({ ...v, fileName: v.fileName });
    }

    const ticketNotes = newTickets
      .map((t, i) => {
        const v = newTicketVerifications[i] ?? EMPTY_CART_VERIFICATION;
        return `[TIKET ALUMNI ${i + 1}]\nBundle: ${t.bundleName}\nTahun Lulus: ${t.graduationYear}\nJenis Verifikasi: ${v.verificationType}\nFile Verifikasi: ${v.fileName || "uploaded"}`;
      })
      .join("\n\n");
    const notesText = ticketNotes ? `${notes}\n\n${ticketNotes}`.trim() : notes.trim();

    const newOrder: Order = {
      id: orderId,
      userId: user?.uid || guestId,
      userEmail: user?.email || "",
      customerName,
      phone,
      addressOrClass: `${addressOrClass} • [PENGAMBILAN: ${deliveryLabel}]`,
      deliveryMethod,
      deliveryLocationDetail: deliveryMethod === "PICKUP_AULA_SMKN3" ? "Aula SMKN 3 Jepara" : codLocationDetail,
      notes: notesText,
      items: orderItems,
      subtotal: cartSubtotal,
      shippingFee: 0,
      totalPrice: cartSubtotal,
      paymentMethod,
      paymentProofUrl: finalProofUrl,
      status: paymentMethod === "COD" ? "Diverifikasi" : "Menunggu Pembayaran",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const orderResult = await syncOrderToFirebase(newOrder);
      const ticketResults = await Promise.all(newTickets.map((t) => syncAlumniTicketToFirebase(t)));
      const ticketsOk = ticketResults.every((r) => r.rtdbOk && r.firestoreOk);
      if (!orderResult.rtdbOk || !orderResult.firestoreOk || !ticketsOk) {
        console.warn("Sinkronisasi sebagian gagal", { orderResult, ticketResults });
      }
    } catch (err) {
      console.error("Gagal sinkronisasi ke Firebase:", err);
    }

    const existingTicketsStr = localStorage.getItem("gala_alumni_tickets");
    const existingTickets: AlumniTicket[] = existingTicketsStr ? JSON.parse(existingTicketsStr) : [];
    localStorage.setItem("gala_alumni_tickets", JSON.stringify([...newTickets, ...existingTickets]));

    const existingOrdersStr = localStorage.getItem("gala_merch_orders");
    const existingOrders: Order[] = existingOrdersStr ? JSON.parse(existingOrdersStr) : [];
    localStorage.setItem("gala_merch_orders", JSON.stringify([newOrder, ...existingOrders]));

    // Kurangi stok lokal untuk baris merch reguler (bundle tidak mengurangi stok).
    let updatedProductsForSync: Product[] | null = null;
    try {
      const saved = localStorage.getItem("gala_merch_products");
      if (saved) {
        const products: Product[] = JSON.parse(saved);
        for (const item of cartSnapshot) {
          if (item.kind === "bundle") continue;
          const idx = products.findIndex((p) => p.id === item.productId);
          if (idx === -1) continue;
          const updated: Product = { ...products[idx] };
          if (updated.stockType === "READY") {
            updated.stockCount = Math.max(0, (updated.stockCount || 0) - item.quantity);
          }
          updated.soldCount = (updated.soldCount ?? 0) + item.quantity;
          updated.updatedAt = Date.now();
          products[idx] = updated;
        }
        localStorage.setItem("gala_merch_products", JSON.stringify(products));
        updatedProductsForSync = products;
      }
    } catch (e) {
      console.error("Gagal memperbarui stok produk lokal:", e);
    }

    clearCart();
    sessionStorage.removeItem("alumni_ticket_checkout_mode");
    setLastOrder(newOrder);
    setIsSubmitting(false);
    setShowInvoiceModal(true);

    // Sync stok merch ke Firebase di BACKGROUND (fire-and-forget, tanpa double-decrement).
    if (updatedProductsForSync) {
      try {
        const stockPromises = cartSnapshot
          .filter((item) => item.kind !== "bundle")
          .map((item) => {
            const prod = updatedProductsForSync!.find((p) => p.id === item.productId);
            if (!prod) return Promise.resolve();
            return syncProductToFirebase(prod).catch((err) => {
              console.warn(`Stok produk ${prod.id} gagal disinkronkan ke Firebase:`, err);
            });
          });
        Promise.all(stockPromises).catch(console.warn);
      } catch (e) {
        console.error("Background stok sync error:", e);
      }
    }
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
      if (file.size > 5 * 1024 * 1024) {
        setClipboardError("Ukuran file terlalu besar. Maksimal 5MB.");
        e.target.value = "";
        return;
      }
      if (!file.type.startsWith("image/")) {
        setClipboardError("Format file harus gambar.");
        e.target.value = "";
        return;
      }
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
        img.onerror = () => setClipboardError("Gagal memproses gambar.");
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitOrder = async () => {
    if (isCartMode) {
      await handleSubmitCartOrder();
      return;
    }
    if (!validate()) return;
    if (!checkoutData) return;

    setIsSubmitting(true);

    const orderItems: OrderItem[] = [
      {
        productId: checkoutData.bundleId,
        name: checkoutData.bundleName,
        price: checkoutData.totalPrice,
        selectedSize: "-",
        selectedColor: "-",
        quantity: 1,
        imageUrl: checkoutData.bundleImageUrl || "",
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

    const isAlumni = checkoutData.isAlumniOnly !== false;

    const notesText = isAlumni
      ? `${notes}\n\n[TIKET ALUMNI]\nTahun Lulus: ${graduationYear}\nJenis Verifikasi: ${verificationType}\nFile Verifikasi: ${verificationFileName || "uploaded"}`.trim()
      : notes.trim();

    // Upload bukti bayar & verifikasi ke Storage jika berupa dataUrl besar
    let finalProofUrl: string | undefined = proofFile || undefined;
    let finalVerificationUrl = verificationFileUrl || "";
    try {
      if (finalProofUrl?.startsWith("data:")) {
        finalProofUrl = await uploadDataUrlToStorage(finalProofUrl, `orders/${orderId}/payment-proof.jpg`);
      }
      if (isAlumni && finalVerificationUrl.startsWith("data:")) {
        finalVerificationUrl = await uploadDataUrlToStorage(finalVerificationUrl, `alumniTickets/${ticketId}/verification.jpg`);
      }
    } catch (e) {
      console.warn("Upload ke Storage gagal, fallback ke dataUrl:", e);
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
      notes: notesText,
      items: orderItems,
      subtotal: checkoutData.totalPrice,
      shippingFee: 0,
      totalPrice: checkoutData.totalPrice,
      paymentMethod,
      paymentProofUrl: finalProofUrl,
      status: paymentMethod === "COD" ? "Diverifikasi" : "Menunggu Pembayaran",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const alumniTicket: AlumniTicket = {
      id: ticketId,
      orderId,
      userId: user?.uid || guestId,
      userEmail: user?.email || "",
      verificationType: isAlumni ? verificationType : "SKL",
      verificationFileUrl: isAlumni ? (finalVerificationUrl || "") : "-",
      graduationYear: isAlumni ? Number(graduationYear) : new Date().getFullYear(),
      bundleId: checkoutData.bundleId,
      bundleName: checkoutData.bundleName,
      bundleItems: checkoutData.bundleItems,
      status: isAlumni ? "PENDING_VERIFICATION" : "VERIFIED",
      createdAt: new Date().toISOString()
    };

    try {
      const orderResult = await syncOrderToFirebase(newOrder);
      const ticketResult = await syncAlumniTicketToFirebase(alumniTicket);
      if (!orderResult.rtdbOk || !orderResult.firestoreOk || !ticketResult.rtdbOk || !ticketResult.firestoreOk) {
        console.warn("Sinkronisasi sebagian gagal", { orderResult, ticketResult });
      }
    } catch (err) {
      console.error("Gagal sinkronisasi ke Firebase:", err);
    }

    const existingTicketsStr = localStorage.getItem("gala_alumni_tickets");
    const existingTickets: AlumniTicket[] = existingTicketsStr ? JSON.parse(existingTicketsStr) : [];
    localStorage.setItem("gala_alumni_tickets", JSON.stringify([alumniTicket, ...existingTickets]));

    const existingOrdersStr = localStorage.getItem("gala_merch_orders");
    const existingOrders: Order[] = existingOrdersStr ? JSON.parse(existingOrdersStr) : [];
    localStorage.setItem("gala_merch_orders", JSON.stringify([newOrder, ...existingOrders]));

    sessionStorage.removeItem("alumni_ticket_checkout");
    setLastOrder(newOrder);
    setIsSubmitting(false);
    setShowInvoiceModal(true);
  };

  if (checkoutMode === null) return null;
  if (checkoutMode === "single" && !checkoutData) return null;

  // Mode keranjang tanpa isi (mis. setelah clearCart + tombol kembali): tampilkan
  // pesan kosong alih-alih redirect agar tidak balapan dengan hydrasi localStorage.
  if (isCartMode && cartHydrated && cart.length === 0 && !showInvoiceModal && !isSubmitting) {
    return (
      <div className="min-h-screen bg-background text-on-background py-10 px-4 font-body-md flex flex-col items-center">
        <div className="w-full max-w-3xl bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-10 text-center space-y-4">
          <span className="material-symbols-outlined text-[48px] text-outline">shopping_bag</span>
          <h1 className="font-bold text-xl text-primary">Keranjang Kosong</h1>
          <p className="text-sm text-on-surface-variant">Tidak ada item untuk di-checkout. Silakan pilih bundle atau merchandise terlebih dahulu.</p>
          <Link
            href="/keranjang"
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white text-sm font-bold rounded-xl"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Kembali ke Keranjang
          </Link>
        </div>
      </div>
    );
  }

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
          href={isCartMode ? "/keranjang" : "/tiket-alumni"}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary font-semibold text-sm transition"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {isCartMode ? "Kembali ke Keranjang" : "Kembali ke Tiket & Bundling"}
        </Link>
        <div className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-3 py-1.5 rounded-full">
          <span className="material-symbols-outlined text-[14px] align-middle mr-1">verified_user</span>
          Checkout
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl max-w-3xl w-full p-6 sm:p-10 shadow-sm relative mb-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-outline-variant/30 pb-8 mb-8">
          <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <span className="material-symbols-outlined text-[24px]">verified_user</span>
          </div>
          <div>
            <h1 className="font-bold text-primary text-3xl font-headline-md tracking-tight">Checkout Tiket & Bundling</h1>
            <p className="text-sm text-on-surface-variant mt-1">Lengkapi data diri, verifikasi identitas, dan pilih cara pembayaran</p>
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
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Kelas / Asal Sekolah *</label>
              <input
                type="text"
                placeholder="Contoh: XII RPL 1 SMKN 3 Jepara"
                value={addressOrClass}
                onChange={(e) => { setAddressOrClass(e.target.value); clearError("addressOrClass"); }}
                className={inputClass(errors.addressOrClass)}
              />
              {errors.addressOrClass && <p className="text-[11px] text-red-500 mt-1 font-medium">Wajib diisi</p>}
            </div>
          </div>

          {/* 2. ALUMNI VERIFICATION (mode tunggal) */}
          {!isCartMode && checkoutData?.isAlumniOnly !== false && (
            <div className="space-y-4 pt-4 border-t border-outline-variant/30">
              <h4 className="font-bold text-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">school</span> Verifikasi Alumni
              </h4>

              <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 sm:p-6 space-y-6">
                <div>
                  <label className="block text-[11px] font-black text-slate-900 tracking-widest mb-3">JENIS VERIFIKASI *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => { setVerificationType("KARTU_PELAJAR"); setVerificationFileUrl(null); setVerificationFileName(null); clearError("verificationFile"); }}
                      className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold border-2 transition-all ${
                        verificationType === "KARTU_PELAJAR" ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/50 text-on-surface-variant hover:border-outline-variant hover:bg-surface-container-high"
                      }`}
                    >
                      Kartu Pelajar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setVerificationType("SKL"); setVerificationFileUrl(null); setVerificationFileName(null); clearError("verificationFile"); }}
                      className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold border-2 transition-all ${
                        verificationType === "SKL" ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/50 text-on-surface-variant hover:border-outline-variant hover:bg-surface-container-high"
                      }`}
                    >
                      Surat Keterangan Lulus (SKL)
                    </button>
                  </div>
                </div>

                <AlumniVerificationUpload
                  onFileChange={(url, name) => {
                    setVerificationFileUrl(url);
                    setVerificationFileName(name);
                    clearError("verificationFile");
                  }}
                  currentFileUrl={verificationFileUrl}
                  currentFileName={verificationFileName}
                  label={`Upload ${verificationType === "KARTU_PELAJAR" ? "Kartu Pelajar" : "SKL"} *`}
                />
                {errors.verificationFile && <p className="text-[11px] text-red-500 font-medium">Wajib upload bukti verifikasi</p>}

                <div>
                  <label className="block text-[11px] font-black text-slate-900 tracking-widest mb-3">TAHUN LULUS *</label>
                  <div className="relative">
                    <select
                      value={graduationYear}
                      onChange={(e) => { setGraduationYear(e.target.value ? Number(e.target.value) : ""); clearError("graduationYear"); }}
                      className={`w-full bg-white border rounded-2xl px-4 py-3 text-sm text-slate-900 appearance-none focus:outline-none focus:ring-1 transition ${
                        errors.graduationYear ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                      }`}
                    >
                      <option value="">Pilih Tahun Lulus</option>
                      {Array.from({ length: GRADUATION_YEAR_MAX - GRADUATION_YEAR_MIN + 1 }, (_, i) => GRADUATION_YEAR_MAX - i).map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                  </div>
                  {errors.graduationYear && <p className="text-[11px] text-red-500 mt-1 font-medium">Wajib pilih tahun lulus ({GRADUATION_YEAR_MIN} - {GRADUATION_YEAR_MAX})</p>}
                </div>
              </div>
            </div>
          )}

          {/* 2b. VERIFIKASI ALUMNI PER BUNDLE TIKET (mode keranjang) */}
          {isCartMode && ticketBundlesInCart.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-outline-variant/30">
              <h4 className="font-bold text-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">school</span> Verifikasi Alumni per Tiket
              </h4>

              {ticketBundlesInCart.map((line, idx) => {
                const v = cartVerifications[line.id] ?? EMPTY_CART_VERIFICATION;
                const verr = cartVerifyErrors[line.id];
                return (
                <div key={line.id} className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 sm:p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    {line.imageUrl ? (
                      <img src={line.imageUrl} alt={line.name} className="w-12 h-12 rounded-xl object-cover bg-white border border-outline-variant/30" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-outline">
                        <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-black text-on-surface-variant tracking-widest">TIKET {idx + 1}</p>
                      <p className="font-bold text-primary text-sm">{line.name}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-900 tracking-widest mb-3">JENIS VERIFIKASI *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCartVerification(line.id, { verificationType: "KARTU_PELAJAR", fileUrl: null, fileName: null })}
                        className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold border-2 transition-all ${
                          v.verificationType === "KARTU_PELAJAR" ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/50 text-on-surface-variant hover:border-outline-variant hover:bg-surface-container-high"
                        }`}
                      >
                        Kartu Pelajar
                      </button>
                      <button
                        type="button"
                        onClick={() => setCartVerification(line.id, { verificationType: "SKL", fileUrl: null, fileName: null })}
                        className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold border-2 transition-all ${
                          v.verificationType === "SKL" ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/50 text-on-surface-variant hover:border-outline-variant hover:bg-surface-container-high"
                        }`}
                      >
                        Surat Keterangan Lulus (SKL)
                      </button>
                    </div>
                  </div>

                  <AlumniVerificationUpload
                    onFileChange={(url, name) => {
                      setCartVerifications((prev) => ({
                        ...prev,
                        [line.id]: { ...(prev[line.id] ?? EMPTY_CART_VERIFICATION), fileUrl: url, fileName: name },
                      }));
                      setCartVerifyErrors((prev) => ({ ...prev, [line.id]: { file: false, year: false } }));
                    }}
                    currentFileUrl={v.fileUrl}
                    currentFileName={v.fileName}
                    label={`Upload ${v.verificationType === "KARTU_PELAJAR" ? "Kartu Pelajar" : "SKL"} *`}
                  />
                  {verr?.file && <p className="text-[11px] text-red-500 font-medium">Wajib upload bukti verifikasi untuk {line.name}</p>}

                  <div>
                    <label className="block text-[11px] font-black text-slate-900 tracking-widest mb-3">TAHUN LULUS *</label>
                    <div className="relative">
                      <select
                        value={v.graduationYear}
                        onChange={(e) => setCartVerification(line.id, { graduationYear: e.target.value ? Number(e.target.value) : "" })}
                        className={`w-full bg-white border rounded-2xl px-4 py-3 text-sm text-slate-900 appearance-none focus:outline-none focus:ring-1 transition ${
                          verr?.year ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                        }`}
                      >
                        <option value="">Pilih Tahun Lulus</option>
                        {Array.from({ length: GRADUATION_YEAR_MAX - GRADUATION_YEAR_MIN + 1 }, (_, i) => GRADUATION_YEAR_MAX - i).map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                    </div>
                    {verr?.year && <p className="text-[11px] text-red-500 mt-1 font-medium">Wajib pilih tahun lulus ({GRADUATION_YEAR_MIN} - {GRADUATION_YEAR_MAX})</p>}
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* 3. DETAIL PESANAN (mode keranjang: seluruh isi cart) */}
          {isCartMode && (
          <div className="space-y-4 pt-4 border-t border-outline-variant/30">
            <h4 className="font-bold text-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">shopping_bag</span> Detail Pesanan ({cart.length} item)
            </h4>

            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 space-y-3">
              {cart.map((line) => {
                const isBundleLine = line.kind === "bundle";
                const isTicketLine = isBundleLine && line.isAlumniOnly !== false;
                return (
                <div key={line.id} className="border-b border-outline-variant/30 last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-3">
                    {line.imageUrl ? (
                      <img src={line.imageUrl} alt={line.name} className="w-14 h-14 rounded-xl object-cover bg-white border border-outline-variant/30" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-surface-container-high flex items-center justify-center text-outline">
                        <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {isBundleLine && (
                        <span className={`inline-block text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full mb-1 ${isTicketLine ? "bg-amber-100 text-amber-800" : "bg-white text-on-surface-variant border border-outline-variant/30"}`}>
                          {isTicketLine ? "Tiket Bundle" : "Bundle Non-Tiket"}
                        </span>
                      )}
                      <p className="font-bold text-primary text-sm truncate">{line.name}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {isBundleLine ? "1 tiket" : `${line.selectedSize} · ${line.selectedColor}`} × {line.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-primary text-sm shrink-0">
                      Rp {(line.price * line.quantity).toLocaleString("id-ID")}
                    </span>
                  </div>
                  {isBundleLine && line.bundleItems && line.bundleItems.length > 0 && (
                    <div className="ml-[68px] mt-2 space-y-1">
                      {line.bundleItems.map((bItem, i) => (
                        <p key={i} className="text-[11px] text-on-surface-variant">• {bItem.name} <span className="text-outline">x{bItem.quantity}</span></p>
                      ))}
                    </div>
                  )}
                </div>
                );
              })}

              <div className="border-t border-outline-variant/30 pt-3 flex justify-between text-sm">
                <span className="font-bold text-primary">Subtotal</span>
                <span className="font-bold text-primary">Rp {cartSubtotal.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
          )}

          {/* 3. DETAIL BUNDLE (mode tunggal) */}
          {!isCartMode && checkoutData && (
          <div className="space-y-4 pt-4 border-t border-outline-variant/30">
            <h4 className="font-bold text-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">shopping_bag</span> Detail Bundle
            </h4>

            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <img src={checkoutData.bundleImageUrl} alt={checkoutData.bundleName} className="w-16 h-16 rounded-xl object-cover bg-white border border-outline-variant/30" />
                <div className="flex-1">
                  <p className="font-bold text-primary text-sm font-headline-md">{checkoutData.bundleName}</p>
                  {checkoutData.isAlumniOnly !== false && (
                    <p className="text-xs text-on-surface-variant mt-1">
                      Tahun Lulus: {graduationYear} • Verifikasi: {verificationType === "KARTU_PELAJAR" ? "Kartu Pelajar" : "SKL"}
                    </p>
                  )}
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
                <span className="text-on-surface-variant">Harga Tiket</span>
                <span className="font-bold text-primary">Rp {checkoutData.ticketPrice.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
          )}

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
                    <span className="text-xs opacity-80 block font-medium">Khusus Pelanggan / Siswa Internal</span>
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
                    <span className="text-xs opacity-80 block font-medium">Pembeli Umum</span>
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

          {/* 6. CATATAN */}
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
              <p className="text-3xl font-black text-amber-600 font-headline-md">
                Rp {(isCartMode ? cartSubtotal : checkoutData?.totalPrice ?? 0).toLocaleString("id-ID")}
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

            <div className="overflow-y-auto p-6 sm:p-8">
              <div className="bg-white p-6 sm:p-8">
                <div className="text-center mb-6 pb-4 border-b border-neutral-200">
                  <h2 className="text-lg font-bold text-neutral-900">GALAKSI XII</h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Invoice Tiket Alumni</p>
                </div>

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

                <div className="mb-5">
                  <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Detail Pesanan</h3>
                  <div className="space-y-2">
                    {lastOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-neutral-100 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-neutral-900 truncate">{item.name}</p>
                          <p className="text-neutral-400">Rp {item.price.toLocaleString("id-ID")}</p>
                        </div>
                        <span className="font-bold text-neutral-900 ml-3">
                          Rp {item.price.toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

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

                <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-800">
                  <p className="font-bold">Pesanan berhasil dibuat</p>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-100 p-6 sm:p-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push("/")}
                className="flex-1 py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                Kembali ke Beranda
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
