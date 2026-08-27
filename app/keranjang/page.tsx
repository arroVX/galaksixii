"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { X, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function KeranjangPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, subtotal, totalItemCount } = useCart();
  const { user, showAuthAlert } = useAuth();

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-neutral-50">
        <div className="max-w-2xl mx-auto px-5 py-10">
          {/* Header */}
          <div className="flex items-baseline gap-3 mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Keranjang</h1>
            <span className="text-sm text-neutral-400 font-medium">{totalItemCount} item</span>
          </div>

          {cart.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center text-center py-24">
              <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-300 mb-5">
                <ShoppingBag size={28} />
              </div>
              <h2 className="font-bold text-lg text-neutral-900 mb-1">Keranjang Kosong</h2>
              <p className="text-sm text-neutral-400 max-w-[260px] mb-8">
                Silakan pilih merchandise kesukaan Anda dari katalog.
              </p>
              <Link
                href="/merchandise"
                className="px-8 py-3 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Jelajahi Katalog
              </Link>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-3 mb-8">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 border border-neutral-100 flex gap-4"
                  >
                    {/* Image */}
                    <div className="w-[80px] h-[80px] rounded-xl bg-neutral-100 overflow-hidden shrink-0">
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
                          <h3 className="font-bold text-sm text-neutral-900 line-clamp-1">
                            {item.name}
                          </h3>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {item.selectedSize} · {item.stockType === "PRE_ORDER" ? "Pre-Order" : "Ready Stock"}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-neutral-300 hover:text-red-500 transition-colors shrink-0"
                          title="Hapus"
                        >
                          <X size={16} />
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
                            className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-neutral-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary & Checkout */}
              <div className="bg-white rounded-2xl border border-neutral-100 p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-neutral-400">Subtotal</span>
                  <span className="font-bold text-sm text-neutral-900">Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-neutral-100">
                  <span className="text-sm text-neutral-400">Pengiriman</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">GRATIS</span>
                </div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-base font-bold text-neutral-900">Total</span>
                  <span className="text-lg font-bold text-neutral-900">Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                <button
                  onClick={() => {
                    if (!user) {
                      showAuthAlert("Silakan masuk atau daftar akun terlebih dahulu untuk melanjutkan checkout.");
                      return;
                    }
                    router.push("/checkout");
                  }}
                  className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                >
                  Lanjut ke Checkout
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
