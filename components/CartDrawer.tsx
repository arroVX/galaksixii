"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Clock } from "lucide-react";

export const CartDrawer: React.FC = () => {
  const router = useRouter();
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, subtotal, totalItemCount } = useCart();
  const { user, showAuthAlert } = useAuth();

  if (!isCartOpen) return null;

  const hasPOItems = cart.some((item) => item.stockType === "PRE_ORDER");

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between text-slate-900">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center">
                <ShoppingBag size={16} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base font-serif-title">Keranjang Belanja</h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {totalItemCount} Barang Terpilih
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <ShoppingBag size={28} />
                </div>
                <h4 className="font-bold text-slate-800 font-serif-title">Keranjang Kosong</h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Silakan pilih souvenir atau merchandise kesukaan Anda dari katalog.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-full shadow-md transition"
                >
                  Jelajahi Katalog
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex gap-3 relative group"
                >
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl bg-white overflow-hidden shrink-0 border border-slate-200">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-slate-900 text-xs font-serif-title line-clamp-1">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-red-600 transition"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Variant tags */}
                      <div className="flex items-center gap-1 mt-1">
                        {item.stockType === "PRE_ORDER" ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded-full flex items-center gap-0.5">
                            <Clock size={10} /> Pre-Order (PO)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-full">
                            Ready Stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price & Controls */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/60">
                      <span className="font-extrabold text-xs text-slate-900 font-serif-title">
                        Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                      </span>

                      <div className="flex items-center bg-white border border-slate-200 rounded-full overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 text-slate-600 hover:bg-slate-100 transition"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-900 min-w-[1.2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 text-slate-600 hover:bg-slate-100 transition"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* PO Notice */}
            {hasPOItems && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] text-amber-900 flex items-start gap-2">
                <Clock size={16} className="shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Terdapat barang Pre-Order di keranjang Anda. Pengiriman akan dilakukan setelah proses produksi selesai.
                </span>
              </div>
            )}
          </div>

          {/* Footer Checkout */}
          {cart.length > 0 && (
            <div className="p-4 pb-8 border-t border-slate-100 bg-white space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Subtotal Barang:</span>
                <span className="font-bold text-slate-900">Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Estimasi Biaya Pengiriman:</span>
                <span className="text-emerald-600 font-bold">GRATIS PROMO</span>
              </div>
              <div className="flex justify-between items-center text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100 font-serif-title">
                <span>Total Bayar:</span>
                <span>Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>

              <button
                onClick={() => {
                  if (!user) {
                    setIsCartOpen(false);
                    showAuthAlert("Silakan masuk atau daftar akun terlebih dahulu untuk melanjutkan checkout.");
                    return;
                  }
                  setIsCartOpen(false);
                  router.push("/checkout");
                }}
                className="w-full py-3.5 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xl flex items-center justify-center gap-2 transition"
              >
                <span>Lanjut ke Checkout</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
