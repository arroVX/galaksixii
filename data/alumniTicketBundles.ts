import { AlumniTicketBundle } from "@/types/merch";

export const ALUMNI_TICKET_BUNDLES: AlumniTicketBundle[] = [
  {
    id: "ticket-alumni-bundle-1",
    name: "Tiket Alumni + Kaos Oversized Gala Aksi Siswa",
    description: "Tiket masuk khusus alumni SMK + Kaos Combed 24s Cotton Premium Boxy Fit edisi Dies Natalis GALAKSI XII",
    ticketPrice: 150000,
    merchProductId: "prod-8",
    totalPrice: 270000,
    merchVariants: {
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["Off White", "Washed Black", "Vintage Sage"]
    },
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "ticket-alumni-bundle-2",
    name: "Tiket Alumni + Tumbler Aesthetic Set",
    description: "Tiket masuk khusus alumni SMK + Botol minum insulated tumbler double-wall stainless steel 500ml",
    ticketPrice: 150000,
    merchProductId: "prod-3",
    totalPrice: 180000,
    merchVariants: {
      sizes: ["500 ml"],
      colors: ["Terracotta", "Off White", "Sky Blue"]
    },
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "ticket-alumni-bundle-3",
    name: "Tiket Alumni + Totebag Canvas Free Mockup",
    description: "Tiket masuk khusus alumni SMK + Tas kain bahan Kanvas Tebal 14oz ramah lingkungan, muat laptop 15 inch",
    ticketPrice: 150000,
    merchProductId: "prod-5",
    totalPrice: 195000,
    merchVariants: {
      sizes: ["38 x 42 cm"],
      colors: ["Natural White", "Midnight Black"]
    },
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "ticket-alumni-bundle-4",
    name: "Tiket Alumni + Notebook Dreamora Test",
    description: "Tiket masuk khusus alumni SMK + Buku catatan hardcover eksklusif A5 ring spiral kertas bookpaper 80gsm",
    ticketPrice: 150000,
    merchProductId: "prod-1",
    totalPrice: 205000,
    merchVariants: {
      sizes: ["A5 Hardcover"],
      colors: ["Cream Beige", "Charcoal Gray", "Sage"]
    },
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop"
  }
];

export const GRADUATION_YEAR_MIN = 2000;
export const GRADUATION_YEAR_MAX = new Date().getFullYear();
export const MAX_VERIFICATION_FILE_SIZE = 2 * 1024 * 1024; // 2MB
export const ALLOWED_VERIFICATION_FILE_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];