// Konstanta & konfigurasi global aplikasi.

// Tanggal pembukaan GALAKSI XII (WIB). Ubah di sini saat jadwal berubah.
export const EVENT_DATE = new Date("2026-09-01T08:00:00+07:00");

const ADMIN_EMAILS_ENV = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "admin@galamerch.com";

export const ADMIN_EMAILS: string[] = ADMIN_EMAILS_ENV.split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const isAdminEmail = (email?: string | null): boolean =>
  Boolean(email) && ADMIN_EMAILS.includes(email!.trim().toLowerCase());
