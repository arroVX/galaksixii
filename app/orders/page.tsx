"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Order, OrderStatus } from "@/types/merch";
import { useAuth } from "@/context/AuthContext";

const STATUS_STEPS: OrderStatus[] = [
  "Menunggu Pembayaran",
  "Diverifikasi",
  "Sedang Diproduksi",
  "Siap Diambil/Dikirim",
  "Selesai"
];

export default function OrdersPage() {
  const { user, loading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let initialLocalOrders: Order[] = [];
    const savedOrdersStr = localStorage.getItem("gala_merch_orders");
    if (savedOrdersStr) {
      try {
        const parsed: Order[] = JSON.parse(savedOrdersStr);
        initialLocalOrders = parsed.filter(o => o.userId === user?.uid || o.userEmail === user?.email);
        // Hydrasi cache pesanan lokal saat mount (sumber eksternal, tidak tersedia saat SSR).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOrders(initialLocalOrders);
        if (initialLocalOrders.length > 0) setSelectedOrder(initialLocalOrders[0]);
      } catch (e) {
        console.error(e);
      }
    }

    const loadUserOrdersFromFirebase = async () => {
      if (!user) return;
      try {
        // Ambil hanya pesanan milik user ini (query ter-scope di server), bukan seluruh koleksi.
        const { fetchOrdersForUser } = await import("@/lib/firebaseService");
        const userFbOrders = await fetchOrdersForUser(user.uid, user.email);

        if (userFbOrders.length > 0) {
          const map = new Map<string, Order>();
          initialLocalOrders.forEach(o => map.set(o.id, o));
          userFbOrders.forEach(o => map.set(o.id, o));
          const combined = Array.from(map.values());
          combined.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setOrders(combined);
          if (combined.length > 0 && !selectedOrder) {
            setSelectedOrder(combined[0]);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch user orders from Firebase:", err);
      }
    };

    loadUserOrdersFromFirebase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col font-body-md selection:bg-primary selection:text-on-primary">
        <Navbar />

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-16">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl max-w-md w-full p-8 shadow-sm text-center space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-primary text-on-primary mx-auto flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[28px]">lock</span>
            </div>

            <h2 className="text-2xl font-bold font-headline-md text-primary">
              Akses Terbatas - Silakan Masuk
            </h2>

            <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed font-medium">
              Halaman Cek Pesanan Saya hanya dapat diakses setelah Anda masuk ke akun. Silakan login terlebih dahulu untuk memantau status & histori pesanan Anda.
            </p>

            <div className="pt-3 space-y-3">
              <Link
                href="/login"
                className="w-full py-3 px-6 rounded-full bg-primary hover:bg-neutral-800 text-on-primary font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 transition transform active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                <span>Masuk ke Akun Sekarang</span>
              </Link>

              <Link
                href="/merchandise"
                className="block text-xs text-on-surface-variant hover:text-primary font-semibold"
              >
                ← Kembali ke Katalog Utama
              </Link>
            </div>
          </div>
        </main>

      </div>
    );
  }

  const filteredOrders = orders.filter((o) => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStepIndex = (status: OrderStatus) => {
    return STATUS_STEPS.indexOf(status);
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-body-md selection:bg-primary selection:text-on-primary">
      
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/merchandise"
              className="w-10 h-10 rounded-full bg-surface-container-lowest hover:bg-surface border border-outline-variant/30 text-on-surface-variant flex items-center justify-center transition"
              title="Kembali ke Katalog"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[20px]">inventory_2</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-headline-md text-primary">
                  Pelacakan Pesanan Saya
                </h1>
                <p className="text-xs text-on-surface-variant font-medium">
                  Terhubung sebagai: <b className="text-primary">{user?.displayName || user?.email}</b>
                </p>
              </div>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">search</span>
            <input
              type="text"
              placeholder="Cari ID transaksi / nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-outline-variant/50 rounded-full py-2 pl-10 pr-4 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary shadow-sm"
            />
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-sm">
            <span className="material-symbols-outlined text-[48px] text-outline opacity-50 block">inventory_2</span>
            <h3 className="font-bold text-primary font-headline-md text-base">Belum Ada Transaksi</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              Anda belum membuat pesanan. Silakan pilih suvenir merchandise favorit Anda dari katalog.
            </p>
            <Link
              href="/merchandise"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-full shadow-sm hover:bg-neutral-800 transition"
            >
              <span>Jelajahi Katalog Merchandise</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-4 space-y-3">
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">
                Daftar Transaksi ({filteredOrders.length})
              </h4>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredOrders.map((ord) => {
                  const isSelected = selectedOrder?.id === ord.id;

                  return (
                    <div
                      key={ord.id}
                      onClick={() => setSelectedOrder(ord)}
                      className={`p-4 rounded-3xl border transition cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? "bg-primary text-on-primary border-primary shadow-md"
                          : "bg-surface-container-lowest border-outline-variant/50 text-on-surface hover:border-outline shadow-sm"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className={`font-mono text-xs font-bold ${isSelected ? "text-on-primary" : "text-primary"}`}>
                          {ord.id}
                        </span>
                        <span className={`text-[10px] font-mono ${isSelected ? "text-white/60" : "text-on-surface-variant"}`}>
                          {new Date(ord.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      <p className={`text-xs font-medium line-clamp-1 mb-3 ${isSelected ? "text-white/90" : "text-on-surface-variant"}`}>
                        {ord.items.map((i) => i.name).join(", ")}
                      </p>

                      <div className="flex justify-between items-center pt-2 border-t border-outline-variant/20">
                        <span className="text-sm font-extrabold font-headline-md">
                          Rp {ord.totalPrice.toLocaleString("id-ID")}
                        </span>

                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                          ord.status === "Selesai" 
                            ? "bg-emerald-500 text-white"
                            : ord.status === "Sedang Diproduksi"
                            ? "bg-purple-500 text-white"
                            : "bg-amber-400 text-slate-900"
                        }`}>
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-8">
              {selectedOrder ? (
                <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-6 sm:p-8 space-y-6 shadow-sm">
                  
                  <div className="flex flex-wrap justify-between items-start gap-4 border-b border-outline-variant/30 pb-5">
                    <div>
                      <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider">KODE TRANSAKSI</span>
                      <h3 className="text-xl font-extrabold font-mono text-primary mt-0.5">
                        {selectedOrder.id}
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-1 font-medium">
                        Pemesan: <span className="font-bold text-primary">{selectedOrder.customerName}</span> ({selectedOrder.phone})
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/6281234567890?text=Halo%20Admin,%20saya%20ingin%20menanyakan%20status%20pesanan%20dengan%20Kode:%20${selectedOrder.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-primary hover:bg-neutral-800 text-on-primary text-xs font-bold rounded-full flex items-center gap-2 transition shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      <span>Tanya Admin WA</span>
                    </a>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      STATUS PELACAKAN PESANAN:
                    </h4>

                    <div className="relative flex items-center justify-between px-4 py-2">
                      <div className="absolute top-1/2 left-8 right-8 h-1 bg-surface-container-high -translate-y-1/2 -z-0" />

                      {STATUS_STEPS.map((step, idx) => {
                        const currentIdx = getStepIndex(selectedOrder.status);
                        const isDone = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;

                        return (
                          <div key={step} className="relative z-10 flex flex-col items-center text-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition border-2 ${
                                isDone
                                  ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                                  : isCurrent
                                  ? "bg-primary border-primary text-on-primary shadow-md scale-110"
                                  : "bg-surface-container-lowest border-outline-variant/50 text-outline"
                              }`}
                            >
                              {isDone ? <span className="material-symbols-outlined text-[16px]">check</span> : idx + 1}
                            </div>
                            <span className={`text-[10px] font-semibold mt-2.5 max-w-[70px] leading-tight ${
                              isCurrent ? "text-primary font-bold" : isDone ? "text-primary" : "text-on-surface-variant"
                            }`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-outline-variant/30">
                    <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      BARANG YANG DIPESAN:
                    </h4>

                    <div className="space-y-2.5">
                      {selectedOrder.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between bg-surface-container-low p-3 rounded-2xl border border-outline-variant/30">
                          <div className="flex items-center gap-3">
                            <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-white border border-outline-variant/30" />
                            <div>
                              <p className="font-bold text-primary text-xs font-headline-md">{item.name}</p>
                              <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">
                                Jumlah: {item.quantity} Pcs
                              </p>
                            </div>
                          </div>

                          <span className="font-bold text-primary font-headline-md text-sm">
                            Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 space-y-1">
                    <span className="text-on-surface-variant block font-bold text-[10px] uppercase tracking-wider">
                      ALAMAT PENGIRIMAN / DETAIL KELAS INTERNAL:
                    </span>
                    <p className="text-primary text-xs font-semibold">{selectedOrder.addressOrClass}</p>
                    {selectedOrder.notes && (
                      <p className="text-xs text-on-surface-variant italic mt-1">
                        Catatan: &quot;{selectedOrder.notes}&quot;
                      </p>
                    )}
                  </div>

                </div>
              ) : (
                <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-12 text-center text-on-surface-variant space-y-2">
                  <span className="material-symbols-outlined text-[40px] text-outline opacity-50 block mx-auto">inventory_2</span>
                  <p className="text-xs">Pilih transaksi dari daftar di sebelah kiri untuk melihat rincian.</p>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

    </div>
  );
}
