"use client";

import React, { useState, useEffect } from "react";
import { Order, OrderStatus } from "@/types/merch";
import { syncOrderToFirebase, fetchOrdersFromFirebase } from "@/lib/firebaseService";
import { Eye, Filter, TrendingUp, X, ImageIcon } from "lucide-react";

const loadInitialOrders = (): Order[] => {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem("gala_merch_orders");
  if (saved) {
    try { return JSON.parse(saved); } catch { return []; }
  }
  return [];
};

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(loadInitialOrders);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadFirebase = async () => {
      try {
        const fbOrders = await fetchOrdersFromFirebase();
        if (fbOrders.length > 0) {
          setOrders((prev) => {
            const map = new Map<string, Order>();
            prev.forEach((o) => map.set(o.id, o));
            fbOrders.forEach((o) => map.set(o.id, o));
            const combined = Array.from(map.values()).sort(
              (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            );
            localStorage.setItem("gala_merch_orders", JSON.stringify(combined));
            return combined;
          });
        }
      } catch { /* ignore */ }
    };
    loadFirebase();
  }, []);

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o
    );
    setOrders(updated);
    localStorage.setItem("gala_merch_orders", JSON.stringify(updated));
    const target = updated.find((o) => o.id === orderId);
    if (target) syncOrderToFirebase(target).catch((err) => console.warn(err));
  };

  const filteredOrders = statusFilter === "ALL" ? orders : orders.filter((o) => o.status === statusFilter);

  const statusOptions = ["ALL", "Menunggu Pembayaran", "Diverifikasi", "Sedang Diproduksi", "Siap Diambil/Dikirim", "Selesai"];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <TrendingUp size={16} /> Pesanan ({orders.length})
        </h3>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Filter size={12} className="text-neutral-400 shrink-0" />
          {statusOptions.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition ${
                statusFilter === st
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-500 border border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              {st === "ALL" ? "Semua" : st}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden md:hidden">
        <div className="divide-y divide-neutral-50">
          {filteredOrders.length === 0 ? (
            <p className="p-8 text-center text-neutral-400 text-xs">Tidak ada pesanan.</p>
          ) : (
            filteredOrders.map((ord) => (
              <div key={ord.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-neutral-900 text-sm">{ord.id}</p>
                    <p className="text-[10px] text-neutral-400">
                      {new Date(ord.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-neutral-900">Rp {ord.totalPrice.toLocaleString("id-ID")}</span>
                </div>
                <div>
                  <p className="font-bold text-neutral-900 text-xs">{ord.customerName}</p>
                  <p className="text-[11px] text-neutral-400">{ord.phone}</p>
                </div>
                <div>
                  {ord.items.map((item, idx) => (
                    <p key={idx} className="text-[11px] text-neutral-600">• {item.name} ({item.selectedSize}) x{item.quantity}</p>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <select value={ord.status} onChange={(e) => handleUpdateStatus(ord.id, e.target.value as OrderStatus)} className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-2.5 text-sm font-semibold text-neutral-900 focus:outline-none flex-1">
                    <option value="Menunggu Pembayaran">Menunggu</option>
                    <option value="Diverifikasi">Diverifikasi</option>
                    <option value="Sedang Diproduksi">Diproduksi</option>
                    <option value="Siap Diambil/Dikirim">Siap Kirim</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                  {ord.paymentProofUrl ? (
                    <button onClick={() => setViewProofUrl(ord.paymentProofUrl || null)} className="px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-neutral-200 transition">
                      <Eye size={12} /> Lihat Bukti
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-700">
            <thead className="bg-neutral-50 text-[10px] text-neutral-400 border-b border-neutral-100">
              <tr>
                <th className="p-3">ID & Tanggal</th>
                <th className="p-3">Pemesan</th>
                <th className="p-3">Alamat/Kelas</th>
                <th className="p-3">Item</th>
                <th className="p-3">Total</th>
                <th className="p-3">Bukti</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-400">Tidak ada pesanan.</td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-neutral-50/50 transition">
                    <td className="p-3">
                      <p className="font-bold text-neutral-900">{ord.id}</p>
                      <p className="text-[10px] text-neutral-400">
                        {new Date(ord.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </p>
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-neutral-900">{ord.customerName}</p>
                      <p className="text-[11px] text-neutral-400">{ord.phone}</p>
                    </td>
                    <td className="p-3 max-w-[160px]">
                      <p className="truncate text-neutral-600" title={ord.addressOrClass}>{ord.addressOrClass}</p>
                    </td>
                    <td className="p-3">
                      {ord.items.map((item, idx) => (
                        <p key={idx} className="text-[11px] text-neutral-600">• {item.name} ({item.selectedSize}) x{item.quantity}</p>
                      ))}
                    </td>
                    <td className="p-3 font-bold text-neutral-900">Rp {ord.totalPrice.toLocaleString("id-ID")}</td>
                    <td className="p-3">
                      {ord.paymentProofUrl ? (
                        <button onClick={() => setViewProofUrl(ord.paymentProofUrl || null)} className="px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-neutral-200 transition">
                          <Eye size={11} /> Lihat
                        </button>
                      ) : (
                        <span className="text-[10px] text-neutral-400">WA Direct</span>
                      )}
                    </td>
                    <td className="p-3">
                      <select value={ord.status} onChange={(e) => handleUpdateStatus(ord.id, e.target.value as OrderStatus)} className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-2.5 text-sm font-semibold text-neutral-900 focus:outline-none">
                        <option value="Menunggu Pembayaran">Menunggu</option>
                        <option value="Diverifikasi">Diverifikasi</option>
                        <option value="Sedang Diproduksi">Diproduksi</option>
                        <option value="Siap Diambil/Dikirim">Siap Kirim</option>
                        <option value="Selesai">Selesai</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof Modal */}
      {viewProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
          <div className="bg-white border border-neutral-100 rounded-2xl max-w-lg w-full p-6 relative">
            <button onClick={() => setViewProofUrl(null)} className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-900 bg-neutral-100">
              <X size={16} />
            </button>
            <h4 className="font-bold text-neutral-900 text-sm mb-4 flex items-center gap-2">
              <ImageIcon size={16} /> Bukti Transfer
            </h4>
            <div className="aspect-square rounded-xl overflow-hidden bg-neutral-100 flex items-center justify-center">
              {(viewProofUrl.startsWith("data:") || viewProofUrl.startsWith("http")) ? (
                <img src={viewProofUrl} alt="Bukti Transfer" className="w-full h-full object-contain" />
              ) : (
                <p className="text-xs text-neutral-400 text-center p-6">Bukti tidak dapat ditampilkan.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
