import { db, rtdb } from "./firebase";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { ref, set, get, child } from "firebase/database";
import { Order, Product } from "@/types/merch";

/**
 * Menyimpan / Menyinkronkan pesanan baru atau pembaruan status pesanan
 * secara langsung ke Firebase Realtime Database DAN Cloud Firestore!
 */
export async function syncOrderToFirebase(order: Order) {
  // 1. Simpan ke Firebase Realtime Database (RTDB)
  try {
    const orderRef = ref(rtdb, `orders/${order.id}`);
    await set(orderRef, order);
    console.log(`✓ Order ${order.id} berhasil terkirim ke Realtime Database`);
  } catch (err) {
    console.warn("Peringatan RTDB Sync Order:", err);
  }

  // 2. Simpan ke Cloud Firestore Database
  try {
    const docRef = doc(db, "orders", order.id);
    await setDoc(docRef, order);
    console.log(`✓ Order ${order.id} berhasil terkirim ke Cloud Firestore`);
  } catch (err) {
    console.warn("Peringatan Firestore Sync Order:", err);
  }
}

/**
 * Menyimpan / Menyinkronkan produk merchandise ke Firebase
 */
export async function syncProductToFirebase(product: Product) {
  // 1. Simpan ke Realtime Database
  try {
    const prodRef = ref(rtdb, `products/${product.id}`);
    await set(prodRef, product);
    console.log(`✓ Produk ${product.id} terkirim ke Realtime Database`);
  } catch (err) {
    console.warn("Peringatan RTDB Sync Product:", err);
  }

  // 2. Simpan ke Firestore
  try {
    const docRef = doc(db, "products", product.id);
    await setDoc(docRef, product);
    console.log(`✓ Produk ${product.id} terkirim ke Cloud Firestore`);
  } catch (err) {
    console.warn("Peringatan Firestore Sync Product:", err);
  }
}

/**
 * Mengambil seluruh data transaksi pesanan dari Cloud Firestore & Realtime Database
 */
export async function fetchOrdersFromFirebase(): Promise<Order[]> {
  const ordersMap = new Map<string, Order>();

  // 1. Ambil dari Firestore
  try {
    const querySnapshot = await getDocs(collection(db, "orders"));
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Order;
      if (data && data.id) {
        ordersMap.set(data.id, data);
      }
    });
  } catch (err) {
    console.warn("Firestore fetch orders error:", err);
  }

  // 2. Ambil dari Realtime Database
  try {
    const dbRef = ref(rtdb);
    const snapshot = await get(child(dbRef, "orders"));
    if (snapshot.exists()) {
      const rtdbOrders = snapshot.val();
      Object.keys(rtdbOrders).forEach((id) => {
        const item = rtdbOrders[id] as Order;
        if (item && item.id && !ordersMap.has(item.id)) {
          ordersMap.set(item.id, item);
        }
      });
    }
  } catch (err) {
    console.warn("RTDB fetch orders error:", err);
  }

  const result = Array.from(ordersMap.values());
  result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return result;
}

/**
 * Mengambil seluruh data produk dari Cloud Firestore & Realtime Database
 */
export async function fetchProductsFromFirebase(): Promise<Product[]> {
  const productsMap = new Map<string, Product>();

  // 1. Ambil dari Firestore
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Product;
      if (data && data.id) {
        productsMap.set(data.id, data);
      }
    });
  } catch (err) {
    console.warn("Firestore fetch products error:", err);
  }

  // 2. Ambil dari Realtime Database
  try {
    const dbRef = ref(rtdb);
    const snapshot = await get(child(dbRef, "products"));
    if (snapshot.exists()) {
      const rtdbProducts = snapshot.val();
      Object.keys(rtdbProducts).forEach((id) => {
        const item = rtdbProducts[id] as Product;
        if (item && item.id && !productsMap.has(item.id)) {
          productsMap.set(item.id, item);
        }
      });
    }
  } catch (err) {
    console.warn("RTDB fetch products error:", err);
  }

  return Array.from(productsMap.values());
}
