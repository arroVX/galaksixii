"use client";

import React, { useState } from "react";
import { AlumniTicketBundle } from "@/types/merch";
import { Plus, Edit3, Trash2, PackageOpen, AlertTriangle, X } from "lucide-react";
import { AdminBundleModal } from "./AdminBundleModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { AlertModal } from "@/components/ui/AlertModal";
import { syncAllAlumniTicketBundlesToFirebase } from "@/lib/firebaseService";

interface AdminBundlingProps {
  bundles: AlumniTicketBundle[];
  setBundles: React.Dispatch<React.SetStateAction<AlumniTicketBundle[]>>;
}

export const AdminBundling: React.FC<AdminBundlingProps> = ({ bundles, setBundles }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<AlumniTicketBundle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (newList: AlumniTicketBundle[]) => {
    const indexedList = newList.map((item, index) => ({
      ...item,
      orderIndex: index,
      updatedAt: Date.now()
    }));
    
    setSyncError(null);
    setBundles(indexedList);
    localStorage.setItem("gala_merch_bundles", JSON.stringify(indexedList));
    setSaving(true);
    syncAllAlumniTicketBundlesToFirebase(indexedList)
      .then((r) => {
        if (r.rtdbOk || r.firestoreOk) {
          setSaveSuccess(true);
        } else {
          setSyncError("Gagal menyimpan ke database. Pastikan Anda login sebagai admin.");
        }
      })
      .catch((err) => {
        console.error("Sync error:", err);
        setSyncError("Gagal menyimpan ke Firebase. Pastikan koneksi stabil dan Anda login sebagai admin.");
      })
      .finally(() => setSaving(false));
  };

  const openCreateModal = () => {
    setEditingBundle(null);
    setIsModalOpen(true);
  };

  const openEditModal = (b: AlumniTicketBundle) => {
    setEditingBundle(b);
    setIsModalOpen(true);
  };

  const handleMoveTo = (currentIndex: number, newIndex: number) => {
    if (currentIndex === newIndex) return;
    const newList = [...bundles];
    const [movedItem] = newList.splice(currentIndex, 1);
    newList.splice(newIndex, 0, movedItem);
    newList.forEach((b, i) => (b.orderIndex = i));
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

      {saving && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-[11px] text-amber-700 flex items-center gap-2">
          <span className="material-symbols-outlined animate-spin text-[14px]">sync</span>
          Menyimpan ke Firebase...
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <PackageOpen size={16} /> Bundling Tiket & Merch ({bundles.length})
        </h3>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
        >
          <Plus size={14} /> Tambah
        </button>
      </div>

      {bundles.length === 0 ? (
        <div className="bg-white border border-neutral-100 rounded-2xl p-8 text-center">
          <PackageOpen size={32} className="mx-auto text-neutral-300 mb-3" />
          <p className="text-xs text-neutral-400">Belum ada bundling. Klik &quot;Tambah&quot; untuk membuat bundling baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {bundles.map((b, index) => (
            <div key={b.id} className="bg-white border border-neutral-100 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-sm relative group">
              {/* Urutan Badge */}
              <div className="absolute -top-2 -left-2 bg-neutral-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm">
                #{index + 1}
              </div>

              <div className="flex gap-3">
                <img src={b.imageUrl || "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=800&auto=format&fit=crop"} alt={b.name} className="w-16 h-16 rounded-xl object-cover bg-neutral-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-neutral-900 text-xs truncate">{b.name}</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-2">{b.description || "Tanpa deskripsi"}</p>
                </div>
              </div>

              {/* Items list */}
              <div className="flex flex-wrap gap-1">
                {b.items.map((item, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 bg-neutral-100 text-[9px] font-bold text-neutral-500 rounded-full">
                    {item.name} x{item.quantity}
                  </span>
                ))}
              </div>

              {/* Price */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-50">
                <div>
                  <span className="text-[10px] text-neutral-400">Tiket: Rp {b.ticketPrice.toLocaleString("id-ID")}</span>
                  <span className="text-xs font-bold text-neutral-900 ml-1.5">Rp {b.totalPrice.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col gap-0.5 mr-1 relative">
                    <select
                      value={index}
                      onChange={(e) => handleMoveTo(index, Number(e.target.value))}
                      className="appearance-none bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-bold px-2 py-1.5 rounded outline-none border-none cursor-pointer pr-4 h-[34px]"
                      title="Ubah Urutan"
                    >
                      {bundles.map((_, i) => (
                        <option key={i} value={i}>#{i + 1}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined text-[12px] absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">expand_more</span>
                  </div>
                  <button onClick={() => openEditModal(b)} className="p-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition" title="Edit">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => setDeleteTarget(b.id)} className="p-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition" title="Hapus">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <AdminBundleModal
          bundle={editingBundle}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          bundles={bundles}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            const newList = bundles.filter((b) => b.id !== deleteTarget);
            handleSave(newList);
          }
        }}
        title="Hapus Bundling"
        message="Apakah Anda yakin ingin menghapus bundling ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />

      <AlertModal
        isOpen={saveSuccess}
        onClose={() => setSaveSuccess(false)}
        title="Berhasil Disimpan"
        message="Bundling tiket dan merchandise berhasil disimpan ke database Firebase."
        icon="check_circle"
        iconColor="emerald"
        buttonText="Tutup"
      />
    </div>
  );
};
