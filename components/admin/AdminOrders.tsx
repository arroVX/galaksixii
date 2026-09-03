"use client";

import React, { useState, useEffect } from "react";
import { Order, OrderStatus, AlumniTicket } from "@/types/merch";
import { syncOrderToFirebase, fetchOrdersFromFirebase, fetchAllAlumniTicketsFromFirebase, deleteOrderFromFirebase, deleteAlumniTicketFromFirebase } from "@/lib/firebaseService";
import { Eye, Filter, TrendingUp, X, ImageIcon, GraduationCap, Trash2, ReceiptText } from "lucide-react";
import { AdminOrderDetailModal } from "@/components/admin/AdminOrderDetailModal";

const loadInitialOrders = (): Order[] => {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem("gala_merch_orders");
  if (saved) {
    try { return JSON.parse(saved); } catch { return []; }
  }
  return [];
};

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(loadInitialOrders);
  const [tickets, setTickets] = useState<Record<string, AlumniTicket>>({});
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewProofUrl, setViewProofUrl] = useState<{ url: string; title: string } | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<AlumniTicket | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const detailOrder = detailOrderId ? orders.find((o) => o.id === detailOrderId) ?? null : null;

  useEffect(() => {
    const loadFirebase = async () => {
      try {
        const fbOrders = await fetchOrdersFromFirebase();
        if (fbOrders.length >= 0) { // Changed to >= 0 to handle case where ALL orders are deleted
          const sorted = fbOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setOrders(sorted);
          localStorage.setItem("gala_merch_orders", JSON.stringify(sorted));
        }
        const fbTickets = await fetchAllAlumniTicketsFromFirebase();
        const ticketsMap: Record<string, AlumniTicket> = {};
        
        // Recover local tickets that failed to sync to Firebase previously due to missing rules
        const savedTickets = localStorage.getItem("gala_alumni_tickets");
        if (savedTickets) {
          try {
            const localTickets: AlumniTicket[] = JSON.parse(savedTickets);
            localTickets.forEach(t => { ticketsMap[t.orderId] = t; });
          } catch { /* ignore */ }
        }
        
        fbTickets.forEach(t => { ticketsMap[t.orderId] = t; });
        setTickets(ticketsMap);
      } catch { /* ignore */ }
    };
    loadFirebase();
  }, []);

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o
    );
    setOrders(updated);
    localStorage.setItem("gala_merch_orders", JSON.stringify(updated));
    const target = updated.find((o) => o.id === orderId);
    if (target) syncOrderToFirebase(target).catch((err) => console.warn(err));
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    const orderId = orderToDelete.id;
    const linkedTicket = tickets[orderId] || null;
    // Simpan snapshot untuk revert jika Firebase gagal (partial failure = data kembali lagi)
    const prevOrders = orders;
    const prevTickets = tickets;
    const prevLocalOrders = localStorage.getItem("gala_merch_orders");
    const prevLocalTickets = localStorage.getItem("gala_alumni_tickets");
    setOrderToDelete(null);

    // Optimistic UI update — hapus order dan tiket terkait dari state + localStorage
    const updated = orders.filter((o) => o.id !== orderId);
    setOrders(updated);
    localStorage.setItem("gala_merch_orders", JSON.stringify(updated));

    if (linkedTicket) {
      const updatedTickets = { ...tickets };
      delete updatedTickets[orderId];
      setTickets(updatedTickets);
      try {
        const saved = localStorage.getItem("gala_alumni_tickets");
        if (saved) {
          const localTickets: AlumniTicket[] = JSON.parse(saved);
          const filtered = localTickets.filter((t) => t.orderId !== orderId && t.id !== linkedTicket.id);
          localStorage.setItem("gala_alumni_tickets", JSON.stringify(filtered));
        }
      } catch { /* ignore */ }
    }
    
    try {
      const orderResult = await deleteOrderFromFirebase(orderId);
      let ticketResult = { rtdbOk: true, firestoreOk: true };
      if (linkedTicket) {
        ticketResult = await deleteAlumniTicketFromFirebase(linkedTicket.id);
      }
      // Cek partial failure — sebelumnya dianggap sukses sehingga data "kembali lagi" dari DB yang tidak terhapus
      const orderOk = orderResult.rtdbOk && orderResult.firestoreOk;
      const ticketOk = ticketResult.rtdbOk && ticketResult.firestoreOk;
      if (!orderOk || !ticketOk) {
        throw new Error(
          `Hapus tidak lengkap — Order RTDB:${orderResult.rtdbOk ? "ok" : "GAGAL"} Firestore:${orderResult.firestoreOk ? "ok" : "GAGAL"}` +
          (linkedTicket ? ` | Tiket RTDB:${ticketResult.rtdbOk ? "ok" : "GAGAL"} Firestore:${ticketResult.firestoreOk ? "ok" : "GAGAL"}` : "") +
          ". Cek rules & login admin."
        );
      }
    } catch (err) {
      console.error("Gagal menghapus pesanan:", err);
      alert(`Gagal menghapus pesanan. ${err instanceof Error ? err.message : "Silakan coba lagi."}`);
      // Revert presisi dari snapshot (jangan reload dari localStorage yang sudah terlanjur di-overwrite)
      setOrders(prevOrders);
      setTickets(prevTickets);
      if (prevLocalOrders !== null) localStorage.setItem("gala_merch_orders", prevLocalOrders);
      else localStorage.removeItem("gala_merch_orders");
      if (prevLocalTickets !== null) localStorage.setItem("gala_alumni_tickets", prevLocalTickets);
      else localStorage.removeItem("gala_alumni_tickets");
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    const ticketId = ticketToDelete.id;
    const orderId = ticketToDelete.orderId;
    const prevTickets = tickets;
    const prevOrders = orders;
    const prevLocalTickets = localStorage.getItem("gala_alumni_tickets");
    const prevLocalOrders = localStorage.getItem("gala_merch_orders");
    setTicketToDelete(null);

    // Optimistic UI update
    const updatedTickets = { ...tickets };
    // Hapus semua entri yang memiliki id tiket ini (key bisa orderId atau id)
    Object.keys(updatedTickets).forEach((k) => {
      if (updatedTickets[k].id === ticketId) delete updatedTickets[k];
    });
    setTickets(updatedTickets);
    try {
      const saved = localStorage.getItem("gala_alumni_tickets");
      if (saved) {
        const localTickets: AlumniTicket[] = JSON.parse(saved);
        const filtered = localTickets.filter((t) => t.id !== ticketId);
        localStorage.setItem("gala_alumni_tickets", JSON.stringify(filtered));
      }
    } catch { /* ignore */ }

    // Jika ada order terkait, hapus order-nya juga agar tidak ada data yatim
    const hasLinkedOrder = orders.some((o) => o.id === orderId);
    if (hasLinkedOrder) {
      const updatedOrders = orders.filter((o) => o.id !== orderId);
      setOrders(updatedOrders);
      localStorage.setItem("gala_merch_orders", JSON.stringify(updatedOrders));
    }

    try {
      const ticketResult = await deleteAlumniTicketFromFirebase(ticketId);
      let orderResult = { rtdbOk: true, firestoreOk: true };
      if (hasLinkedOrder) {
        orderResult = await deleteOrderFromFirebase(orderId);
      }
      const ticketOk = ticketResult.rtdbOk && ticketResult.firestoreOk;
      const orderOk = orderResult.rtdbOk && orderResult.firestoreOk;
      if (!ticketOk || !orderOk) {
        throw new Error(
          `Hapus tidak lengkap — Tiket RTDB:${ticketResult.rtdbOk ? "ok" : "GAGAL"} Firestore:${ticketResult.firestoreOk ? "ok" : "GAGAL"}` +
          (hasLinkedOrder ? ` | Order RTDB:${orderResult.rtdbOk ? "ok" : "GAGAL"} Firestore:${orderResult.firestoreOk ? "ok" : "GAGAL"}` : "")
        );
      }
    } catch (err) {
      console.error("Gagal menghapus tiket alumni:", err);
      alert(`Gagal menghapus tiket alumni. ${err instanceof Error ? err.message : "Silakan coba lagi."}`);
      setTickets(prevTickets);
      setOrders(prevOrders);
      if (prevLocalTickets !== null) localStorage.setItem("gala_alumni_tickets", prevLocalTickets);
      else localStorage.removeItem("gala_alumni_tickets");
      if (prevLocalOrders !== null) localStorage.setItem("gala_merch_orders", prevLocalOrders);
      else localStorage.removeItem("gala_merch_orders");
    }
  };

  const filteredOrders = statusFilter === "ALL" ? orders : orders.filter((o) => o.status === statusFilter);

  const statusOptions = ["ALL", "Menunggu Pembayaran", "Diverifikasi", "Sedang Diproduksi", "Siap Diambil/Dikirim", "Selesai"];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <TrendingUp size={16} /> Pesanan ({orders.length})
        </h3>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Filter size={12} className="text-neutral-400 shrink-0" />
          {statusOptions.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition ${
                statusFilter === st
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-500 border border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              {st === "ALL" ? "Semua" : st}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden md:hidden">
        <div className="divide-y divide-neutral-50">
          {filteredOrders.length === 0 ? (
            <p className="p-8 text-center text-neutral-400 text-xs">Tidak ada pesanan.</p>
          ) : (
            filteredOrders.map((ord) => (
              <div key={ord.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-neutral-900 text-sm">{ord.id}</p>
                    <p className="text-[10px] text-neutral-400">
                      {new Date(ord.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-neutral-900">Rp {ord.totalPrice.toLocaleString("id-ID")}</span>
                </div>
                <div>
                  <p className="font-bold text-neutral-900 text-xs">{ord.customerName}</p>
                  <p className="text-[11px] text-neutral-400">{ord.phone}</p>
                </div>
                <div>
                  {ord.items.map((item, idx) => (
                    <p key={idx} className="text-[11px] text-neutral-600">• {item.name} ({item.selectedSize}) x{item.quantity}</p>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDetailOrderId(ord.id)} className="px-3 py-2 bg-neutral-900 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-neutral-700 transition" title="Lihat detail pesanan">
                    <ReceiptText size={12} /> Detail
                  </button>
                  <select value={ord.status} onChange={(e) => handleUpdateStatus(ord.id, e.target.value as OrderStatus)} className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-2.5 text-sm font-semibold text-neutral-900 focus:outline-none flex-1">
                    <option value="Menunggu Pembayaran">Menunggu</option>
                    <option value="Diverifikasi">Diverifikasi</option>
                    <option value="Sedang Diproduksi">Diproduksi</option>
                    <option value="Siap Diambil/Dikirim">Siap Kirim</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                  {ord.paymentProofUrl ? (
                    <button onClick={() => setViewProofUrl({ url: ord.paymentProofUrl!, title: "Bukti Transfer" })} className="px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-neutral-200 transition">
                      <Eye size={12} /> Bukti TF
                    </button>
                  ) : null}
                  {tickets[ord.id] && tickets[ord.id].verificationFileUrl && tickets[ord.id].verificationFileUrl !== "-" ? (
                    <button onClick={() => setViewProofUrl({ url: tickets[ord.id].verificationFileUrl, title: tickets[ord.id].verificationType === "SKL" ? "Bukti SKL" : "Kartu Pelajar" })} className="px-3 py-2 bg-primary-container/20 text-primary rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-primary-container/40 transition">
                      <GraduationCap size={12} /> {tickets[ord.id].verificationType === "SKL" ? "SKL" : "Kartu Pelajar"}
                    </button>
                  ) : null}
                  <button onClick={() => setOrderToDelete(ord)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-red-100 transition ml-auto">
                    <Trash2 size={12} /> Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-700">
            <thead className="bg-neutral-50 text-[10px] text-neutral-400 border-b border-neutral-100">
              <tr>
                <th className="p-3">ID & Tanggal</th>
                <th className="p-3">Pemesan</th>
                <th className="p-3">Alamat/Kelas</th>
                <th className="p-3">Item</th>
                <th className="p-3">Total</th>
                <th className="p-3">Bukti</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-400">Tidak ada pesanan.</td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-neutral-50/50 transition">
                    <td className="p-3">
                      <p className="font-bold text-neutral-900">{ord.id}</p>
                      <p className="text-[10px] text-neutral-400">
                        {new Date(ord.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </p>
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-neutral-900">{ord.customerName}</p>
                      <p className="text-[11px] text-neutral-400">{ord.phone}</p>
                    </td>
                    <td className="p-3 max-w-[160px]">
                      <p className="truncate text-neutral-600" title={ord.addressOrClass}>{ord.addressOrClass}</p>
                    </td>
                    <td className="p-3">
                      {ord.items.map((item, idx) => (
                        <p key={idx} className="text-[11px] text-neutral-600">• {item.name} ({item.selectedSize}) x{item.quantity}</p>
                      ))}
                    </td>
                    <td className="p-3 font-bold text-neutral-900">Rp {ord.totalPrice.toLocaleString("id-ID")}</td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1.5">
                        {ord.paymentProofUrl ? (
                          <button onClick={() => setViewProofUrl({ url: ord.paymentProofUrl!, title: "Bukti Transfer" })} className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-neutral-200 transition w-full">
                            <Eye size={11} /> TF
                          </button>
                        ) : (
                          <span className="text-[10px] text-neutral-400 text-center block">WA Direct</span>
                        )}
                        {tickets[ord.id] && tickets[ord.id].verificationFileUrl && tickets[ord.id].verificationFileUrl !== "-" ? (
                          <button onClick={() => setViewProofUrl({ url: tickets[ord.id].verificationFileUrl, title: tickets[ord.id].verificationType === "SKL" ? "Bukti SKL" : "Kartu Pelajar" })} className="px-3 py-1.5 bg-primary-container/20 text-primary rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-primary-container/40 transition w-full">
                            <GraduationCap size={11} /> {tickets[ord.id].verificationType === "SKL" ? "SKL" : "Pelajar"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-3">
                      <select value={ord.status} onChange={(e) => handleUpdateStatus(ord.id, e.target.value as OrderStatus)} className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-2.5 text-sm font-semibold text-neutral-900 focus:outline-none">
                        <option value="Menunggu Pembayaran">Menunggu</option>
                        <option value="Diverifikasi">Diverifikasi</option>
                        <option value="Sedang Diproduksi">Diproduksi</option>
                        <option value="Siap Diambil/Dikirim">Siap Kirim</option>
                        <option value="Selesai">Selesai</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button onClick={() => setDetailOrderId(ord.id)} className="p-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 transition inline-flex items-center justify-center" title="Lihat detail pesanan">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => setOrderToDelete(ord)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition inline-flex items-center justify-center" title="Hapus Pesanan">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tiket Alumni Section */}
      <div className="space-y-3 mt-6">
        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <GraduationCap size={16} /> Tiket Alumni ({Object.keys(tickets).length})
        </h3>

        {/* Mobile */}
        <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden md:hidden">
          <div className="divide-y divide-neutral-50">
            {Object.values(tickets).length === 0 ? (
              <p className="p-8 text-center text-neutral-400 text-xs">Tidak ada tiket alumni.</p>
            ) : (
              Object.values(tickets).map((t) => (
                <div key={t.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-neutral-900 text-sm truncate">{t.id}</p>
                      <p className="text-[10px] text-neutral-400">Order: {t.orderId} • {new Date(t.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${t.status === "VERIFIED" ? "bg-emerald-100 text-emerald-700" : t.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {t.status === "VERIFIED" ? "Terverifikasi" : t.status === "REJECTED" ? "Ditolak" : "Menunggu"}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900 text-xs">{t.bundleName}</p>
                    <p className="text-[11px] text-neutral-500">{t.bundleItems.map((b) => `${b.name} x${b.quantity}`).join(", ")}</p>
                    <p className="text-[11px] text-neutral-400 mt-1">Tahun Lulus: {t.graduationYear} • {t.verificationType === "SKL" ? "SKL" : "Kartu Pelajar"}</p>
                    {t.userEmail && <p className="text-[11px] text-neutral-400">{t.userEmail}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {t.verificationFileUrl && t.verificationFileUrl !== "-" ? (
                      <button onClick={() => setViewProofUrl({ url: t.verificationFileUrl, title: t.verificationType === "SKL" ? "Bukti SKL" : "Kartu Pelajar" })} className="px-3 py-2 bg-primary-container/20 text-primary rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-primary-container/40 transition">
                        <GraduationCap size={12} /> Lihat Bukti
                      </button>
                    ) : (
                      <span className="text-[10px] text-neutral-400">Tanpa bukti</span>
                    )}
                    <button onClick={() => setTicketToDelete(t)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-red-100 transition ml-auto">
                      <Trash2 size={12} /> Hapus Tiket
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Desktop */}
        <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-700">
              <thead className="bg-neutral-50 text-[10px] text-neutral-400 border-b border-neutral-100">
                <tr>
                  <th className="p-3">ID Tiket & Tanggal</th>
                  <th className="p-3">Bundle</th>
                  <th className="p-3">Verifikasi</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Bukti</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {Object.values(tickets).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-400">Tidak ada tiket alumni.</td>
                  </tr>
                ) : (
                  Object.values(tickets).map((t) => (
                    <tr key={t.id} className="hover:bg-neutral-50/50 transition">
                      <td className="p-3">
                        <p className="font-bold text-neutral-900">{t.id}</p>
                        <p className="text-[10px] text-neutral-400">Order: {t.orderId}</p>
                        <p className="text-[10px] text-neutral-400">{new Date(t.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</p>
                        {t.userEmail && <p className="text-[10px] text-neutral-400 truncate max-w-[160px]">{t.userEmail}</p>}
                      </td>
                      <td className="p-3 max-w-[200px]">
                        <p className="font-bold text-neutral-900">{t.bundleName}</p>
                        <p className="text-[11px] text-neutral-500 truncate">{t.bundleItems.map((b) => `${b.name} x${b.quantity}`).join(", ")}</p>
                        <p className="text-[10px] text-neutral-400">Lulus: {t.graduationYear}</p>
                      </td>
                      <td className="p-3">
                        <span className="text-[11px] font-medium text-neutral-700">{t.verificationType === "SKL" ? "SKL" : "Kartu Pelajar"}</span>
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${t.status === "VERIFIED" ? "bg-emerald-100 text-emerald-700" : t.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                          {t.status === "VERIFIED" ? "Terverifikasi" : t.status === "REJECTED" ? "Ditolak" : "Menunggu"}
                        </span>
                      </td>
                      <td className="p-3">
                        {t.verificationFileUrl && t.verificationFileUrl !== "-" ? (
                          <button onClick={() => setViewProofUrl({ url: t.verificationFileUrl, title: t.verificationType === "SKL" ? "Bukti SKL" : "Kartu Pelajar" })} className="px-3 py-1.5 bg-primary-container/20 text-primary rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-primary-container/40 transition">
                            <GraduationCap size={11} /> Lihat
                          </button>
                        ) : (
                          <span className="text-[10px] text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => setTicketToDelete(t)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition inline-flex items-center justify-center" title="Hapus Tiket Alumni">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Detail Modal (tampilan sama seperti cek pesanan pelanggan) */}
      <AdminOrderDetailModal
        order={detailOrder}
        ticket={detailOrder ? tickets[detailOrder.id] ?? null : null}
        onClose={() => setDetailOrderId(null)}
        onStatusChange={handleUpdateStatus}
        onDelete={(ord) => setOrderToDelete(ord)}
        onViewProof={(url, title) => setViewProofUrl({ url, title })}
      />

      {/* Proof Modal */}
      {viewProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
          <div className="bg-white border border-neutral-100 rounded-2xl max-w-lg w-full p-6 relative">
            <button onClick={() => setViewProofUrl(null)} className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-900 bg-neutral-100">
              <X size={16} />
            </button>
            <h4 className="font-bold text-neutral-900 text-sm mb-4 flex items-center gap-2">
              <ImageIcon size={16} /> {viewProofUrl.title}
            </h4>
            <div className="aspect-square rounded-xl overflow-hidden bg-neutral-100 flex items-center justify-center">
              {(viewProofUrl.url.startsWith("data:") || viewProofUrl.url.startsWith("http")) ? (
                <img src={viewProofUrl.url} alt={viewProofUrl.title} className="w-full h-full object-contain" />
              ) : (
                <p className="text-xs text-neutral-400 text-center p-6">Bukti tidak dapat ditampilkan.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Order */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
          <div className="bg-white border border-neutral-100 rounded-2xl max-w-sm w-full p-6 relative">
            <h4 className="font-bold text-neutral-900 text-base mb-2">Konfirmasi Hapus Pesanan</h4>
            <p className="text-sm text-neutral-600 mb-6">
              Apakah Anda yakin ingin menghapus pesanan <strong>{orderToDelete.id}</strong> atas nama <strong>{orderToDelete.customerName}</strong>? Tiket alumni terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 text-sm font-bold text-neutral-700 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition"
              >
                Batal
              </button>
              <button 
                onClick={handleDeleteOrder}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition"
              >
                Hapus Pesanan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Alumni Ticket */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
          <div className="bg-white border border-neutral-100 rounded-2xl max-w-sm w-full p-6 relative">
            <h4 className="font-bold text-neutral-900 text-base mb-2">Konfirmasi Hapus Tiket</h4>
            <p className="text-sm text-neutral-600 mb-6">
              Apakah Anda yakin ingin menghapus tiket alumni <strong>{ticketToDelete.id}</strong> ({ticketToDelete.bundleName}) — Order <strong>{ticketToDelete.orderId}</strong>? Pesanan terkait juga akan dihapus jika ada. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setTicketToDelete(null)}
                className="px-4 py-2 text-sm font-bold text-neutral-700 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition"
              >
                Batal
              </button>
              <button 
                onClick={handleDeleteTicket}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition"
              >
                Hapus Tiket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
