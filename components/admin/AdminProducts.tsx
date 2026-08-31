"use client";

import React, { useState } from "react";
import { Product } from "@/types/merch";
import { Plus, Edit3, Trash2, Package, AlertTriangle, X } from "lucide-react";
import { AdminProductModal } from "./AdminProductModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { AlertModal } from "@/components/ui/AlertModal";
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

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (newList: Product[]) => {
    // Pastikan orderIndex selalu diupdate berdasarkan urutan array saat ini
    const indexedList = newList.map((item, index) => ({
      ...item,
      orderIndex: index
    }));
    
    setSyncError(null);
    setProducts(indexedList);
    localStorage.setItem("gala_merch_products", JSON.stringify(indexedList));
    setSaving(true);
    syncAllProductsToFirebase(indexedList)
      .then((r) => {
        if (!r.rtdbOk && !r.firestoreOk) {
          setSyncError("Gagal menyimpan ke Firebase. Data tersimpan di browser ini, tapi mungkin tidak muncul di perangkat lain. Pastikan Anda login sebagai admin.");
        } else if (!r.rtdbOk || !r.firestoreOk) {
          setSyncError("Sinkronisasi sebagian berhasil. Coba refresh halaman.");
        } else {
          setSaveSuccess(true);
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

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newList = [...products];
    const temp = newList[index];
    newList[index] = newList[index - 1];
    newList[index - 1] = temp;
    // update orderIndex
    newList.forEach((p, i) => (p.orderIndex = i));
    handleSave(newList);
  };

  const handleMoveDown = (index: number) => {
    if (index === products.length - 1) return;
    const newList = [...products];
    const temp = newList[index];
    newList[index] = newList[index + 1];
    newList[index + 1] = temp;
    // update orderIndex
    newList.forEach((p, i) => (p.orderIndex = i));
    handleSave(newList);
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
        {products.map((p, index) => (
          <div key={p.id} className="bg-white p-4 rounded-xl border border-neutral-100 flex flex-col justify-between shadow-sm relative group">
            {/* Urutan Badge */}
            <div className="absolute top-2 left-2 bg-neutral-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm">
              #{index + 1}
            </div>
            
            <div>
              <div className="relative aspect-[4/5] bg-neutral-50 rounded-lg overflow-hidden mb-3 border border-neutral-100">
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover mix-blend-multiply" />
              </div>
              <h3 className="font-bold text-sm text-neutral-800 leading-snug line-clamp-2">{p.name}</h3>
              <p className="text-xs text-neutral-500 mb-2 mt-1 line-clamp-1">{p.category}</p>
              <div className="flex items-center justify-between mt-auto mb-3">
                <span className="font-bold text-neutral-900 text-[13px]">Rp {p.price.toLocaleString("id-ID")}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  p.stockType === "READY" ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-purple-600"
                }`}>
                  {p.stockType === "READY" ? "READY" : "PO"}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-neutral-50 flex items-center justify-between">
              <div className="flex gap-1">
                {(p.variants?.sizes || []).map((s) => (
                  <span key={s} className="px-1.5 py-0.5 bg-neutral-100 text-[9px] font-bold text-neutral-500 rounded-full">{s}</span>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex flex-col gap-0.5 mr-1">
                  <button onClick={() => handleMoveUp(index)} disabled={index === 0} className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition disabled:opacity-30 disabled:cursor-not-allowed" title="Naik">
                    <span className="material-symbols-outlined text-[12px] leading-none">expand_less</span>
                  </button>
                  <button onClick={() => handleMoveDown(index)} disabled={index === products.length - 1} className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition disabled:opacity-30 disabled:cursor-not-allowed" title="Turun">
                    <span className="material-symbols-outlined text-[12px] leading-none">expand_more</span>
                  </button>
                </div>
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

      <AlertModal
        isOpen={saveSuccess}
        onClose={() => setSaveSuccess(false)}
        title="Berhasil Disimpan"
        message="Katalog produk berhasil disimpan ke database Firebase."
        icon="check_circle"
        iconColor="emerald"
        buttonText="Tutup"
      />
    </div>
  );
};
