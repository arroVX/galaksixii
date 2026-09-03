"use client";

import React from "react";
import { Order, OrderStatus, AlumniTicket } from "@/types/merch";
import { OrderDetailView } from "@/components/OrderDetailView";
import { X, Trash2, GraduationCap, ReceiptText } from "lucide-react";

const TICKET_STATUS_STYLE: Record<string, string> = {
  VERIFIED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

const TICKET_STATUS_LABEL: Record<string, string> = {
  VERIFIED: "Terverifikasi",
  REJECTED: "Ditolak",
  PENDING_VERIFICATION: "Menunggu",
};

interface AdminOrderDetailModalProps {
  order: Order | null;
  ticket?: AlumniTicket | null;
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  onDelete: (order: Order) => void;
  onViewProof: (url: string, title: string) => void;
}

/**
 * Modal detail pesanan di dashboard admin — memakai tampilan yang sama
 * dengan halaman cek pesanan pelanggan, ditambah aksi dan info admin.
 */
export const AdminOrderDetailModal: React.FC<AdminOrderDetailModalProps> = ({
  order,
  ticket,
  onClose,
  onStatusChange,
  onDelete,
  onViewProof,
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
      <div className="bg-neutral-50 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-neutral-50/95 backdrop-blur px-5 sm:px-6 pt-5 pb-4 border-b border-neutral-100 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <ReceiptText size={16} /> Detail Pesanan
          </h3>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-900 bg-white border border-neutral-100 shrink-0"
            aria-label="Tutup detail"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5">
          <OrderDetailView
            order={order}
            showAccountInfo
            headerAction={
              <select
                value={order.status}
                onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
                className="bg-white border border-neutral-200 rounded-lg px-2 py-2 text-xs font-semibold text-neutral-900 focus:outline-none"
                aria-label="Ubah status pesanan"
              >
                <option value="Menunggu Pembayaran">Menunggu</option>
                <option value="Diverifikasi">Diverifikasi</option>
                <option value="Sedang Diproduksi">Diproduksi</option>
                <option value="Siap Diambil/Dikirim">Siap Kirim</option>
                <option value="Selesai">Selesai</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            }
          />

          {/* Tiket alumni terkait */}
          {ticket && (
            <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-3 mt-6">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[13px] font-medium text-neutral-500 flex items-center gap-2">
                  <GraduationCap size={14} /> Tiket Alumni Terkait
                </h3>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${TICKET_STATUS_STYLE[ticket.status] || "bg-amber-100 text-amber-700"}`}>
                  {TICKET_STATUS_LABEL[ticket.status] || ticket.status}
                </span>
              </div>
              <div className="text-[13px] space-y-1">
                <p className="font-bold text-neutral-900">{ticket.bundleName}</p>
                <p className="text-neutral-500 text-[12px]">
                  {ticket.bundleItems.map((b) => `${b.name} x${b.quantity}`).join(", ")}
                </p>
                <p className="text-neutral-400 text-[12px]">
                  Tahun Lulus: {ticket.graduationYear} • {ticket.verificationType === "SKL" ? "SKL" : "Kartu Pelajar"}
                </p>
                {ticket.userEmail && (
                  <p className="text-neutral-400 text-[12px] truncate">{ticket.userEmail}</p>
                )}
              </div>
              {ticket.verificationFileUrl && ticket.verificationFileUrl !== "-" ? (
                <button
                  onClick={() => onViewProof(
                    ticket.verificationFileUrl,
                    ticket.verificationType === "SKL" ? "Bukti SKL" : "Kartu Pelajar"
                  )}
                  className="px-4 py-2 bg-primary-container/20 text-primary rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-primary-container/40 transition"
                >
                  <GraduationCap size={14} /> Lihat Bukti Verifikasi
                </button>
              ) : (
                <p className="text-[12px] text-neutral-400">Tanpa bukti verifikasi</p>
              )}
            </div>
          )}

          {/* Admin actions */}
          <div className="flex justify-end mt-6">
            <button
              onClick={() => { onDelete(order); onClose(); }}
              className="px-4 py-2.5 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition flex items-center gap-1.5"
            >
              <Trash2 size={14} /> Hapus Pesanan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
