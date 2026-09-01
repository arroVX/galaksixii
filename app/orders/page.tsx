"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Order, OrderStatus } from "@/types/merch";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteContext";

const STATUS_FILTERS: { label: string; value: OrderStatus | "all" }[] = [
  { label: "Semua", value: "all" },
  { label: "Diproses", value: "Menunggu Pembayaran" },
  { label: "Diverifikasi", value: "Diverifikasi" },
  { label: "Diproduksi", value: "Sedang Diproduksi" },
  { label: "Siap Diambil", value: "Siap Diambil/Dikirim" },
  { label: "Selesai", value: "Selesai" },
  { label: "Dibatalkan", value: "Dibatalkan" }
];

const STATUS_COLORS: Record<string, string> = {
  "Menunggu Pembayaran": "text-amber-600",
  "Diverifikasi": "text-blue-600",
  "Sedang Diproduksi": "text-purple-600",
  "Siap Diambil/Dikirim": "text-blue-600",
  "Selesai": "text-emerald-600",
  "Dibatalkan": "text-red-500"
};

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  useEffect(() => {
    let initialLocalOrders: Order[] = [];
    const savedOrdersStr = localStorage.getItem("gala_merch_orders");
    if (savedOrdersStr) {
      try {
        const parsed: Order[] = JSON.parse(savedOrdersStr);
        initialLocalOrders = parsed.filter(o => o.userId === user?.uid || o.userEmail === user?.email);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOrders(initialLocalOrders);
      } catch (e) {
        console.error(e);
      }
    }

    const loadUserOrdersFromFirebase = async () => {
      if (!user) return;
      try {
        const { fetchOrdersForUser } = await import("@/lib/firebaseService");
        const userFbOrders = await fetchOrdersForUser(user.uid, user.email);

        if (userFbOrders.length > 0) {
          const map = new Map<string, Order>();
          initialLocalOrders.forEach(o => map.set(o.id, o));
          userFbOrders.forEach(o => map.set(o.id, o));
          const combined = Array.from(map.values());
          combined.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setOrders(combined);
        }
      } catch (err) {
        console.warn("Failed to fetch user orders from Firebase:", err);
      }
    };

    loadUserOrdersFromFirebase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const { siteSettings, loading: settingsLoading } = useSiteSettings();

  useEffect(() => {
    if (!settingsLoading && siteSettings.orders.locked && !loading && !user) {
      router.push("/login?redirect=/orders");
    }
  }, [settingsLoading, siteSettings.orders.locked, loading, user, router]);

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center font-body-md">
        <Navbar />
        <div className="flex items-center gap-3 text-neutral-400">
          <span className="material-symbols-outlined animate-spin text-[32px]">sync</span>
          <span className="text-sm font-medium tracking-wide">Memuat pesanan...</span>
        </div>
      </div>
    );
  }

  if (!siteSettings.orders.visible) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-500 flex-col gap-4">
        <span className="material-symbols-outlined text-[48px]">receipt_long</span>
        <h2 className="text-xl font-bold">Halaman Tidak Tersedia</h2>
        <p className="text-sm">Fitur cek pesanan sedang ditutup atau belum tersedia.</p>
        <button onClick={() => router.push("/")} className="mt-4 px-4 py-2 bg-neutral-900 text-white rounded-lg">Kembali ke Beranda</button>
      </div>
    );
  }

  if (siteSettings.orders.locked && !user) return null;

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = (status: OrderStatus | "all") => {
    if (status === "all") return orders.length;
    return orders.filter(o => o.status === status).length;
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Link
              href="/merchandise"
              className="w-10 h-10 rounded-xl bg-white border border-neutral-100 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold font-headline-md text-neutral-900">
                Pesanan Saya
              </h1>
              <p className="text-[13px] text-neutral-400">
                {user?.displayName || user?.email}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Cari ID pesanan atau nama barang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-neutral-100 rounded-xl py-2.5 pl-10 pr-4 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-300 transition"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {STATUS_FILTERS.map((filter) => {
            const isActive = statusFilter === filter.value;
            const count = getStatusCounts(filter.value);
            return (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-neutral-900 text-white"
                    : "bg-white text-neutral-500 border border-neutral-100 hover:border-neutral-200 hover:text-neutral-700"
                }`}
              >
                {filter.label}
                {count > 0 && (
                  <span className={`text-[11px] ${isActive ? "text-white/60" : "text-neutral-400"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-4 bg-white rounded-2xl border border-neutral-100">
            <span className="material-symbols-outlined text-[48px] text-neutral-300 block">inventory_2</span>
            <h3 className="font-semibold text-neutral-900 text-[15px]">
              {orders.length === 0 ? "Belum Ada Pesanan" : "Tidak Ada Hasil"}
            </h3>
            <p className="text-[13px] text-neutral-400 max-w-sm mx-auto">
              {orders.length === 0
                ? "Anda belum membuat pesanan. Silakan jelajahi katalog merchandise kami."
                : "Pesanan tidak ditemukan untuk filter atau pencarian ini."}
            </p>
            {orders.length === 0 && (
              <Link
                href="/merchandise"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white font-medium text-[13px] rounded-xl hover:bg-neutral-800 transition active:scale-[0.98]"
              >
                <span>Jelajahi Katalog</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-neutral-100 overflow-hidden"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-neutral-400">receipt</span>
                      <span className="font-mono text-[13px] font-medium text-neutral-900">{ord.id}</span>
                    </div>
                    <p className="text-[12px] text-neutral-400">
                      {new Date(ord.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`text-[12px] font-medium ${STATUS_COLORS[ord.status] || "text-neutral-500"}`}>
                    {ord.status}
                  </span>
                </div>

                {/* Items */}
                <div className="px-5 py-4 space-y-3">
                  {ord.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover bg-neutral-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-neutral-900 truncate">{item.name}</p>
                        <p className="text-[12px] text-neutral-400">
                          {item.quantity} × Rp {item.price.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <span className="text-[13px] font-medium text-neutral-900">
                        Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-white border-t border-neutral-100">
                  <div className="text-[13px] text-neutral-500">
                    Total: <span className="font-semibold text-neutral-900">Rp {ord.totalPrice.toLocaleString("id-ID")}</span>
                    <span className="text-neutral-400 ml-1">· {ord.items.length} item</span>
                  </div>
                  <button
                    onClick={() => router.push(`/orders/${ord.id}`)}
                    className="px-4 py-2 bg-neutral-900 text-white text-[13px] font-medium rounded-xl hover:bg-neutral-800 transition active:scale-[0.98]"
                  >
                    Detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
