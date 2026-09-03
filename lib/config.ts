// Konstanta & konfigurasi global aplikasi.

// Tanggal pembukaan GALAKSI XII (WIB). Ubah di sini saat jadwal berubah.
export const EVENT_DATE = new Date("2026-09-01T08:00:00+07:00");

const ADMIN_EMAILS_ENV = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "admin@galamerch.com";

export const ADMIN_EMAILS: string[] = ADMIN_EMAILS_ENV.split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const isAdminEmail = (email?: string | null): boolean =>
  Boolean(email) && ADMIN_EMAILS.includes(email!.trim().toLowerCase());

// Nomor WhatsApp admin untuk tombol "Tanya Admin" (format wa.me tanpa +/spasi/strip).
// +62 858-6874-0035 -> 6285868740035. Ubah di sini jika nomor admin berganti.
export const ADMIN_WA_NUMBER = "6285868740035";
