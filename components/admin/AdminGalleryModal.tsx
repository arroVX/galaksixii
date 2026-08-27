"use client";

import React, { useState } from "react";
import { GalleryItem } from "@/types/merch";
import { syncGalleryItemToFirebase } from "@/lib/firebaseService";
import { Save, X, ImageIcon } from "lucide-react";

interface AdminGalleryModalProps {
  item: GalleryItem | null;
  onClose: () => void;
  onSave: (list: GalleryItem[]) => void;
  gallery: GalleryItem[];
}

export const AdminGalleryModal: React.FC<AdminGalleryModalProps> = ({ item, onClose, onSave, gallery }) => {
  const [title, setTitle] = useState(item?.title || "");
  const [category, setCategory] = useState(item?.category || "Liga Olahraga");
  const [year, setYear] = useState<number>(item?.year || new Date().getFullYear());
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || "");
  const [caption, setCaption] = useState(item?.caption || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (item) {
      const updated: GalleryItem = {
        ...item,
        title,
        category,
        year: Number(year),
        imageUrl: imageUrl.trim() || undefined,
        caption: caption.trim() || undefined
      };
      const updatedList = gallery.map((g) => (g.id === item.id ? updated : g));
      onSave(updatedList);
      syncGalleryItemToFirebase(updated).catch((err) => console.warn(err));
    } else {
      const newItem: GalleryItem = {
        id: "gal-" + Date.now(),
        title,
        category,
        year: Number(year),
        imageUrl: imageUrl.trim() || undefined,
        caption: caption.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      onSave([newItem, ...gallery]);
      syncGalleryItemToFirebase(newItem).catch((err) => console.warn(err));
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
      <div className="bg-white border border-neutral-100 rounded-2xl max-w-lg w-full p-6 shadow-xl relative my-8">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
          <h3 className="font-bold text-neutral-900 text-sm">
            {item ? "Edit Dokumentasi" : "Tambah Dokumentasi"}
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-neutral-500 mb-1">Judul Momen *</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="mis. Final Futsal Antar Kelas" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-neutral-900 focus:border-neutral-900 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-500 mb-1">Tahapan Acara</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-neutral-900">
                <option value="Liga Olahraga">Liga Olahraga</option>
                <option value="Liga E-Sport">Liga E-Sport</option>
                <option value="Pentas Seni">Pentas Seni</option>
                <option value="Bazar">Bazar</option>
                <option value="Puncak Acara">Puncak Acara</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-500 mb-1">Tahun Edisi *</label>
              <input type="number" required min={2010} max={2100} value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-neutral-900" />
            </div>
          </div>

          <div>
            <label className="block text-neutral-500 mb-1">Keterangan Singkat</label>
            <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="mis. Gilang resmi pembukaan liga futsal." className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-neutral-900 focus:border-neutral-900 outline-none" />
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
            <label className="block text-xs font-bold text-neutral-700">Foto Dokumentasi (opsional)</label>
            {imageUrl ? (
              <img src={imageUrl} alt="Preview" className="w-full aspect-video object-cover rounded-xl border border-neutral-200" />
            ) : (
              <div className="aspect-video rounded-xl border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center gap-1 text-neutral-400">
                <ImageIcon size={20} />
                <span className="text-[9px] font-bold uppercase">Kosong = Placeholder</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onloadend = () => setImageUrl(reader.result as string);
                reader.readAsDataURL(e.target.files[0]);
              }
            }} className="w-full text-xs text-neutral-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 cursor-pointer" />
          </div>

          <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl font-semibold">Batal</button>
            <button type="submit" className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold flex items-center gap-1.5">
              <Save size={14} /> Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
