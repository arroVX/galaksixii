"use client";

import React, { useState, useEffect } from "react";
import { Product, AlumniTicketBundle } from "@/types/merch";
import { ALUMNI_TICKET_BUNDLES } from "@/data/alumniTicketBundles";
import { AdminOverview } from "./AdminOverview";
import { AdminProducts } from "./AdminProducts";
import { AdminBundling } from "./AdminBundling";
import { AdminOrders } from "./AdminOrders";
import { AdminSettings } from "./AdminSettings";
import { fetchAlumniTicketBundlesFromFirebase } from "@/lib/firebaseService";
import { useAuth } from "@/context/AuthContext";

interface AdminDashboardProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  onExit: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  setProducts,
  onExit
}) => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "bundling" | "orders" | "settings">("overview");
  const [bundles, setBundles] = useState<AlumniTicketBundle[]>([]);

  // Load bundles: localStorage -> Firebase -> fallback seed ALUMNI_TICKET_BUNDLES
  useEffect(() => {
    let cancelled = false;
    const saved = localStorage.getItem("gala_merch_bundles");
    let hasLocal = false;
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AlumniTicketBundle[];
        if (parsed.length > 0) {
          hasLocal = true;
          queueMicrotask(() => {
            if (!cancelled) setBundles(parsed);
          });
        }
      } catch { /* ignore */ }
    }
    if (!hasLocal) {
      queueMicrotask(() => {
        if (!cancelled) setBundles(ALUMNI_TICKET_BUNDLES);
      });
    }

    (async () => {
      const fbBundles = await fetchAlumniTicketBundlesFromFirebase();
      if (cancelled) return;
      if (fbBundles.length > 0) {
        setBundles(fbBundles);
        localStorage.setItem("gala_merch_bundles", JSON.stringify(fbBundles));
      } else if (!hasLocal) {
        localStorage.setItem("gala_merch_bundles", JSON.stringify(ALUMNI_TICKET_BUNDLES));
      }
    })().catch((err) => console.warn("Gagal fetch bundle:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 p-8 text-center">
        <span className="material-symbols-outlined text-[48px] text-red-300">block</span>
        <h2 className="text-lg font-bold text-neutral-900">Akses Ditolak</h2>
        <p className="text-sm text-neutral-500">Halaman admin hanya untuk akun administrator.</p>
        <button onClick={onExit} className="mt-2 px-5 py-2.5 bg-neutral-900 text-white text-xs font-semibold rounded-xl">Kembali ke Toko</button>
      </div>
    );
  }

  const tabs = [
    { key: "overview" as const, label: "Ringkasan" },
    { key: "products" as const, label: "Produk" },
    { key: "bundling" as const, label: "Bundling" },
    { key: "orders" as const, label: "Pesanan" },
    { key: "settings" as const, label: "Pengaturan" }
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Dashboard Admin</h1>
            <p className="text-xs text-neutral-400 mt-0.5">GALAKSI XII — SMKN 3 Jepara</p>
          </div>
          <button
            onClick={onExit}
            className="px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            Keluar Admin
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex flex-nowrap items-center gap-1 bg-white border border-neutral-100 rounded-xl p-1 mb-6 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <AdminOverview products={products} onSwitchTab={setActiveTab} />
        )}
        {activeTab === "products" && (
          <AdminProducts products={products} setProducts={setProducts} />
        )}
        {activeTab === "bundling" && (
          <AdminBundling bundles={bundles} setBundles={setBundles} />
        )}
        {activeTab === "orders" && (
          <AdminOrders />
        )}
        {activeTab === "settings" && (
          <AdminSettings />
        )}

      </div>
    </div>
  );
};
