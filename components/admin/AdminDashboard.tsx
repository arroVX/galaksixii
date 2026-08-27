"use client";

import React, { useState } from "react";
import { Product, GalleryItem } from "@/types/merch";
import { AdminOverview } from "./AdminOverview";
import { AdminProducts } from "./AdminProducts";
import { AdminOrders } from "./AdminOrders";
import { AdminGallery } from "./AdminGallery";

interface AdminDashboardProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  gallery: GalleryItem[];
  setGallery: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
  onExit: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  setProducts,
  gallery,
  setGallery,
  onExit
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "gallery">("overview");

  const tabs = [
    { key: "overview" as const, label: "Ringkasan" },
    { key: "products" as const, label: "Produk" },
    { key: "orders" as const, label: "Pesanan" },
    { key: "gallery" as const, label: "Galeri" }
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
            className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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
              className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
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
        {activeTab === "orders" && (
          <AdminOrders />
        )}
        {activeTab === "gallery" && (
          <AdminGallery gallery={gallery} setGallery={setGallery} />
        )}

      </div>
    </div>
  );
};
