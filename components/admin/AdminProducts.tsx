"use client";

import React, { useState } from "react";
import { Product } from "@/types/merch";
import { Plus, Edit3, Trash2, Package, AlertTriangle, X } from "lucide-react";
import { AdminProductModal } from "./AdminProductModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { syncAllProductsToFirebase, deleteProductFromFirebase } from "@/lib/firebaseService";

interface AdminProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({ products, setProducts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = (newList: Product[]) => {
    setSyncError(null);
    setProducts(newList);
    localStorage.setItem("gala_merch_products", JSON.stringify(newList));
    setSaving(true);
    syncAllProductsToFirebase(newList)
      .then((r) => {
        if (!r.rtdbOk && !r.firestoreOk) {
          setSyncError("Gagal menyimpan ke Firebase. Data tersimpan di browser ini, tapi mungkin tidak muncul di perangkat lain. Pastikan Anda login sebagai admin.");
        } else if (!r.rtdbOk || !r.firestoreOk) {
          setSyncError("Sinkronisasi sebagian berhasil. Coba refresh halaman.");
        }
      })
      .catch((err) => {
        console.error("Sync error:", err);
        setSyncError("Gagal menyimpan ke Firebase. Pastikan koneksi stabil dan Anda login sebagai admin.");
      })
      .finally(() => setSaving(false));
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setIsModalOpen(true);
  };

  const handleDelete = (productId: string) => {
    setDeleteTarget(productId);
  };

  return (
    <div className="space-y-4">
      {syncError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3 text-xs">
          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-red-700 flex-1">{syncError}</p>
          <button onClick={() => setSyncError(null)} className="text-red-400 hover:text-red-600 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <Package size={16} /> Katalog Merchandise ({products.length})
        </h3>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
        >
          <Plus size={14} /> Tambah
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.map((p) => (
          <div key={p.id} className="bg-white border border-neutral-100 rounded-2xl p-4 flex flex-col justify-between gap-3">
            <div className="flex gap-3">
              <img src={p.imageUrl} alt={p.name} className="w-16 h-16 rounded-xl object-cover bg-neutral-100 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  {p.stockType === "PRE_ORDER" ? (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full">PO</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">Ready</span>
                  )}
                  <span className="text-[10px] text-neutral-400">{p.category}</span>
                </div>
                <h4 className="font-bold text-neutral-900 text-xs truncate">{p.name}</h4>
                <p className="text-xs font-bold text-neutral-900 mt-0.5">Rp {p.price.toLocaleString("id-ID")}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Stok: {p.stockCount} Pcs</p>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-50 flex items-center justify-between">
              <div className="flex gap-1">
                {(p.variants?.sizes || []).map((s) => (
                  <span key={s} className="px-1.5 py-0.5 bg-neutral-100 text-[9px] font-bold text-neutral-500 rounded-full">{s}</span>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => openEditModal(p)} className="p-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition" title="Edit">
                  <Edit3 size={14} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition" title="Hapus">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <AdminProductModal
          product={editingProduct}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          products={products}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            const newList = products.filter((p) => p.id !== deleteTarget);
            handleSave(newList);
          }
        }}
        title="Hapus Merchandise"
        message="Apakah Anda yakin ingin menghapus merchandise ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
};
