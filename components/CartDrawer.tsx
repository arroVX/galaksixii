"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { X, Minus, Plus, ShoppingBag, ArrowRight, Clock } from "lucide-react";

export const CartDrawer: React.FC = () => {
  const router = useRouter();
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, subtotal, totalItemCount } = useCart();
  const { user, showAuthAlert } = useAuth();

  if (!isCartOpen) return null;

  const hasPOItems = cart.some((item) => item.stockType === "PRE_ORDER");

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-neutral-50 shadow-2xl flex flex-col text-neutral-900">

          {/* ── Header ── */}
          <div className="px-6 pt-8 pb-5 bg-white border-b border-neutral-100 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="text-xl font-bold tracking-tight">Keranjang</h2>
              <span className="text-sm text-neutral-400 font-medium">{totalItemCount} item</span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-11 h-11 flex items-center justify-center -mr-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* ── Cart Items ── */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-300 mb-4">
                  <ShoppingBag size={24} />
                </div>
                <h3 className="font-bold text-neutral-900 mb-1">Keranjang Kosong</h3>
                <p className="text-xs text-neutral-400 max-w-[220px] mb-6">
                  Silakan pilih merchandise kesukaan Anda dari katalog.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Jelajahi Katalog
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 border border-neutral-100 flex gap-4"
                  >
                    {/* Image */}
                    <div className="w-[72px] h-[72px] rounded-xl bg-neutral-100 overflow-hidden shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-neutral-900 line-clamp-1">
                            {item.name}
                          </h4>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {item.stockType === "PRE_ORDER" ? "Pre-Order" : "Ready Stock"}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-neutral-300 hover:text-red-500 transition-colors text-sm font-medium shrink-0"
                          title="Hapus"
                        >
                          ×
                        </button>
                      </div>

                      {/* Price & Quantity */}
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-bold text-sm text-neutral-900">
                          Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                        </span>
                        <div className="flex items-center border border-neutral-200 rounded-full">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-11 h-11 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-neutral-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-11 h-11 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* PO Notice */}
                {hasPOItems && (
                  <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 text-[11px] text-amber-700 flex items-start gap-2">
                    <Clock size={14} className="shrink-0 mt-0.5 text-amber-500" />
                    <span>Beberapa item Pre-Order akan dikirim setelah produksi selesai.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          {cart.length > 0 && (
            <div className="bg-white border-t border-neutral-100 px-6 pt-5 pb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-neutral-400">Subtotal</span>
                <span className="font-bold text-sm text-neutral-900">Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between items-center mb-5 pb-5 border-b border-neutral-100">
                <span className="text-sm text-neutral-400">Pengiriman</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">GRATIS</span>
              </div>
              <div className="flex justify-between items-center mb-5">
                <span className="text-base font-bold text-neutral-900">Total</span>
                <span className="text-lg font-bold text-neutral-900">Rp {subtotal.toLocaleString("id-ID")}</span>
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
                className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                Lanjut ke Checkout
                <ArrowRight size={16} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
