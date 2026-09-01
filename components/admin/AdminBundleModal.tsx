"use client";

import React, { useState } from "react";
import { AlumniTicketBundle, AlumniTicketBundleItem } from "@/types/merch";
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
  const [images, setImages] = useState<string[]>(
    bundle?.images && bundle.images.length > 0 ? bundle.images : bundle?.imageUrl ? [bundle.imageUrl] : []
  );
  const [ticketPrice, setTicketPrice] = useState<number>(bundle?.ticketPrice || 150000);
  const [totalPrice, setTotalPrice] = useState<number>(bundle?.totalPrice || 0);
  const [isAlumniOnly, setIsAlumniOnly] = useState<boolean>(bundle?.isAlumniOnly ?? true);
  const [items, setItems] = useState<AlumniTicketBundleItem[]>(
    bundle?.items || [{ name: "", quantity: 1, imageUrl: "" }]
  );
  const [error, setError] = useState<string | null>(null);

  const addItem = () => {
    setItems([...items, { name: "", quantity: 1, imageUrl: "" }]);
    setError(null);
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

    if (!name.trim()) {
      setError("Nama bundling wajib diisi.");
      return;
    }
    const validItems = items.filter((item) => item.name.trim());
    if (validItems.length === 0) {
      setError("Minimal satu item dengan nama wajib diisi.");
      return;
    }
    if (!Number(totalPrice) || Number(totalPrice) <= 0) {
      setError("Harga total bundle wajib lebih dari 0.");
      return;
    }

    const bundleData: AlumniTicketBundle = {
      id: bundle?.id || "ticket-alumni-bundle-" + Date.now(),
      name: name.trim(),
      description: description.trim(),
      ticketPrice: Number(ticketPrice) || 0,
      totalPrice: Number(totalPrice),
      isAlumniOnly,
      items: validItems.map((item) => ({
        name: item.name.trim(),
        quantity: item.quantity,
        imageUrl: item.imageUrl?.trim() || ""
      })),
      imageUrl: images[0]?.trim() || validItems[0]?.imageUrl?.trim() || "",
      images: images.length > 0 ? images : undefined,
    };

    const newList = bundle
      ? bundles.map((b) => (b.id === bundle.id ? bundleData : b))
      : [bundleData, ...bundles];

    onSave(newList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-neutral-900/50 backdrop-blur-sm">
      {/* Form membungkus SELURUH modal (header + body + footer) sehingga tombol
          submit menjadi anak langsung dari <form> → submit 100% reliable. */}
      <form onSubmit={handleSubmit} className="bg-white border border-neutral-100 rounded-t-2xl sm:rounded-2xl max-w-xl w-full shadow-xl relative flex flex-col sm:max-h-[85vh]" style={{ maxHeight: 'min(calc(100dvh - 80px), 600px)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-100 shrink-0">
          <h3 className="font-bold text-neutral-900 text-sm">
            {bundle ? "Edit Bundling" : "Tambah Bundling Baru"}
          </h3>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-900 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 text-xs flex-1 overscroll-contain min-h-0">
          <div>
            <label className="block text-neutral-500 mb-1">Nama Bundling *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 sm:py-3 text-neutral-900 focus:border-neutral-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-neutral-500 mb-1">Deskripsi</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 sm:py-3 text-neutral-900" />
          </div>

          <div>
            <label className="block text-neutral-500 mb-1">Foto Bundling (bisa banyak — untuk slide)</label>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 flex-wrap">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img src={img} alt={`Preview ${idx + 1}`} className="w-12 h-12 rounded-lg object-cover border border-neutral-200 shrink-0" />
                    <button type="button" onClick={() => setImages(images.filter((_, i) => i !== idx))} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <input type="file" accept="image/*" multiple onChange={(e) => {
                const files = Array.from(e.target.files || []);
                files.forEach((file) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const img = new Image();
                    img.onload = () => {
                      const canvas = document.createElement("canvas");
                      let width = img.width;
                      let height = img.height;
                      const MAX_SIZE = 800;
                      if (width > height && width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                      } else if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                      }
                      canvas.width = width;
                      canvas.height = height;
                      const ctx = canvas.getContext("2d");
                      ctx?.drawImage(img, 0, 0, width, height);
                      setImages(prev => [...prev, canvas.toDataURL("image/webp", 0.7)]);
                    };
                    img.src = reader.result as string;
                  };
                  reader.readAsDataURL(file);
                });
              }} className="w-full text-xs text-neutral-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 cursor-pointer" />
            </div>
          </div>

          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="alumni-only"
              checked={isAlumniOnly}
              onChange={(e) => setIsAlumniOnly(e.target.checked)}
              className="w-4 h-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-900 accent-neutral-900"
            />
            <label htmlFor="alumni-only" className="text-xs text-neutral-700 cursor-pointer select-none">
              Wajib Verifikasi Alumni (Upload SKL / Kartu Pelajar saat Checkout)
            </label>
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
                    placeholder="Nama item (misal: Keychain Ball & Dice) *"
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
                    title="Jumlah"
                  />
                  <button type="button" onClick={() => removeItem(idx)} disabled={items.length <= 1} className="p-1.5 text-neutral-400 hover:text-red-500 disabled:opacity-30" title="Hapus item">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex gap-2 items-center mt-1.5">
                  {item.imageUrl && <img src={item.imageUrl} alt="" className="w-8 h-8 rounded-lg bg-neutral-200 object-cover shrink-0" />}
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const img = new Image();
                        img.onload = () => {
                          const canvas = document.createElement("canvas");
                          let width = img.width;
                          let height = img.height;
                          const MAX_SIZE = 400; // Smaller size for items
                          if (width > height && width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                          } else if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                          }
                          canvas.width = width;
                          canvas.height = height;
                          const ctx = canvas.getContext("2d");
                          ctx?.drawImage(img, 0, 0, width, height);
                          updateItem(idx, "imageUrl", canvas.toDataURL("image/webp", 0.7));
                        };
                        img.src = reader.result as string;
                      };
                      reader.readAsDataURL(file);
                    }
                  }} className="text-[10px] text-neutral-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-white file:text-neutral-700 hover:file:bg-neutral-100 cursor-pointer w-full" />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-500 mb-1">Harga Tiket (IDR) *</label>
              <input
                type="number"
                required
                value={ticketPrice}
                onChange={(e) => setTicketPrice(Number(e.target.value))}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 sm:py-3 text-neutral-900"
              />
            </div>
            <div>
              <label className="block text-neutral-500 mb-1">Harga Total Bundle (IDR) *</label>
              <input
                type="number"
                required
                value={totalPrice}
                onChange={(e) => { setTotalPrice(Number(e.target.value)); setError(null); }}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 sm:py-3 text-neutral-900"
              />
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-4 sm:mx-6 mb-3 px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-[11px] rounded-lg shrink-0">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-neutral-100 flex justify-end gap-2 shrink-0" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <button type="button" onClick={onClose} className="px-4 py-2.5 sm:py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl font-semibold">Batal</button>
          <button type="submit" className="px-5 py-2.5 sm:py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold flex items-center gap-1.5 active:scale-95 transition">
            <Save size={14} /> Simpan
          </button>
        </div>
      </form>
    </div>
  );
};
