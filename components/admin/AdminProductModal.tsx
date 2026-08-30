"use client";

import React, { useState } from "react";
import { Product, StockType } from "@/types/merch";
import { Save, X } from "lucide-react";

interface AdminProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (list: Product[]) => void;
  products: Product[];
}

export const AdminProductModal: React.FC<AdminProductModalProps> = ({ product, onClose, onSave, products }) => {
  const [name, setName] = useState(product?.name || "");
  const [category, setCategory] = useState(product?.category || "Perlengkapan");
  const [price, setPrice] = useState<number>(product?.price || 35000);
  const [description, setDescription] = useState(product?.description || "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || "");
  const [stockType, setStockType] = useState<StockType>(product?.stockType || "READY");
  const [stockCount, setStockCount] = useState<number>(product?.stockCount || 50);
  const [poReleaseDate, setPoReleaseDate] = useState(product?.poReleaseDate || "2026-08-30");
  const [poQuotaTotal, setPoQuotaTotal] = useState<number>(product?.poQuotaTotal || 50);
  const [sizesInput, setSizesInput] = useState(product?.variants?.sizes?.join(", ") || "Standard");
  const [colorsInput, setColorsInput] = useState(product?.variants?.colors?.join(", ") || "White, Black");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sizes = sizesInput.split(",").map((s) => s.trim()).filter(Boolean);
    const colors = colorsInput.split(",").map((c) => c.trim()).filter(Boolean);

    let productData: Product;
    let newList: Product[];

    if (product) {
      productData = {
              ...product,
              name,
              category,
              price: Number(price),
              description,
              imageUrl,
              images: [imageUrl],
              stockType,
              stockCount: Number(stockCount),
              poReleaseDate: stockType === "PRE_ORDER" ? poReleaseDate : undefined,
              poQuotaTotal: stockType === "PRE_ORDER" ? Number(poQuotaTotal) : undefined,
              variants: { sizes, colors }
            };
      newList = products.map((p) =>
        p.id === product.id ? productData : p
      );
    } else {
      productData = {
        id: "prod-" + Date.now(),
        name,
        category,
        price: Number(price),
        description,
        imageUrl,
        images: [imageUrl],
        stockType,
        stockCount: Number(stockCount),
        poReleaseDate: stockType === "PRE_ORDER" ? poReleaseDate : undefined,
        poQuotaTotal: stockType === "PRE_ORDER" ? Number(poQuotaTotal) : undefined,
        variants: { sizes, colors },
        rating: 5.0,
        soldCount: 0,
        createdAt: new Date().toISOString()
      };
      newList = [productData, ...products];
    }

    onSave(newList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-neutral-900/50 backdrop-blur-sm">
      <div className="bg-white border border-neutral-100 rounded-t-2xl sm:rounded-2xl max-w-xl w-full shadow-xl relative flex flex-col sm:max-h-[85vh]" style={{ maxHeight: 'min(calc(100dvh - 80px), 600px)' }}>
        {/* Header - fixed */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-100 shrink-0">
          <h3 className="font-bold text-neutral-900 text-sm">
            {product ? "Edit Merchandise" : "Tambah Merchandise Baru"}
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable form */}
        <form id="product-form" onSubmit={handleSubmit} className="overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 text-xs flex-1 overscroll-contain min-h-0">
          <div>
            <label className="block text-neutral-500 mb-1">Nama Produk *</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 sm:py-3 text-neutral-900 focus:border-neutral-900 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-500 mb-1">Kategori</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 sm:py-3 text-neutral-900">
                <option value="Perlengkapan">Perlengkapan</option>
                <option value="Aksesoris & Stiker">Aksesoris & Stiker</option>
                <option value="Topi & Tas">Topi & Tas</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-500 mb-1">Harga (IDR) *</label>
              <input type="number" required value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 sm:py-3 text-neutral-900" />
            </div>
          </div>

          <div>
            <label className="block text-neutral-500 mb-1">Deskripsi Produk</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 sm:py-3 text-neutral-900" />
          </div>

          <div>
            <label className="block text-neutral-500 mb-1">Foto Produk *</label>
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

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
            <label className="block text-xs font-bold text-neutral-700">Sistem Penjualan:</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-700">
                <input type="radio" name="stockType" checked={stockType === "READY"} onChange={() => setStockType("READY")} className="accent-neutral-900" />
                Ready Stock
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-neutral-700">
                <input type="radio" name="stockType" checked={stockType === "PRE_ORDER"} onChange={() => setStockType("PRE_ORDER")} className="accent-neutral-900" />
                Pre-Order (PO)
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-neutral-500 mb-1">{stockType === "PRE_ORDER" ? "Sisa Kuota PO" : "Stok Tersedia"}</label>
                <input type="number" value={stockCount} onChange={(e) => setStockCount(Number(e.target.value))} className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 sm:py-3 text-neutral-900" />
              </div>
              {stockType === "PRE_ORDER" && (
                <div>
                  <label className="block text-neutral-500 mb-1">Estimasi Tgl Rilis</label>
                  <input type="date" value={poReleaseDate} onChange={(e) => setPoReleaseDate(e.target.value)} className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 sm:py-3 text-neutral-900" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-neutral-500 mb-1">Ukuran (pisah koma)</label>
            <input type="text" value={sizesInput} onChange={(e) => setSizesInput(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 sm:py-3 text-neutral-900" />
          </div>

          <div>
            <label className="block text-neutral-500 mb-1">Warna (pisah koma)</label>
            <input type="text" value={colorsInput} onChange={(e) => setColorsInput(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 sm:py-3 text-neutral-900" />
          </div>
        </form>

        {/* Footer - fixed */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-neutral-100 flex justify-end gap-2 shrink-0" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <button type="button" onClick={onClose} className="px-4 py-2.5 sm:py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl font-semibold">Batal</button>
          <button type="submit" form="product-form" className="px-5 py-2.5 sm:py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold flex items-center gap-1.5">
            <Save size={14} /> Simpan
          </button>
        </div>
      </div>
    </div>
  );
};
