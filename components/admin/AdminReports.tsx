"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Order, OrderItem } from "@/types/merch";
import { fetchOrdersFromFirebase } from "@/lib/firebaseService";
import { BarChart3, Package, MapPin, Users } from "lucide-react";

const loadInitialOrders = (): Order[] => {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem("gala_merch_orders");
  if (saved) {
    try { return JSON.parse(saved); } catch { return []; }
  }
  return [];
};

export interface SoldItemSummary {
  key: string;
  productId: string;
  name: string;
  imageUrl: string;
  variant: string;
  quantity: number;
  revenue: number;
}

export interface PickupGroup {
  key: string;
  title: string;
  orders: Order[];
  totalPackages: number;
}

/** Agregasi item terjual dari order aktif (murni, mudah dites). */
export function aggregateSoldItems(orders: Order[]): SoldItemSummary[] {
  const map = new Map<string, SoldItemSummary>();
  for (const order of orders) {
    const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
    for (const item of items) {
      const variant = [item.selectedSize, item.selectedColor]
        .filter((v) => v && v !== "-")
        .join(" · ");
      const key = `${item.productId}||${item.selectedSize || ""}||${item.selectedColor || ""}`;
      const existing = map.get(key);
      const qty = Math.max(0, Number(item.quantity) || 0);
      const revenue = (Number(item.price) || 0) * qty;
      if (existing) {
        existing.quantity += qty;
        existing.revenue += revenue;
      } else {
        map.set(key, {
          key,
          productId: item.productId,
          name: item.name,
          imageUrl: item.imageUrl || "",
          variant,
          quantity: qty,
          revenue,
        });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
}

function pickupTitle(order: Order): { key: string; title: string } {
  if (order.deliveryMethod === "COD_AREA_JEPARA") {
    const detail = order.deliveryLocationDetail?.trim() || "Area Jepara";
    return { key: `COD||${detail}`, title: `COD — ${detail}` };
  }
  if (order.deliveryMethod === "PICKUP_AULA_SMKN3") {
    return { key: "PICKUP||AULA", title: "Ambil di Aula SMKN 3 Jepara" };
  }
  return { key: "OTHER", title: "Lokasi tidak tercatat" };
}

/** Kelompokkan order aktif per lokasi pengambilan (murni, mudah dites). */
export function groupOrdersByPickup(orders: Order[]): PickupGroup[] {
  const map = new Map<string, PickupGroup>();
  for (const order of orders) {
    const { key, title } = pickupTitle(order);
    const existing = map.get(key);
    if (existing) {
      existing.orders.push(order);
      existing.totalPackages += 1;
    } else {
      map.set(key, { key, title, orders: [order], totalPackages: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalPackages - a.totalPackages);
}

export const AdminReports: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(loadInitialOrders);

  useEffect(() => {
    const loadFirebase = async () => {
      try {
        const fbOrders = await fetchOrdersFromFirebase();
        const sorted = fbOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setOrders(sorted);
        localStorage.setItem("gala_merch_orders", JSON.stringify(sorted));
      } catch { /* ignore */ }
    };
    loadFirebase();
  }, []);

  // Pesanan batal dikecualikan dari semua hitungan.
  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== "Dibatalkan"),
    [orders]
  );
  const soldItems = useMemo(() => aggregateSoldItems(activeOrders), [activeOrders]);
  const pickupGroups = useMemo(() => groupOrdersByPickup(activeOrders), [activeOrders]);

  const totalRevenue = activeOrders.reduce((acc, o) => acc + (Number(o.totalPrice) || 0), 0);
  const totalPcs = soldItems.reduce((acc, i) => acc + i.quantity, 0);
  const uniqueBuyers = new Set(
    activeOrders.map((o) => (o.phone || "").trim() || o.userId || o.id)
  ).size;

  const stats = [
    { label: "Order Aktif", value: String(activeOrders.length), suffix: "order", icon: BarChart3 },
    { label: "Item Terjual", value: String(totalPcs), suffix: "pcs", icon: Package },
    { label: "Pembeli", value: String(uniqueBuyers), suffix: "orang", icon: Users },
    { label: "Omset", value: `Rp ${totalRevenue.toLocaleString("id-ID")}`, suffix: "", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-neutral-100 rounded-2xl p-4">
            <span className="text-[11px] text-neutral-400 font-medium block mb-1">{stat.label}</span>
            <span className="text-lg font-bold text-neutral-900">{stat.value}</span>
            {stat.suffix && <span className="text-[11px] text-neutral-400 ml-1">{stat.suffix}</span>}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-neutral-400 -mt-3">* Pesanan berstatus Dibatalkan tidak ikut dihitung.</p>

      {/* Barang terjual */}
      <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Package size={16} /> Barang Terjual ({soldItems.length} varian)
          </h3>
        </div>
        {soldItems.length === 0 ? (
          <p className="p-8 text-center text-neutral-400 text-xs">Belum ada barang terjual.</p>
        ) : (
          <>
            {/* Mobile */}
            <div className="divide-y divide-neutral-50 md:hidden">
              {soldItems.map((item) => (
                <div key={item.key} className="p-4 flex items-center gap-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-neutral-100 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px] text-neutral-300">inventory_2</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-neutral-900 text-sm truncate">{item.name}</p>
                    {item.variant && <p className="text-[11px] text-neutral-400 truncate">{item.variant}</p>}
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      <span className="font-bold text-neutral-900">{item.quantity} pcs</span>
                      {" · "}Rp {item.revenue.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead className="bg-neutral-50 text-[10px] text-neutral-400 border-b border-neutral-100">
                  <tr>
                    <th className="p-3">Barang</th>
                    <th className="p-3">Varian</th>
                    <th className="p-3 text-right">Jumlah</th>
                    <th className="p-3 text-right">Omset</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {soldItems.map((item) => (
                    <tr key={item.key} className="hover:bg-neutral-50/50 transition">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-neutral-100 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-[18px] text-neutral-300">inventory_2</span>
                            </div>
                          )}
                          <span className="font-bold text-neutral-900">{item.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-neutral-500">{item.variant || "—"}</td>
                      <td className="p-3 text-right font-bold text-neutral-900">{item.quantity} pcs</td>
                      <td className="p-3 text-right font-bold text-neutral-900">Rp {item.revenue.toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Daftar pengambilan */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <MapPin size={16} /> Daftar Pengambilan ({pickupGroups.reduce((a, g) => a + g.totalPackages, 0)} paket)
        </h3>
        {pickupGroups.length === 0 ? (
          <p className="p-8 text-center text-neutral-400 text-xs bg-white border border-neutral-100 rounded-2xl">Belum ada daftar pengambilan.</p>
        ) : (
          pickupGroups.map((group) => (
            <div key={group.key} className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-neutral-900">{group.title}</p>
                <span className="text-[11px] font-bold text-neutral-500 bg-white border border-neutral-200 px-2.5 py-1 rounded-full shrink-0">
                  {group.totalPackages} paket
                </span>
              </div>
              {/* Mobile */}
              <div className="divide-y divide-neutral-50 md:hidden">
                {group.orders.map((ord) => (
                  <div key={ord.id} className="p-4 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-neutral-900 text-sm">{ord.customerName}</p>
                      <span className="font-mono text-[10px] text-neutral-400 shrink-0">{ord.id}</span>
                    </div>
                    <p className="text-[12px] text-neutral-600">{ord.phone}</p>
                    <p className="text-[12px] text-neutral-500">{ord.addressOrClass}</p>
                    <p className="text-[11px] text-neutral-500">
                      {ord.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}
                    </p>
                    <p className="text-[12px] font-bold text-neutral-900">
                      Rp {ord.totalPrice.toLocaleString("id-ID")}
                      <span className="ml-2 text-[10px] font-semibold text-neutral-400">{ord.status}</span>
                    </p>
                  </div>
                ))}
              </div>
              {/* Desktop */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-left text-xs text-neutral-700">
                  <thead className="bg-neutral-50 text-[10px] text-neutral-400 border-b border-neutral-100">
                    <tr>
                      <th className="p-3">Pembeli</th>
                      <th className="p-3">No. HP</th>
                      <th className="p-3">Alamat / Kelas</th>
                      <th className="p-3">Barang</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {group.orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-neutral-50/50 transition">
                        <td className="p-3">
                          <p className="font-bold text-neutral-900">{ord.customerName}</p>
                          <p className="font-mono text-[10px] text-neutral-400">{ord.id}</p>
                        </td>
                        <td className="p-3">{ord.phone}</td>
                        <td className="p-3 max-w-[220px]">
                          <p className="truncate text-neutral-600" title={ord.addressOrClass}>{ord.addressOrClass}</p>
                        </td>
                        <td className="p-3 max-w-[240px]">
                          <p className="text-[11px] text-neutral-600">
                            {ord.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}
                          </p>
                        </td>
                        <td className="p-3 text-right font-bold text-neutral-900">
                          Rp {ord.totalPrice.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
