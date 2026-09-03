"use client";

import { useState, useEffect } from "react";
import { AlumniTicket, AlumniTicketBundle } from "@/types/merch";
import { fetchAlumniTicketsForUser } from "@/lib/firebaseService";

const TICKETS_STORAGE_KEY = "gala_alumni_tickets";
const TICKET_LIMIT_ACK_KEY = "gala_ticket_limit_ack";

/** Sudah pernah konfirmasi batas 1 tiket di sesi ini? (hanya dibaca dari handler). */
export function hasTicketLimitAck(): boolean {
  try {
    return sessionStorage.getItem(TICKET_LIMIT_ACK_KEY) === "1";
  } catch {
    return false;
  }
}

/** Tandai sudah konfirmasi batas 1 tiket untuk sesi ini (hanya dipanggil dari handler). */
export function ackTicketLimit(): void {
  try {
    sessionStorage.setItem(TICKET_LIMIT_ACK_KEY, "1");
  } catch { /* abaikan */ }
}

function readLocalTickets(userId?: string | null, userEmail?: string | null): AlumniTicket[] {
  if (typeof window === "undefined") return [];
  if (!userId && !userEmail) return [];
  try {
    const saved = localStorage.getItem(TICKETS_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved) as AlumniTicket[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t) => (userId && t.userId === userId) || (userEmail && t.userEmail === userEmail)
    );
  } catch {
    return [];
  }
}

/**
 * Tentukan apakah sebuah record tiket dihitung sebagai "pembelian tiket"
 * yang menghalangi pembelian berikutnya (aturan 1 akun = 1 tiket).
 * Record lama tanpa penanda dirujuk ke daftar bundle; bila bundle-nya pun
 * tak dikenal, diperlakukan ketat sebagai tiket.
 */
export function isTicketPurchase(
  ticket: AlumniTicket,
  bundlesById: Map<string, AlumniTicketBundle>
): boolean {
  if (typeof ticket.isTicketBundle === "boolean") return ticket.isTicketBundle;
  const bundle = bundlesById.get(ticket.bundleId);
  if (bundle) return (bundle.isAlumniOnly ?? true) !== false;
  return true;
}

/** Kembalikan tiket penghambat pertama (bila ada) dari daftar tiket user. */
export function findBlockingTicket(
  tickets: AlumniTicket[],
  bundles: AlumniTicketBundle[]
): AlumniTicket | null {
  const bundlesById = new Map(bundles.map((b) => [b.id, b]));
  return tickets.find((t) => isTicketPurchase(t, bundlesById)) ?? null;
}

/**
 * Daftar tiket alumni milik satu akun: instan dari cache lokal,
 * lalu dimerge dengan Firebase sebagai sumber kebenaran.
 */
export function useUserTickets(
  userId?: string | null,
  userEmail?: string | null
): { tickets: AlumniTicket[]; loading: boolean } {
  const [tickets, setTickets] = useState<AlumniTicket[]>(() =>
    readLocalTickets(userId, userEmail)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId && !userEmail) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset saat logout (sumber auth eksternal)
      setTickets([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchAlumniTicketsForUser(userId, userEmail)
      .then((fbTickets) => {
        if (cancelled) return;
        const map = new Map<string, AlumniTicket>();
        for (const t of readLocalTickets(userId, userEmail)) map.set(t.id, t);
        for (const t of fbTickets) {
          if ((userId && t.userId === userId) || (userEmail && t.userEmail === userEmail)) {
            map.set(t.id, t);
          }
        }
        const merged = Array.from(map.values());
        setTickets(merged);
        try {
          const saved = localStorage.getItem(TICKETS_STORAGE_KEY);
          const all: AlumniTicket[] = saved ? JSON.parse(saved) : [];
          const others = Array.isArray(all)
            ? all.filter(
                (t) =>
                  !((userId && t.userId === userId) || (userEmail && t.userEmail === userEmail))
              )
            : [];
          localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify([...merged, ...others]));
        } catch { /* abaikan */ }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, userEmail]);

  return { tickets, loading };
}
