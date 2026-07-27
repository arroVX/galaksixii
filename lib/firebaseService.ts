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
