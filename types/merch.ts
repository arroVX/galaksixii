export type StockType = "READY" | "PRE_ORDER";

export type OrderStatus = 
  | "Menunggu Pembayaran"
  | "Diverifikasi"
  | "Sedang Diproduksi"
  | "Siap Diambil/Dikirim"
  | "Selesai"
  | "Dibatalkan";

export type DeliveryMethod = 
  | "PICKUP_AULA_SMKN3"
  | "COD_AREA_JEPARA";

export interface ProductVariant {
  sizes: string[]; // e.g. ["S", "M", "L", "XL", "XXL"]
  colors: string[]; // e.g. ["Black", "Navy", "Cream", "White"]
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  images?: string[];
  stockType: StockType;
  stockCount: number;
  poReleaseDate?: string;
  poQuotaTotal?: number;
  variants: ProductVariant;
  createdAt?: string;
  rating?: number;
  soldCount?: number;
  orderIndex?: number;
}

export interface PageSetting {
  visible: boolean;
  locked: boolean;
}

export interface SiteSettings {
  merchandise: PageSetting;
  tiketAlumni: PageSetting;
  orders: PageSetting;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  stockType: StockType;
  poReleaseDate?: string;
  /** Batas maksimal kuantitas (stok fisik untuk barang READY). */
  maxStock?: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  phone?: string;
  address?: string;
  classGroup?: string;
  role: "user" | "admin";
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  imageUrl: string;
  stockType: StockType;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  customerName: string;
  phone: string;
  addressOrClass: string;
  deliveryMethod?: DeliveryMethod;
  deliveryLocationDetail?: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  totalPrice: number;
  paymentMethod: "COD" | "BANK_TRANSFER_QRIS";
  paymentProofUrl?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  /** Tahapan acara, mis. "Liga Olahraga", "Pentas Seni", "Bazar", "Puncak Acara". */
  category: string;
  /** Tahun edisi dokumentasi, mis. 2024 untuk arsip tahun sebelumnya. */
  year: number;
  /** URL foto; bila kosong, UI menampilkan placeholder. */
  imageUrl?: string;
  caption?: string;
  createdAt?: string;
}

export type AlumniVerificationType = "KARTU_PELAJAR" | "SKL";

export type AlumniTicketStatus = "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";

export interface AlumniTicket {
  id: string;
  orderId: string;
  userId: string;
  verificationType: AlumniVerificationType;
  verificationFileUrl: string;
  graduationYear: number;
  bundleId: string;
  bundleName: string;
  bundleItems: AlumniTicketBundleItem[];
  status: AlumniTicketStatus;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface AlumniTicketBundleItem {
  name: string;
  quantity: number;
  imageUrl?: string;
}

export interface AlumniTicketBundle {
  id: string;
  name: string;
  description: string;
  ticketPrice: number;
  totalPrice: number;
  items: AlumniTicketBundleItem[];
  imageUrl?: string;
  orderIndex?: number;
  isAlumniOnly?: boolean;
}

export interface PageSetting {
  visible: boolean;
  locked: boolean;
}

export interface SiteSettings {
  merchandise: PageSetting;
  tiketAlumni: PageSetting;
  orders: PageSetting;
}
