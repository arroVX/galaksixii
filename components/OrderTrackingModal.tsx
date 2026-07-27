"use client";

import React, { useEffect, useState } from "react";
import { Order, OrderStatus } from "@/types/merch";
import { useAuth } from "@/context/AuthContext";

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_STEPS: OrderStatus[] = [
  "Menunggu Pembayaran",
  "Diverifikasi",
  "Sedang Diproduksi",
  "Siap Diambil/Dikirim",
  "Selesai"
];

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedOrdersStr = localStorage.getItem("gala_merch_orders");
      if (savedOrdersStr) {
        try {
          const parsed: Order[] = JSON.parse(savedOrdersStr);
          const userOrders = parsed.filter(o => o.userId === user?.uid || o.userEmail === user?.email);
          setOrders(userOrders);
          if (userOrders.length > 0) setSelectedOrder(userOrders[0]);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const getStepIndex = (status: OrderStatus) => {
    return STATUS_STEPS.indexOf(status);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative text-on-background text-left font-body-md">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            </div>
            <div>
              <h3 className="font-bold text-primary text-lg font-headline-md">Pelacakan Pesanan Saya</h3>
              <p className="text-xs text-on-surface-variant font-medium">Pantau status pesanan dan progres produksi merchandise</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant space-y-3">
            <span className="material-symbols-outlined text-[48px] text-outline opacity-50 block mx-auto">inventory_2</span>
            <h4 className="font-bold text-primary font-headline-md">Belum Ada Pesanan</h4>
            <p className="text-xs max-w-sm mx-auto text-on-surface-variant font-medium">
              Anda belum melakukan checkout. Pesanan yang dibuat akan tampil di sini secara real-time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Daftar Transaksi ({orders.length})
              </h4>
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                    selectedOrder?.id === ord.id
                      ? "bg-primary text-on-primary border-primary shadow-md"
                      : "bg-surface-container-low border-outline-variant/50 text-on-surface hover:border-outline shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-mono text-xs font-bold ${selectedOrder?.id === ord.id ? "text-on-primary" : "text-primary"}`}>{ord.id}</span>
                    <span className={`text-[10px] font-mono ${selectedOrder?.id === ord.id ? "text-white/60" : "text-on-surface-variant"}`}>
                      {new Date(ord.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className={`text-xs font-semibold line-clamp-1 ${selectedOrder?.id === ord.id ? "text-white" : "text-on-surface-variant"}`}>
                    {ord.items.map((i) => i.name).join(", ")}
                  </p>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-outline-variant/20">
                    <span className="text-xs font-extrabold font-headline-md">
                      Rp {ord.totalPrice.toLocaleString("id-ID")}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ord.status === "Selesai" 
                        ? "bg-emerald-500 text-white"
                        : ord.status === "Sedang Diproduksi"
                        ? "bg-purple-500 text-white"
                        : "bg-amber-400 text-slate-900"
                    }`}>
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column */}
            {selectedOrder && (
              <div className="md:col-span-2 bg-surface-container-lowest rounded-2xl border border-outline-variant/50 p-5 space-y-6">
                {/* Header Info */}
                <div className="flex flex-wrap justify-between items-start gap-2 border-b border-outline-variant/30 pb-4">
                  <div>
                    <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider">Kode Transaksi</span>
                    <h4 className="text-base font-bold text-primary font-mono">{selectedOrder.id}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5 font-medium">
                      Pemesan: <span className="text-primary font-bold">{selectedOrder.customerName}</span> ({selectedOrder.phone})
                    </p>
                  </div>

                  <a
                    href={`https://wa.me/6281234567890?text=Halo%20Admin,%20saya%20ingin%20menanyakan%20status%20pesanan%20dengan%20Kode:%20${selectedOrder.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-primary hover:bg-neutral-800 text-on-primary text-xs font-bold rounded-full flex items-center gap-1.5 transition shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[14px]">chat</span> Tanya Admin WA
                  </a>
                </div>

                {/* Progress Timeline */}
                <div>
                  <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">
                    Status Pelacakan Pesanan:
                  </h5>
                  <div className="relative flex items-center justify-between px-2">
                    <div className="absolute top-1/2 left-6 right-6 h-1 bg-surface-container-high -translate-y-1/2 -z-0" />
                    
                    {STATUS_STEPS.map((step, idx) => {
                      const currentIdx = getStepIndex(selectedOrder.status);
                      const isDone = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div key={step} className="relative z-10 flex flex-col items-center text-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition border-2 ${
                              isCurrent
                                ? "bg-primary border-primary text-on-primary shadow-md scale-110"
                                : isDone
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "bg-surface-container-lowest border-outline-variant/50 text-outline"
                            }`}
                          >
                            {isDone ? <span className="material-symbols-outlined text-[14px]">check</span> : idx + 1}
                          </div>
                          <span className={`text-[10px] font-semibold mt-2 max-w-[65px] leading-tight ${
                            isCurrent ? "text-primary font-bold" : isDone ? "text-primary" : "text-on-surface-variant"
                          }`}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Items in this order */}
                <div className="pt-4 border-t border-outline-variant/30">
                  <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">
                    Barang Yang Dipesan:
                  </h5>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 text-xs shadow-sm">
                        <div className="flex items-center gap-3">
                          <img src={item.imageUrl} alt={item.name} className="w-9 h-9 rounded-lg object-cover bg-white border border-outline-variant/30" />
                          <div>
                            <p className="font-bold text-primary font-headline-md">{item.name}</p>
                            <p className="text-[11px] text-on-surface-variant font-mono">
                              Varian: {item.selectedSize} | {item.selectedColor} ({item.quantity} Pcs)
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-primary font-headline-md">
                          Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Details */}
                <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 text-xs space-y-1">
                  <span className="text-on-surface-variant block font-bold text-[10px] uppercase tracking-wider">
                    Alamat Pengiriman / Detail Kelas Internal:
                  </span>
                  <p className="text-primary font-medium">{selectedOrder.addressOrClass}</p>
                </div>
              </div>
            )}
          </div>
        )}

        </div>
      </div>
    </div>
  );
};
