"use client";

import React, { useState, useEffect } from "react";
import { Product, AlumniTicketBundle } from "@/types/merch";
import { AdminOverview } from "./AdminOverview";
import { AdminProducts } from "./AdminProducts";
import { AdminBundling } from "./AdminBundling";
import { AdminOrders } from "./AdminOrders";
import { ALUMNI_TICKET_BUNDLES } from "@/data/alumniTicketBundles";
import { fetchAlumniTicketBundlesFromFirebase, seedAlumniTicketBundlesToFirebase } from "@/lib/firebaseService";

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
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "bundling" | "orders">("overview");
  const [bundles, setBundles] = useState<AlumniTicketBundle[]>(ALUMNI_TICKET_BUNDLES);

  // Load bundles: seed bundle default ke Firebase bila belum lengkap, lalu
  // baca data terbaru dari Firebase sebagai sumber kebenaran (agar admin dan
  // halaman /tiket-alumni selalu sinkron). Fallback = localStorage / seed.
  useEffect(() => {
    let initial: AlumniTicketBundle[] = ALUMNI_TICKET_BUNDLES;
    const saved = localStorage.getItem("gala_merch_bundles");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AlumniTicketBundle[];
        if (parsed.length > 0) initial = parsed;
      } catch { /* ignore */ }
    }
    setBundles(initial);

    (async () => {
      await seedAlumniTicketBundlesToFirebase();
      const fbBundles = await fetchAlumniTicketBundlesFromFirebase();
      if (fbBundles.length > 0) {
        setBundles(fbBundles);
        localStorage.setItem("gala_merch_bundles", JSON.stringify(fbBundles));
      }
    })().catch((err) => console.warn("Gagal seed/fetch bundle:", err));
  }, []);

  const tabs = [
    { key: "overview" as const, label: "Ringkasan" },
    { key: "products" as const, label: "Produk" },
    { key: "bundling" as const, label: "Bundling" },
    { key: "orders" as const, label: "Pesanan" }
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
        <div className="flex items-center gap-1 bg-white border border-neutral-100 rounded-xl p-1 mb-6">
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

      </div>
    </div>
  );
};
