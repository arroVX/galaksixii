"use client";

import React, { useState, useEffect } from "react";
import { Product, Order } from "@/types/merch";

interface AdminOverviewProps {
  products: Product[];
  onSwitchTab: (tab: "overview" | "products" | "orders") => void;
}

const loadInitialOrders = (): Order[] => {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem("gala_merch_orders");
  if (saved) {
    try { return JSON.parse(saved); } catch { return []; }
  }
  return [];
};

export const AdminOverview: React.FC<AdminOverviewProps> = ({ products, onSwitchTab }) => {
  const [orders, setOrders] = useState<Order[]>(loadInitialOrders);

  useEffect(() => {
    const loadFirebase = async () => {
      try {
        const { fetchOrdersFromFirebase } = await import("@/lib/firebaseService");
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

  const totalRevenue = orders.reduce((acc, o) => acc + o.totalPrice, 0);
  const totalItemsSold = orders.reduce((acc, o) => acc + o.items.reduce((s, i) => s + i.quantity, 0), 0);

  const stats = [
    { label: "Total Produk", value: products.length, suffix: "item" },
    { label: "Total Pesanan", value: orders.length, suffix: "order" },
    { label: "Pendapatan", value: `Rp ${totalRevenue.toLocaleString("id-ID")}`, suffix: "" },
    { label: "Item Terjual", value: totalItemsSold, suffix: "pcs" }
  ];

  return (
    <div className="space-y-6">

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-neutral-100 rounded-2xl p-4">
            <span className="text-[11px] text-neutral-400 font-medium block mb-1">{stat.label}</span>
            <span className="text-lg font-bold text-neutral-900">{stat.value}</span>
            {stat.suffix && <span className="text-[11px] text-neutral-400 ml-1">{stat.suffix}</span>}
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Products */}
        <div className="bg-white border border-neutral-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-900">Produk Terlaris</h3>
            <button onClick={() => onSwitchTab("products")} className="text-[11px] text-neutral-400 hover:text-neutral-900 font-medium">
              Lihat Semua
            </button>
          </div>
          <div className="space-y-3">
            {products.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-4">Belum ada produk.</p>
            ) : (
              products.slice(0, 5).map((p) => {
                const pct = Math.min(100, Math.round(((p.soldCount || 0) / 100) * 100));
                return (
                  <div key={p.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-neutral-900 truncate max-w-[180px]">{p.name}</span>
                      <span className="text-neutral-400">{p.soldCount || 0} terjual</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-neutral-900 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white border border-neutral-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-900">Pesanan Terbaru</h3>
            <button onClick={() => onSwitchTab("orders")} className="text-[11px] text-neutral-400 hover:text-neutral-900 font-medium">
              Lihat Semua
            </button>
          </div>
          <div className="space-y-2">
            {orders.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-4">Belum ada pesanan.</p>
            ) : (
              orders.slice(0, 5).map((ord) => (
                <div key={ord.id} className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-neutral-900 truncate">{ord.customerName}</p>
                    <p className="text-[11px] text-neutral-400">{ord.items.map((i) => i.name).join(", ")}</p>
                  </div>
                  <span className="text-xs font-bold text-neutral-900 ml-3 shrink-0">
                    Rp {ord.totalPrice.toLocaleString("id-ID")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
