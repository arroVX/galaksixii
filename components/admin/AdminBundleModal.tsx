"use client";

import React, { useState } from "react";
import { AlumniTicketBundle, AlumniTicketBundleItem } from "@/types/merch";
import { syncAlumniTicketBundleToFirebase } from "@/lib/firebaseService";
import { Save, X, Plus, Trash2 } from "lucide-react";

interface AdminBundleModalProps {
  bundle: AlumniTicketBundle | null;
  onClose: () => void;
  onSave: (list: AlumniTicketBundle[]) => void;
  bundles: AlumniTicketBundle[];
}

export const AdminBundleModal: React.FC<AdminBundleModalProps> = ({ bundle, onClose, onSave, bundles }) => {
  const [name, setName] = useState(bundle?.name || "");
  const [description, setDescription] = useState(bundle?.description || "");
  const [imageUrl, setImageUrl] = useState(bundle?.imageUrl || "");
  const [ticketPrice, setTicketPrice] = useState<number>(bundle?.ticketPrice || 150000);
  const [totalPrice, setTotalPrice] = useState<number>(bundle?.totalPrice || 0);
  const [items, setItems] = useState<AlumniTicketBundleItem[]>(
    bundle?.items || [{ name: "", quantity: 1, imageUrl: "" }]
  );

  const addItem = () => {
    setItems([...items, { name: "", quantity: 1, imageUrl: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof AlumniTicketBundleItem, value: string | number) => {
    const newItems = [...items];
    if (field === "quantity") {
      newItems[index] = { ...newItems[index], [field]: Math.max(1, Number(value)) };
    } else {
      newItems[index] = { ...newItems[index], [field]: value as string };
    }
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = items.filter((item) => item.name.trim());
    if (validItems.length === 0 || !name.trim()) {
      alert("Silakan lengkapi data bundling termasuk nama itemnya.");
      return;
    }

    const bundleData: AlumniTicketBundle = {
      id: bundle?.id || "ticket-alumni-bundle-" + Date.now(),
      name: name.trim(),
      description: description.trim(),
      ticketPrice: Number(ticketPrice),
      totalPrice: Number(totalPrice),
      items: validItems,
      imageUrl: imageUrl || validItems[0]?.imageUrl || ""
    };

    const newList = bundle
      ? bundles.map((b) => (b.id === bundle.id ? bundleData : b))
      : [bundleData, ...bundles];

    onSave(newList);
    localStorage.setItem("gala_merch_bundles", JSON.stringify(newList));
    syncAlumniTicketBundleToFirebase(bundleData).catch((err) => console.warn(err));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-neutral-900/50 backdrop-blur-sm">
      <div className="bg-white border border-neutral-100 rounded-t-2xl sm:rounded-2xl max-w-xl w-full shadow-xl relative flex flex-col sm:max-h-[85vh]" style={{ maxHeight: 'min(calc(100dvh - 80px), 600px)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-100 shrink-0">
          <h3 className="font-bold text-neutral-900 text-sm">
            {bundle ? "Edit Bundling" : "Tambah Bundling Baru"}
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable form */}
        <form id="bundle-form" onSubmit={handleSubmit} className="overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 text-xs flex-1 overscroll-contain min-h-0">
          <div>
            <label className="block text-neutral-500 mb-1">Nama Bundling *</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 sm:py-3 text-neutral-900 focus:border-neutral-900 outline-none" />
          </div>

          <div>
            <label className="block text-neutral-500 mb-1">Deskripsi</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 sm:py-3 text-neutral-900" />
          </div>

          <div>
            <label className="block text-neutral-500 mb-1">Foto Bundling</label>
            <div className="flex gap-3 items-center">
              {imageUrl && <img src={imageUrl} alt="Preview" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-neutral-200 shrink-0" />}
              <input type="file" accept="image/*" onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImageUrl(reader.result as string);
                  reader.readAsDataURL(e.target.files[0]);
                }
              }} className="w-full text-xs text-neutral-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 cursor-pointer" />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-700">Item dalam Bundling *</label>
              <button type="button" onClick={addItem} className="text-neutral-900 hover:text-neutral-600 flex items-center gap-1 text-[11px] font-semibold">
                <Plus size={12} /> Tambah Item
              </button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="space-y-1.5 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    placeholder="Nama item (misal: Keychain Ball & Dice)"
                    value={item.name}
                    onChange={(e) => updateItem(idx, "name", e.target.value)}
                    className="flex-1 bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900"
                  />
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                    className="w-16 bg-white border border-neutral-200 rounded-lg px-3 py-2 text-center text-neutral-900"
                  />
                  <button type="button" onClick={() => removeItem(idx)} disabled={items.length <= 1} className="p-1.5 text-neutral-400 hover:text-red-500 disabled:opacity-30">
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  type="url"
                  placeholder="URL gambar item (opsional)"
                  value={item.imageUrl || ""}
                  onChange={(e) => updateItem(idx, "imageUrl", e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-[11px] text-neutral-500"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-500 mb-1">Harga Tiket (IDR) *</label>
              <input type="number" required value={ticketPrice} onChange={(e) => setTicketPrice(Number(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 sm:py-3 text-neutral-900" />
            </div>
            <div>
              <label className="block text-neutral-500 mb-1">Harga Total Bundle (IDR) *</label>
              <input type="number" required value={totalPrice} onChange={(e) => setTotalPrice(Number(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 sm:py-3 text-neutral-900" />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-neutral-100 flex justify-end gap-2 shrink-0" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <button type="button" onClick={onClose} className="px-4 py-2.5 sm:py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl font-semibold">Batal</button>
          <button type="submit" form="bundle-form" className="px-5 py-2.5 sm:py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold flex items-center gap-1.5">
            <Save size={14} /> Simpan
          </button>
        </div>
      </div>
    </div>
  );
};
