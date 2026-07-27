"use client";

import React, { useState, useEffect } from "react";
import { Product, Order, OrderStatus, StockType } from "@/types/merch";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Package, 
  TrendingUp, 
  Users, 
  Eye, 
  Image as ImageIcon,
  Save,
  X,
  Sparkles,
  Filter,
  DollarSign,
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Search
} from "lucide-react";

interface AdminDashboardProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ products, setProducts }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders">("overview");
  const [orders, setOrders] = useState<Order[]>([]);

  // Product Form Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Perlengkapan");
  const [price, setPrice] = useState<number>(30000);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [stockType, setStockType] = useState<StockType>("READY");
  const [stockCount, setStockCount] = useState<number>(30);
  const [poReleaseDate, setPoReleaseDate] = useState("2026-08-25");
  const [poQuotaTotal, setPoQuotaTotal] = useState<number>(50);
  const [sizesInput, setSizesInput] = useState("Standard");
  const [colorsInput, setColorsInput] = useState("Cream, Pastel Blue");

  // Proof Modal State
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    // 1. Load from localStorage first for instant display
    const savedOrders = localStorage.getItem("gala_merch_orders");
    let initialOrders: Order[] = [];
    if (savedOrders) {
      try {
        initialOrders = JSON.parse(savedOrders);
        setOrders(initialOrders);
      } catch (e) {
        console.error(e);
      }
    } else {
      const seedOrder: Order = {
        id: "ORD-114309",
        userId: "user-budi",
        userEmail: "budi@gmail.com",
        customerName: "Budi Santoso",
        phone: "081234567890",
        addressOrClass: "Kelas XII MIPA 2 / SMKN 3 Jepara",
        notes: "Titip di pos satpam",
        items: [
          {
            productId: "prod-2",
            name: "GALA Vintage Heavyweight T-Shirt",
            price: 159000,
            selectedSize: "S",
            selectedColor: "Washed Black",
            quantity: 2,
            imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop",
            stockType: "READY"
          }
        ],
        subtotal: 318000,
        shippingFee: 0,
        totalPrice: 318000,
        paymentMethod: "BANK_TRANSFER_QRIS",
        status: "Diverifikasi",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      initialOrders = [seedOrder];
      setOrders(initialOrders);
      localStorage.setItem("gala_merch_orders", JSON.stringify(initialOrders));
    }

    // 2. Asynchronously sync latest orders from Firebase (Firestore + Realtime DB)
    const loadFirebaseOrders = async () => {
      try {
        const { fetchOrdersFromFirebase } = await import("@/lib/firebaseService");
        const fbOrders = await fetchOrdersFromFirebase();
        if (fbOrders.length > 0) {
          const map = new Map<string, Order>();
          initialOrders.forEach((o) => map.set(o.id, o));
          fbOrders.forEach((o) => map.set(o.id, o));
          const combined = Array.from(map.values());
          combined.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setOrders(combined);
          localStorage.setItem("gala_merch_orders", JSON.stringify(combined));
        }
      } catch (err) {
        console.warn("Failed to fetch orders from Firebase:", err);
      }
    };

    loadFirebaseOrders();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName("");
    setCategory("Perlengkapan");
    setPrice(35000);
    setDescription("Produk merchandise eksklusif edisi terbatas.");
    setImageUrl("https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop");
    setStockType("READY");
    setStockCount(50);
    setPoReleaseDate("2026-08-30");
    setPoQuotaTotal(50);
    setSizesInput("Standard");
    setColorsInput("White, Black");
    setIsProductModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setPrice(p.price);
    setDescription(p.description);
    setImageUrl(p.imageUrl);
    setStockType(p.stockType);
    setStockCount(p.stockCount);
    setPoReleaseDate(p.poReleaseDate || "2026-08-30");
    setPoQuotaTotal(p.poQuotaTotal || 50);
    setSizesInput(p.variants.sizes.join(", "));
    setColorsInput(p.variants.colors.join(", "));
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    const sizes = sizesInput.split(",").map((s) => s.trim()).filter(Boolean);
    const colors = colorsInput.split(",").map((c) => c.trim()).filter(Boolean);

    if (editingProduct) {
      const updatedList = products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              name,
              category,
              price: Number(price),
              description,
              imageUrl,
              images: [imageUrl],
              stockType,
              stockCount: Number(stockCount),
              poReleaseDate: stockType === "PRE_ORDER" ? poReleaseDate : undefined,
              poQuotaTotal: stockType === "PRE_ORDER" ? Number(poQuotaTotal) : undefined,
              variants: { sizes, colors }
            }
          : p
      );
      setProducts(updatedList);
      localStorage.setItem("gala_merch_products", JSON.stringify(updatedList));
    } else {
      const newProd: Product = {
        id: "prod-" + Date.now(),
        name,
        category,
        price: Number(price),
        description,
        imageUrl,
        images: [imageUrl],
        stockType,
        stockCount: Number(stockCount),
        poReleaseDate: stockType === "PRE_ORDER" ? poReleaseDate : undefined,
        poQuotaTotal: stockType === "PRE_ORDER" ? Number(poQuotaTotal) : undefined,
        variants: { sizes, colors },
        rating: 5.0,
        soldCount: 0,
        createdAt: new Date().toISOString()
      };
      const newList = [newProd, ...products];
      setProducts(newList);
      localStorage.setItem("gala_merch_products", JSON.stringify(newList));
      
      try {
        const { syncProductToFirebase } = require("@/lib/firebaseService");
        syncProductToFirebase(newProd);
      } catch (err) {
        console.warn(err);
      }
    }

    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus merchandise ini?")) {
      const newList = products.filter((p) => p.id !== productId);
      setProducts(newList);
      localStorage.setItem("gala_merch_products", JSON.stringify(newList));
    }
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o));
    setOrders(updated);
    localStorage.setItem("gala_merch_orders", JSON.stringify(updated));

    const targetOrder = updated.find((o) => o.id === orderId);
    if (targetOrder) {
      try {
        const { syncOrderToFirebase } = require("@/lib/firebaseService");
        syncOrderToFirebase(targetOrder);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const totalRevenue = orders.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalItemsSold = orders.reduce((acc, curr) => acc + curr.items.reduce((s, i) => s + i.quantity, 0), 0);
  const poProductsCount = products.filter((p) => p.stockType === "PRE_ORDER").length;

  const filteredOrders = orderStatusFilter === "ALL" 
    ? orders 
    : orders.filter((o) => o.status === orderStatusFilter);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6 animate-in fade-in">
      
      {/* Outer Tablet-Style Container (Exact Reference Palette: Neutral Warm Beige #EDECE7) */}
      <div className="bg-[#EDECE7] border border-slate-300 rounded-[2.5rem] p-4 sm:p-8 shadow-2xl relative text-slate-900 space-y-6">
        
        {/* TOP CONTROL BAR (Tablet Header) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-300/80 pb-4">
          
          {/* Left Title & Exit Capsule */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-800 text-sm shadow-sm cursor-pointer hover:bg-slate-100">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif-title tracking-tight text-slate-900">
                Merchandise Analytics
              </h2>
              <span className="text-[11px] font-mono text-slate-500 font-semibold">
                DREAMORA GALAKSI XII • SMKN 3 JEPARA
              </span>
            </div>
          </div>

          {/* Top Pill Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === "overview"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
              }`}
            >
              📊 Overview Dynamics
            </button>

            <button
              onClick={() => setActiveTab("products")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === "products"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
              }`}
            >
              🛍️ Merchandise ({products.length})
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === "orders"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
              }`}
            >
              📋 Transaksi ({orders.length})
            </button>
          </div>
        </div>

        {/* ADMIN PROFILE & METRICS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Admin Avatar Card (3 cols) */}
          <div className="lg:col-span-4 bg-white/90 rounded-3xl p-4 border border-slate-300/80 shadow-sm flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
              alt="Admin"
              className="w-14 h-14 rounded-2xl object-cover border border-slate-300 shadow-sm shrink-0"
            />
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Pengelola Resmi</span>
              <h4 className="font-bold text-slate-900 text-sm font-serif-title">Admin Merchandise</h4>
              <p className="text-[11px] text-slate-500 font-medium">Panitia Dies Natalis SMKN 3 Jepara</p>
            </div>
          </div>

          {/* Metrics Pill Grid (8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            <div className="bg-white/90 p-3.5 rounded-3xl border border-slate-300/80 shadow-sm text-center">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Status Sistem</span>
              <span className="text-sm font-extrabold text-slate-900 block mt-0.5 font-serif-title">Batch PO Active</span>
              <span className="text-[10px] text-emerald-600 font-bold">● Synchronized</span>
            </div>

            <div className="bg-white/90 p-3.5 rounded-3xl border border-slate-300/80 shadow-sm text-center">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Pendapatan Total</span>
              <span className="text-sm font-extrabold text-slate-900 block mt-0.5 font-serif-title">
                Rp {totalRevenue.toLocaleString("id-ID")}
              </span>
              <span className="text-[10px] text-slate-500 font-bold">+15% vs target</span>
            </div>

            <div className="bg-white/90 p-3.5 rounded-3xl border border-slate-300/80 shadow-sm text-center">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Item Terjual</span>
              <span className="text-sm font-extrabold text-slate-900 block mt-0.5 font-serif-title">
                {totalItemsSold} Pcs
              </span>
              <span className="text-[10px] text-indigo-600 font-bold">{poProductsCount} Item PO</span>
            </div>

            <div className="bg-white/90 p-3.5 rounded-3xl border border-slate-300/80 shadow-sm text-center">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Total Transaksi</span>
              <span className="text-sm font-extrabold text-slate-900 block mt-0.5 font-serif-title">
                {orders.length} Order
              </span>
              <span className="text-[10px] text-amber-600 font-bold">Verifikasi Real-time</span>
            </div>

          </div>
        </div>

        {/* TIMELINE CONNECTOR NODES & WIDGET FLOW GRID */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            
            {/* Timeline Curved Node Bar (Matches Reference Image Flow Lines) */}
            <div className="relative bg-white/70 rounded-3xl p-4 border border-slate-300/80 flex items-center justify-between overflow-x-auto text-xs">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-sm">
                  🟡
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Aug W1</span>
                  <span className="text-[10px] text-slate-500">Peluncuran PO Batch 1</span>
                </div>
              </div>

              <div className="hidden sm:block h-0.5 flex-1 bg-slate-300 mx-4 border-t border-dashed border-slate-400" />

              <div className="flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  ✔️
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Aug W3</span>
                  <span className="text-[10px] text-slate-500">Batas Pengumpulan PO</span>
                </div>
              </div>

              <div className="hidden sm:block h-0.5 flex-1 bg-slate-300 mx-4 border-t border-dashed border-slate-400" />

              <div className="flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  🚀
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Sep W1</span>
                  <span className="text-[10px] text-slate-500">Pengambilan Suvenir</span>
                </div>
              </div>

              <button
                onClick={openCreateModal}
                className="ml-4 w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 shadow-md transition shrink-0"
                title="Tambah Node / Barang Baru"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Middle Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Card A: Performa Produk & Stok Bar Graphs */}
              <div className="bg-white rounded-3xl p-5 border border-slate-300/80 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm font-serif-title flex items-center gap-2">
                    <BarChart3 size={16} className="text-slate-900" /> Performa Penjualan Produk
                  </h3>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-mono text-slate-600 font-bold">
                    Top 5 Items
                  </span>
                </div>

                <div className="space-y-3">
                  {products.slice(0, 4).map((p) => {
                    const pct = Math.min(100, Math.round(((p.soldCount || 10) / 100) * 100));

                    return (
                      <div key={p.id} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 truncate max-w-[200px]">{p.name}</span>
                          <span className="font-mono text-slate-500 text-[11px] font-bold">
                            Rp {p.price.toLocaleString("id-ID")} ({p.stockCount} Stok)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-900 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card B: Real-Time Order Flow Nodes */}
              <div className="bg-white rounded-3xl p-5 border border-slate-300/80 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm font-serif-title flex items-center gap-2">
                    <Activity size={16} className="text-slate-900" /> Flow Status Transaksi Masuk
                  </h3>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="text-[11px] text-slate-700 font-bold hover:underline"
                  >
                    Kelola Semua ({orders.length}) →
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {orders.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">Belum ada transaksi.</p>
                  ) : (
                    orders.map((ord) => (
                      <div key={ord.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                        <div>
                          <p className="font-mono font-bold text-slate-900">{ord.id} - {ord.customerName}</p>
                          <p className="text-[10px] text-slate-500">
                            {ord.items.map((i) => i.name).join(", ")}
                          </p>
                        </div>

                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                          className="bg-white border border-slate-300 rounded-xl px-2 py-1 text-[11px] font-bold text-slate-900 focus:outline-none"
                        >
                          <option value="Menunggu Pembayaran">Menunggu</option>
                          <option value="Diverifikasi">Diverifikasi</option>
                          <option value="Sedang Diproduksi">Diproduksi</option>
                          <option value="Siap Diambil/Dikirim">Siap Kirim</option>
                          <option value="Selesai">Selesai</option>
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB: MANAJEMEN PRODUK */}
        {activeTab === "products" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base font-serif-title flex items-center gap-2">
                <Package size={18} /> Katalog Merchandise Store ({products.length})
              </h3>

              <button
                onClick={openCreateModal}
                className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition"
              >
                <Plus size={16} /> + Tambah Merchandise Baru
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-white rounded-3xl border border-slate-300/80 p-4 flex flex-col justify-between gap-4 shadow-sm">
                  <div className="flex gap-3">
                    <img src={p.imageUrl} alt={p.name} className="w-20 h-20 rounded-2xl object-cover bg-slate-100 border border-slate-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {p.stockType === "PRE_ORDER" ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-full border border-amber-300">
                            Pre-Order
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-bold rounded-full border border-emerald-300">
                            Ready Stock
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono uppercase">{p.category}</span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm font-serif-title truncate">{p.name}</h4>
                      <p className="text-xs font-bold text-slate-900 font-serif-title mt-0.5">
                        Rp {p.price.toLocaleString("id-ID")}
                      </p>

                      <p className="text-[11px] text-slate-500 mt-1 font-mono">
                        Stok/Kuota: <span className="text-slate-900 font-bold">{p.stockCount} Pcs</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex gap-1">
                      {p.variants.sizes.map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-slate-100 text-[9px] font-bold text-slate-600 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition"
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: MANAJEMEN PESANAN */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-slate-900 text-base font-serif-title flex items-center gap-2">
                <TrendingUp size={18} /> Pengelolaan Pesanan & Verifikasi ({orders.length})
              </h3>

              <div className="flex items-center gap-2 overflow-x-auto">
                <Filter size={14} className="text-slate-400 shrink-0" />
                {["ALL", "Menunggu Pembayaran", "Diverifikasi", "Sedang Diproduksi", "Siap Diambil/Dikirim", "Selesai"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                      orderStatusFilter === st
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {st === "ALL" ? "Semua Status" : st}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-300 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 uppercase font-mono text-[10px] text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-4">ID & Tanggal</th>
                      <th className="p-4">Pemesan</th>
                      <th className="p-4">Alamat / Kelas</th>
                      <th className="p-4">Item Dipesan</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">Bukti Bayar</th>
                      <th className="p-4">Status Pesanan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-mono">
                          Tidak ada transaksi ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-4 font-mono">
                            <p className="font-bold text-slate-900">{ord.id}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(ord.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                            </p>
                          </td>

                          <td className="p-4">
                            <p className="font-bold text-slate-900">{ord.customerName}</p>
                            <p className="text-[11px] text-slate-500">{ord.phone}</p>
                          </td>

                          <td className="p-4 max-w-xs">
                            <p className="truncate text-slate-700" title={ord.addressOrClass}>
                              {ord.addressOrClass}
                            </p>
                          </td>

                          <td className="p-4">
                            <div className="space-y-1">
                              {ord.items.map((item, idx) => (
                                <p key={idx} className="font-medium text-slate-800 text-[11px]">
                                  • {item.name} ({item.selectedSize}) x{item.quantity}
                                </p>
                              ))}
                            </div>
                          </td>

                          <td className="p-4 font-extrabold text-slate-900 font-serif-title">
                            Rp {ord.totalPrice.toLocaleString("id-ID")}
                          </td>

                          <td className="p-4">
                            {ord.paymentProofUrl ? (
                              <button
                                onClick={() => setViewProofUrl(ord.paymentProofUrl || null)}
                                className="px-3 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-full text-[10px] font-bold flex items-center gap-1 hover:bg-slate-200 transition"
                              >
                                <Eye size={12} /> Lihat Bukti
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">WA Direct</span>
                            )}
                          </td>

                          <td className="p-4">
                            <select
                              value={ord.status}
                              onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                              className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-bold"
                            >
                              <option value="Menunggu Pembayaran">Menunggu</option>
                              <option value="Diverifikasi">Diverifikasi</option>
                              <option value="Sedang Diproduksi">Diproduksi</option>
                              <option value="Siap Diambil/Dikirim">Siap Kirim</option>
                              <option value="Selesai">Selesai</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* FLOATING BOTTOM CONTROL DOCK (Exact Reference Image Style) */}
        <div className="sticky bottom-4 z-30 max-w-xl mx-auto bg-slate-900/95 backdrop-blur-md text-white rounded-full p-2.5 px-4 shadow-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] font-bold">2026 • AUG / SEP DYNAMICS</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openCreateModal}
              className="px-3.5 py-1.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5 shadow-md transition"
            >
              <Plus size={14} />
              <span>+ Merchandise</span>
            </button>
          </div>
        </div>

      </div>

      {/* MODAL 1: Product Form (Create / Edit) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative my-8 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base font-serif-title">
                {editingProduct ? "Edit Merchandise" : "Tambah Merchandise Baru"}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  >
                    <option value="Perlengkapan">Perlengkapan</option>
                    <option value="Aksesoris & Stiker">Aksesoris & Stiker</option>
                    <option value="Topi & Tas">Topi & Tas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Harga (IDR) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Deskripsi Produk</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Foto Produk *</label>
                <div className="flex gap-3 items-center">
                  {imageUrl && (
                    <img src={imageUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImageUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700">Sistem Penjualan:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="radio"
                      name="stockType"
                      checked={stockType === "READY"}
                      onChange={() => setStockType("READY")}
                      className="accent-slate-900"
                    />
                    <span>Ready Stock</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="radio"
                      name="stockType"
                      checked={stockType === "PRE_ORDER"}
                      onChange={() => setStockType("PRE_ORDER")}
                      className="accent-slate-900"
                    />
                    <span className="font-bold text-slate-900">Pre-Order (PO)</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-600 mb-1">
                      {stockType === "PRE_ORDER" ? "Sisa Kuota PO" : "Stok Tersedia"}
                    </label>
                    <input
                      type="number"
                      value={stockCount}
                      onChange={(e) => setStockCount(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900"
                    />
                  </div>

                  {stockType === "PRE_ORDER" && (
                    <div>
                      <label className="block text-slate-600 mb-1">Estimasi Tgl Rilis</label>
                      <input
                        type="date"
                        value={poReleaseDate}
                        onChange={(e) => setPoReleaseDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Save size={14} /> Simpan Merchandise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: View Payment Proof */}
      {viewProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 relative text-slate-900">
            <button
              onClick={() => setViewProofUrl(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-full bg-slate-100"
            >
              <X size={18} />
            </button>
            <h4 className="font-bold text-slate-900 text-base font-serif-title mb-4 flex items-center gap-2">
              <ImageIcon size={18} className="text-slate-900" /> Bukti Transfer Pelanggan
            </h4>
            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img src={viewProofUrl} alt="Bukti Transfer" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
