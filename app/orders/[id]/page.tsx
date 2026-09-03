"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Order } from "@/types/merch";
import { useAuth } from "@/context/AuthContext";
import { ADMIN_WA_NUMBER } from "@/lib/config";

const STATUS_COLORS: Record<string, string> = {
  "Menunggu Pembayaran": "text-amber-600",
  "Diverifikasi": "text-blue-600",
  "Sedang Diproduksi": "text-purple-600",
  "Siap Diambil/Dikirim": "text-blue-600",
  "Selesai": "text-emerald-600",
  "Dibatalkan": "text-red-500"
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      // Cari dari localStorage dulu
      const savedOrdersStr = localStorage.getItem("gala_merch_orders");
      if (savedOrdersStr) {
        try {
          const parsed: Order[] = JSON.parse(savedOrdersStr);
          const found = parsed.find(o => o.id === id && (o.userId === user?.uid || o.userEmail === user?.email));
          if (found) {
            setOrder(found);
            setLoadingOrder(false);
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }

      // Cari dari Firebase
      if (user) {
        try {
          const { fetchOrdersForUser } = await import("@/lib/firebaseService");
          const userOrders = await fetchOrdersForUser(user.uid, user.email);
          const found = userOrders.find(o => o.id === id);
          if (found) {
            setOrder(found);
          }
        } catch (err) {
          console.warn("Failed to fetch order from Firebase:", err);
        }
      }

      setLoadingOrder(false);
    };

    if (user) loadOrder();
  }, [id, user]);

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-100 rounded-2xl max-w-md w-full p-8 shadow-sm text-center space-y-5">
            <div className="w-14 h-14 rounded-xl bg-neutral-900 text-white mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">lock</span>
            </div>
            <h2 className="text-xl font-semibold font-headline-md text-neutral-900">
              Masuk untuk Melihat Pesanan
            </h2>
            <Link
              href="/login"
              className="w-full py-3 px-6 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-[13px] flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
              <span>Masuk ke Akun</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (loadingOrder) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
            <p className="text-[13px] text-neutral-400">Memuat pesanan...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-100 rounded-2xl max-w-md w-full p-8 shadow-sm text-center space-y-4">
            <span className="material-symbols-outlined text-[48px] text-neutral-300 block">search_off</span>
            <h2 className="text-xl font-semibold font-headline-md text-neutral-900">
              Pesanan Tidak Ditemukan
            </h2>
            <p className="text-[13px] text-neutral-400">
              Pesanan dengan ID ini tidak ditemukan atau bukan milik Anda.
            </p>
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white font-medium text-[13px] rounded-xl hover:bg-neutral-800 transition active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Kembali ke Pesanan</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Back Button */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-neutral-500 hover:text-neutral-900 transition"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Kembali ke Pesanan</span>
        </Link>

        {/* Order Header */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-neutral-400">receipt</span>
                <span className="font-mono text-[15px] font-medium text-neutral-900">{order.id}</span>
              </div>
              <p className="text-[13px] text-neutral-400">
                {new Date(order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <span className={`text-[13px] font-medium ${STATUS_COLORS[order.status] || "text-neutral-500"}`}>
              {order.status}
            </span>
          </div>

          {/* Customer Info */}
          <div className="flex flex-wrap gap-4 text-[13px]">
            <div className="flex items-center gap-2 text-neutral-500">
              <span className="material-symbols-outlined text-[16px]">person</span>
              <span>{order.customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-500">
              <span className="material-symbols-outlined text-[16px]">call</span>
              <span>{order.phone}</span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-4">
          <h3 className="text-[13px] font-medium text-neutral-500">Barang yang Dipesan</h3>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-14 h-14 rounded-xl object-cover bg-neutral-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-neutral-900 truncate">{item.name}</p>
                  <div className="flex items-center gap-2 text-[12px] text-neutral-400 mt-0.5">
                    {item.selectedSize && <span>Ukuran: {item.selectedSize}</span>}
                    {item.selectedColor && <span>· Warna: {item.selectedColor}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-medium text-neutral-900">
                    Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                  </p>
                  <p className="text-[12px] text-neutral-400">
                    {item.quantity} × Rp {item.price.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-3">
          <h3 className="text-[13px] font-medium text-neutral-500">Ringkasan Harga</h3>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal</span>
              <span>Rp {order.subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Ongkir</span>
              <span>{order.shippingFee > 0 ? `Rp ${order.shippingFee.toLocaleString("id-ID")}` : "Gratis"}</span>
            </div>
            <div className="border-t border-neutral-100 pt-2 flex justify-between font-medium text-neutral-900">
              <span>Total</span>
              <span>Rp {order.totalPrice.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>

        {/* Payment & Delivery Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-2">
            <h3 className="text-[13px] font-medium text-neutral-500">Pembayaran</h3>
            <p className="text-[13px] text-neutral-900 font-medium">
              {order.paymentMethod === "COD" ? "Bayar di Tempat (COD)" : "Transfer Bank / QRIS"}
            </p>
            {order.paymentProofUrl && (
              <div className="pt-2">
                <p className="text-[12px] text-neutral-400 mb-1.5">Bukti Bayar:</p>
                <img
                  src={order.paymentProofUrl}
                  alt="Bukti Pembayaran"
                  className="w-full max-w-[200px] rounded-xl border border-neutral-100"
                />
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-2">
            <h3 className="text-[13px] font-medium text-neutral-500">Pengiriman</h3>
            <p className="text-[13px] text-neutral-900">
              {order.addressOrClass}
            </p>
            {order.notes && (
              <p className="text-[12px] text-neutral-400 italic mt-1">
                &quot;{order.notes}&quot;
              </p>
            )}
          </div>
        </div>

        {/* WA Admin Button */}
        <a
          href={`https://wa.me/${ADMIN_WA_NUMBER}?text=Halo%20Admin,%20saya%20ingin%20menanyakan%20status%20pesanan%20dengan%20Kode:%20${order.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-neutral-900 text-white text-[13px] font-medium rounded-xl hover:bg-neutral-800 transition active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">chat</span>
          <span>Tanya Admin via WhatsApp</span>
        </a>
      </main>
    </div>
  );
}
