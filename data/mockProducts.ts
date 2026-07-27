import { Product } from "@/types/merch";

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Notebook Dreamora Test",
    category: "Perlengkapan",
    price: 55000,
    description: "Buku catatan hardcover eksklusif dengan jilid ring spiral dan kertas bookpaper 80gsm ramah lingkungan. Dilengkapi sablon timbul logo Dreamora.",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop"
    ],
    stockType: "READY",
    stockCount: 40,
    variants: {
      sizes: ["A5 Hardcover"],
      colors: ["Cream Beige", "Charcoal Gray", "Sage"]
    },
    rating: 4.9,
    soldCount: 84,
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-2",
    name: "Gantungan Kunci Ball & Dice",
    category: "Aksesoris & Stiker",
    price: 15000,
    description: "Gantungan kunci akrilik & logam edisi khusus dengan charm bola 8 dan dadu vintage. Cocok untuk tas, kunci motor, atau dompet.",
    imageUrl: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=800&auto=format&fit=crop",
    stockType: "READY",
    stockCount: 100,
    variants: {
      sizes: ["Standard"],
      colors: ["Silver / Black"]
    },
    rating: 4.8,
    soldCount: 150,
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-3",
    name: "Tumbler Aesthetic Set",
    category: "Perlengkapan",
    price: 30000,
    description: "Botol minum insulated tumbler double-wall stainless steel. Menjaga suhu dingin & panas hingga 12 jam dengan pilihan warna pastel matte.",
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=800&auto=format&fit=crop",
    stockType: "PRE_ORDER",
    stockCount: 25,
    poQuotaTotal: 50,
    poReleaseDate: "2026-08-15",
    variants: {
      sizes: ["500 ml"],
      colors: ["Terracotta", "Off White", "Sky Blue"]
    },
    rating: 5.0,
    soldCount: 35,
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-4",
    name: "Sticker Pack All City",
    category: "Aksesoris & Stiker",
    price: 10000,
    description: "Paket stiker vinyl hologram isi 12 pcs bertema Gala Aksi Siswa & streetwear grafis. Tahan air, tidak berbekas saat dilepas.",
    imageUrl: "https://images.unsplash.com/photo-1572375992501-4b0892d50c69?q=80&w=800&auto=format&fit=crop",
    stockType: "READY",
    stockCount: 200,
    variants: {
      sizes: ["Pack 12 Pcs"],
      colors: ["Multi Variant"]
    },
    rating: 4.9,
    soldCount: 310,
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-5",
    name: "Totebag Canvas Free Mockup",
    category: "Topi & Tas",
    price: 45000,
    description: "Tas kain bahan Kanvas Tebal 14oz ramah lingkungan. Muat laptop 15 inch, kantong dalam berdinding resleting ganda.",
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop",
    stockType: "READY",
    stockCount: 30,
    variants: {
      sizes: ["38 x 42 cm"],
      colors: ["Natural White", "Midnight Black"]
    },
    rating: 4.8,
    soldCount: 95,
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-6",
    name: "Kipas Lipat Vintage Pattern",
    category: "Aksesoris & Stiker",
    price: 25000,
    description: "Kipas angin lipat genggam bambu alami berbalut kain sutra dengan corak ukiran etnik Gala Aksi Siswa SMKN 3 Jepara.",
    imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop",
    stockType: "READY",
    stockCount: 50,
    variants: {
      sizes: ["21 cm"],
      colors: ["Wood Brown", "Sepia Gold"]
    },
    rating: 4.7,
    soldCount: 60,
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-7",
    name: "Cermin Aesthetic Frame Emas",
    category: "Perlengkapan",
    price: 65000,
    description: "Cermin ukir bergaya baroque klasik warna emas antik. Cocok sebagai hiasan meja rias maupun suvenir kenang-kenangan eksklusif.",
    imageUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800&auto=format&fit=crop",
    stockType: "PRE_ORDER",
    stockCount: 15,
    poQuotaTotal: 30,
    poReleaseDate: "2026-08-20",
    variants: {
      sizes: ["Medium (25cm)"],
      colors: ["Antique Gold", "Vintage Bronze"]
    },
    rating: 4.9,
    soldCount: 18,
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-8",
    name: "Kaos Oversized Gala Aksi Siswa",
    category: "Topi & Tas",
    price: 120000,
    description: "Kaos Combed 24s Cotton Premium Boxy Fit. Sablon Plastisol berkualitas tinggi edisi Dies Natalis GALAKSI XII.",
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop",
    stockType: "PRE_ORDER",
    stockCount: 28,
    poQuotaTotal: 60,
    poReleaseDate: "2026-08-28",
    variants: {
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["Off White", "Washed Black", "Vintage Sage"]
    },
    rating: 5.0,
    soldCount: 42,
    createdAt: new Date().toISOString()
  }
];
