"use client";

import React, { useState } from "react";
import { AlumniTicketBundle } from "@/types/merch";
import { Plus, Edit3, Trash2, PackageOpen } from "lucide-react";
import { AdminBundleModal } from "./AdminBundleModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { deleteAlumniTicketBundleFromFirebase } from "@/lib/firebaseService";

interface AdminBundlingProps {
  bundles: AlumniTicketBundle[];
  setBundles: React.Dispatch<React.SetStateAction<AlumniTicketBundle[]>>;
}

export const AdminBundling: React.FC<AdminBundlingProps> = ({ bundles, setBundles }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<AlumniTicketBundle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingBundle(null);
    setIsModalOpen(true);
  };

  const openEditModal = (b: AlumniTicketBundle) => {
    setEditingBundle(b);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
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
          <p className="text-xs text-neutral-400">Belum ada bundling. Klik "Tambah" untuk membuat bundling baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {bundles.map((b) => (
            <div key={b.id} className="bg-white border border-neutral-100 rounded-2xl p-4 flex flex-col justify-between gap-3">
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
          onSave={(updatedList) => setBundles(updatedList)}
          bundles={bundles}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            const newList = bundles.filter((b) => b.id !== deleteTarget);
            setBundles(newList);
            localStorage.setItem("gala_merch_bundles", JSON.stringify(newList));
            deleteAlumniTicketBundleFromFirebase(deleteTarget).catch((err) => console.warn(err));
          }
        }}
        title="Hapus Bundling"
        message="Apakah Anda yakin ingin menghapus bundling ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
};
