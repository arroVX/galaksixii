"use client";

import React from "react";
import { Order } from "@/types/merch";

export const ORDER_STATUS_COLORS: Record<string, string> = {
  "Menunggu Pembayaran": "text-amber-600",
  "Diverifikasi": "text-blue-600",
  "Sedang Diproduksi": "text-purple-600",
  "Siap Diambil/Dikirim": "text-blue-600",
  "Selesai": "text-emerald-600",
  "Dibatalkan": "text-red-500"
};

interface OrderDetailViewProps {
  order: Order;
  /** Tampilkan email & user ID pemesan (untuk admin). */
  showAccountInfo?: boolean;
  /** Konten aksi di samping badge status (mis. dropdown ubah status admin). */
  headerAction?: React.ReactNode;
  /** Konten tambahan di bawah (mis. tombol hapus admin). */
  footer?: React.ReactNode;
}

/**
 * Tampilan detail pesanan — dipakai ulang oleh halaman cek pesanan
 * pelanggan dan modal detail pesanan admin. Murni presentasional,
 * tanpa logic auth maupun data-fetching.
 */
export const OrderDetailView: React.FC<OrderDetailViewProps> = ({
  order,
  showAccountInfo = false,
  headerAction,
  footer,
}) => {
  return (
    <div className="space-y-6">
      {/* Order Header */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-neutral-400">receipt</span>
              <span className="font-mono text-[15px] font-medium text-neutral-900 break-all">{order.id}</span>
            </div>
            <p className="text-[13px] text-neutral-400">
              {new Date(order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`text-[13px] font-medium ${ORDER_STATUS_COLORS[order.status] || "text-neutral-500"}`}>
              {order.status}
            </span>
            {headerAction}
          </div>
        </div>

        {/* Customer Info */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
          <div className="flex items-center gap-2 text-neutral-500">
            <span className="material-symbols-outlined text-[16px]">person</span>
            <span>{order.customerName}</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-500">
            <span className="material-symbols-outlined text-[16px]">call</span>
            <span>{order.phone}</span>
          </div>
          {showAccountInfo && order.userEmail && (
            <div className="flex items-center gap-2 text-neutral-500 min-w-0">
              <span className="material-symbols-outlined text-[16px]">mail</span>
              <span className="truncate">{order.userEmail}</span>
            </div>
          )}
          {showAccountInfo && (
            <div className="flex items-center gap-2 text-neutral-400 min-w-0">
              <span className="material-symbols-outlined text-[16px]">badge</span>
              <span className="font-mono text-[12px] truncate">{order.userId}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-4">
        <h3 className="text-[13px] font-medium text-neutral-500">Barang yang Dipesan</h3>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-14 h-14 rounded-xl object-cover bg-neutral-100 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-neutral-300">inventory_2</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-neutral-900 truncate">{item.name}</p>
                <div className="flex items-center gap-2 text-[12px] text-neutral-400 mt-0.5">
                  {item.selectedSize && item.selectedSize !== "-" && <span>Ukuran: {item.selectedSize}</span>}
                  {item.selectedColor && item.selectedColor !== "-" && <span>· Warna: {item.selectedColor}</span>}
                  <span>· {item.stockType === "PRE_ORDER" ? "Pre-Order" : "Ready"}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[14px] font-medium text-neutral-900">
                  Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                </p>
                <p className="text-[12px] text-neutral-400">
                  {item.quantity} × Rp {item.price.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Summary */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-3">
        <h3 className="text-[13px] font-medium text-neutral-500">Ringkasan Harga</h3>
        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between text-neutral-500">
            <span>Subtotal</span>
            <span>Rp {order.subtotal.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Ongkir</span>
            <span>{order.shippingFee > 0 ? `Rp ${order.shippingFee.toLocaleString("id-ID")}` : "Gratis"}</span>
          </div>
          <div className="border-t border-neutral-100 pt-2 flex justify-between font-medium text-neutral-900">
            <span>Total</span>
            <span>Rp {order.totalPrice.toLocaleString("id-ID")}</span>
          </div>
        </div>
      </div>

      {/* Payment & Delivery Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-2">
          <h3 className="text-[13px] font-medium text-neutral-500">Pembayaran</h3>
          <p className="text-[13px] text-neutral-900 font-medium">
            {order.paymentMethod === "COD" ? "Bayar di Tempat (COD)" : "Transfer Bank / QRIS"}
          </p>
          {order.paymentProofUrl ? (
            <div className="pt-2">
              <p className="text-[12px] text-neutral-400 mb-1.5">Bukti Bayar:</p>
              <img
                src={order.paymentProofUrl}
                alt="Bukti Pembayaran"
                className="w-full max-w-[200px] rounded-xl border border-neutral-100"
              />
            </div>
          ) : (
            <p className="text-[12px] text-neutral-400">Tanpa bukti (COD / WA Direct)</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-2">
          <h3 className="text-[13px] font-medium text-neutral-500">Pengiriman</h3>
          <p className="text-[13px] text-neutral-900">
            {order.addressOrClass}
          </p>
          {order.notes && (
            <p className="text-[12px] text-neutral-400 italic mt-1 whitespace-pre-wrap">
              &quot;{order.notes}&quot;
            </p>
          )}
        </div>
      </div>

      {footer}
    </div>
  );
};
