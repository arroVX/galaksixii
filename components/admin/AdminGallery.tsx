"use client";

import React, { useState } from "react";
import { GalleryItem } from "@/types/merch";
import { deleteGalleryItemFromFirebase } from "@/lib/firebaseService";
import { Plus, Edit3, Trash2, ImageIcon } from "lucide-react";
import { AdminGalleryModal } from "./AdminGalleryModal";

interface AdminGalleryProps {
  gallery: GalleryItem[];
  setGallery: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
}

export const AdminGallery: React.FC<AdminGalleryProps> = ({ gallery, setGallery }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);

  const persistGallery = (list: GalleryItem[]) => {
    const sorted = [...list].sort((a, b) => b.year - a.year);
    setGallery(sorted);
    localStorage.setItem("gala_merch_gallery", JSON.stringify(sorted));
  };

  const handleDelete = (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus dokumentasi ini?")) return;
    persistGallery(gallery.filter((g) => g.id !== id));
    deleteGalleryItemFromFirebase(id).catch((err) => console.warn(err));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <ImageIcon size={16} /> Galeri Dokumentasi ({gallery.length})
        </h3>
        <button
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
        >
          <Plus size={14} /> Tambah
        </button>
      </div>

      <p className="text-[11px] text-neutral-400 bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2">
        Item tanpa foto otomatis tampil sebagai placeholder di halaman Kompetisi.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {gallery.map((g) => (
          <div key={g.id} className="bg-white border border-neutral-100 rounded-2xl overflow-hidden flex flex-col">
            <div className="relative aspect-video bg-neutral-100 flex items-center justify-center">
              {g.imageUrl ? (
                <img src={g.imageUrl} alt={g.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-neutral-300 py-6">
                  <ImageIcon size={24} />
                  <span className="text-[9px] font-bold uppercase">Placeholder</span>
                </div>
              )}
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-neutral-900/80 text-white text-[9px] font-bold rounded-full">{g.year}</span>
              <span className="absolute top-2 right-2 px-2 py-0.5 bg-white/90 text-neutral-600 text-[9px] font-bold rounded-full">{g.category}</span>
            </div>
            <div className="p-3 flex flex-col flex-1">
              <h4 className="font-bold text-neutral-900 text-xs line-clamp-1">{g.title}</h4>
              {g.caption && <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-2">{g.caption}</p>}
              <div className="pt-2 mt-auto border-t border-neutral-50 flex items-center justify-end gap-1.5">
                <button onClick={() => { setEditingItem(g); setIsModalOpen(true); }} className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition" title="Edit">
                  <Edit3 size={12} />
                </button>
                <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition" title="Hapus">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <AdminGalleryModal
          item={editingItem}
          onClose={() => setIsModalOpen(false)}
          onSave={(list) => persistGallery(list)}
          gallery={gallery}
        />
      )}
    </div>
  );
};
