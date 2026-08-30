import { db, rtdb } from "./firebase";
import { doc, setDoc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore";
import { ref, set, remove, get, child, query as rtdbQuery, orderByChild, equalTo } from "firebase/database";
import { Order, Product, AlumniTicketBundle, GalleryItem, AlumniTicket } from "@/types/merch";
import { ALUMNI_TICKET_BUNDLES } from "@/data/alumniTicketBundles";

/**
 * Firestore & Realtime Database sama-sama MENOLAK properti bernilai undefined
 * ("Unsupported field value: undefined"). Round-trip JSON membuang semua
 * properti undefined secara aman untuk data polos (tanpa Date/Map/class).
 */
function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export interface SyncResult {
  rtdbOk: boolean;
  firestoreOk: boolean;
}

/** Jalankan operasi tulis dengan beberapa percobaan + jeda antar percobaan. */
async function withRetry(operation: () => Promise<void>, attempts = 2): Promise<boolean> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await operation();
      return true;
    } catch (err) {
      console.warn(`Percobaan tulis ke Firebase ${attempt}/${attempts} gagal:`, err);
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
      }
    }
  }
  return false;
}

/**
 * Menyimpan / Menyinkronkan pesanan baru atau pembaruan status pesanan
 * secara langsung ke Firebase Realtime Database DAN Cloud Firestore!
 * Mengembalikan status keberhasilan masing-masing database agar UI
 * dapat memberi tahu pengguna bila sinkronisasi tidak lengkap.
 */
export async function syncOrderToFirebase(order: Order): Promise<SyncResult> {
  const cleanOrder = stripUndefined(order);

  // Tulis ke RTDB dan Firestore secara PARALEL
  const [rtdbOk, firestoreOk] = await Promise.all([
    withRetry(async () => {
      const orderRef = ref(rtdb, `orders/${cleanOrder.id}`);
      await set(orderRef, cleanOrder);
      console.log(`✓ Order ${cleanOrder.id} berhasil terkirim ke Realtime Database`);
    }),
    withRetry(async () => {
      const docRef = doc(db, "orders", cleanOrder.id);
      await setDoc(docRef, cleanOrder);
      console.log(`✓ Order ${cleanOrder.id} berhasil terkirim ke Cloud Firestore`);
    })
  ]);

  if (!rtdbOk || !firestoreOk) {
    console.error(
      `Sinkronisasi order ${cleanOrder.id} TIDAK LENGKAP — RTDB: ${rtdbOk ? "ok" : "GAGAL"}, Firestore: ${firestoreOk ? "ok" : "GAGAL"}`
    );
  }

  return { rtdbOk, firestoreOk };
}

/**
 * Menyimpan / Menyinkronkan produk merchandise ke Firebase.
 * Mengembalikan status sinkronisasi untuk umpan balik admin.
 */
export async function syncProductToFirebase(product: Product): Promise<SyncResult> {
  if (!db && !rtdb) return { rtdbOk: false, firestoreOk: false };
  const cleanProduct = stripUndefined(product);

  // Tulis ke RTDB dan Firestore secara PARALEL
  const [rtdbOk, firestoreOk] = await Promise.all([
    withRetry(async () => {
      const prodRef = ref(rtdb, `products/${cleanProduct.id}`);
      await set(prodRef, cleanProduct);
      console.log(`✓ Produk ${cleanProduct.id} terkirim ke Realtime Database`);
    }),
    withRetry(async () => {
      const docRef = doc(db, "products", cleanProduct.id);
      await setDoc(docRef, cleanProduct);
      console.log(`✓ Produk ${cleanProduct.id} terkirim ke Cloud Firestore`);
    })
  ]);

  return { rtdbOk, firestoreOk };
}

/**
 * Menyinkronkan SELURUH daftar produk ke Firebase.
 * Digunakan untuk bulk replace/sync setelah operasi CRUD produk.
 */
export async function syncAllProductsToFirebase(products: Product[]): Promise<SyncResult> {
  if (!db && !rtdb) return { rtdbOk: false, firestoreOk: false };

  const cleanList = stripUndefined(products);

  // --- RTDB: replace-all ---
  const rtdbOk = await withRetry(async () => {
    if (!rtdb) throw new Error("RTDB not configured");
    const data: Record<string, Product> = {};
    cleanList.forEach((p) => { data[p.id] = p; });
    await set(ref(rtdb, "products"), data);
    console.log(`✓ RTDB: ${cleanList.length} produk terkirim`);
  });

  // --- Firestore: tulis satu per satu ---
  let firestoreOk = true;
  if (db) {
    for (const product of cleanList) {
      const ok = await withRetry(async () => {
        if (!db) throw new Error("Firestore not configured");
        await setDoc(doc(db, "products", product.id), product);
      });
      if (!ok) {
        console.error(`✗ Firestore gagal tulis produk ${product.id}`);
        firestoreOk = false;
      }
    }
    // Hapus dokumen Firestore yang tidak ada di list baru
    try {
      const snapshot = await getDocs(collection(db, "products"));
      for (const docSnap of snapshot.docs) {
        if (!cleanList.some((p) => p.id === docSnap.id)) {
          await deleteDoc(doc(db, "products", docSnap.id)).catch(() => {});
        }
      }
    } catch { /* skip cleanup errors */ }
  }

  console.log(`✓ syncAllProducts: RTDB=${rtdbOk ? "ok" : "fail"}, Firestore=${firestoreOk ? "ok" : "fail"}`);
  return { rtdbOk, firestoreOk };
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
 * Mengambil pesanan milik satu user tertentu (query ter-scope).
 * Client biasa hanya boleh memakai fungsi ini — bukan fetchOrdersFromFirebase
 * yang mengunduh seluruh koleksi (privasi data pelanggan lain).
 */
export async function fetchOrdersForUser(
  userId?: string | null,
  userEmail?: string | null
): Promise<Order[]> {
  const ordersMap = new Map<string, Order>();

  const collectFirestore = (snapshot: { forEach: (cb: (d: { data: () => unknown; id: string }) => void) => void }) => {
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Order;
      if (data && data.id) ordersMap.set(data.id, data);
    });
  };

  // 1. Firestore — filter dilakukan di server.
  try {
    if (userId) {
      const snap = await getDocs(query(collection(db, "orders"), where("userId", "==", userId)));
      collectFirestore(snap);
    }
    if (userEmail) {
      const snap = await getDocs(query(collection(db, "orders"), where("userEmail", "==", userEmail)));
      collectFirestore(snap);
    }
  } catch (err) {
    console.warn("Firestore fetch user orders error:", err);
  }

  // 2. Realtime Database — butuh index ".indexOn": "userId,userEmail" di database.rules.json.
  try {
    if (userId) {
      const snap = await get(rtdbQuery(ref(rtdb, "orders"), orderByChild("userId"), equalTo(userId)));
      if (snap.exists()) {
        const val = snap.val();
        Object.keys(val).forEach((k) => {
          const item = val[k] as Order;
          if (item && item.id && !ordersMap.has(item.id)) ordersMap.set(item.id, item);
        });
      }
    }
    if (userEmail) {
      const snap = await get(rtdbQuery(ref(rtdb, "orders"), orderByChild("userEmail"), equalTo(userEmail)));
      if (snap.exists()) {
        const val = snap.val();
        Object.keys(val).forEach((k) => {
          const item = val[k] as Order;
          if (item && item.id && !ordersMap.has(item.id)) ordersMap.set(item.id, item);
        });
      }
    }
  } catch (err) {
    console.warn("RTDB fetch user orders error:", err);
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

  // Guard: skip jika Firebase tidak ter-configure
  if (!db && !rtdb) return [];

  // 1. Ambil dari Firestore
  try {
    if (db) {
      const querySnapshot = await getDocs(collection(db, "products"));
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Product;
        if (data && data.id) {
          productsMap.set(data.id, data);
        }
      });
    }
  } catch (err) {
    console.warn("Firestore fetch products error:", err);
  }

  // 2. Ambil dari Realtime Database
  try {
    if (rtdb) {
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
    }
  } catch (err) {
    console.warn("RTDB fetch products error:", err);
  }

  return Array.from(productsMap.values());
}

/**
 * Menghapus satu produk dari Firebase Realtime Database DAN Cloud Firestore.
 */
export async function deleteProductFromFirebase(id: string): Promise<SyncResult> {
  if (!db && !rtdb) return { rtdbOk: false, firestoreOk: false };

  const [rtdbOk, firestoreOk] = await Promise.all([
    withRetry(async () => {
      if (!rtdb) throw new Error("RTDB not configured");
      const prodRef = ref(rtdb, `products/${id}`);
      await remove(prodRef);
      console.log(`✓ Produk ${id} dihapus dari Realtime Database`);
    }),
    withRetry(async () => {
      if (!db) throw new Error("Firestore not configured");
      await deleteDoc(doc(db, "products", id));
      console.log(`✓ Produk ${id} dihapus dari Cloud Firestore`);
    })
  ]);

  return { rtdbOk, firestoreOk };
}

/**
 * Menyimpan / Menyinkronkan bundle tiket alumni ke Firebase.
 */
export async function syncAlumniTicketBundleToFirebase(bundle: AlumniTicketBundle): Promise<SyncResult> {
  if (!db && !rtdb) return { rtdbOk: false, firestoreOk: false };
  const cleanBundle = stripUndefined(bundle);

  const [rtdbOk, firestoreOk] = await Promise.all([
    withRetry(async () => {
      if (!rtdb) throw new Error("RTDB not configured");
      const bundleRef = ref(rtdb, `alumniTicketBundles/${cleanBundle.id}`);
      await set(bundleRef, cleanBundle);
      console.log(`✓ Bundle ${cleanBundle.id} terkirim ke Realtime Database`);
    }),
    withRetry(async () => {
      if (!db) throw new Error("Firestore not configured");
      const docRef = doc(db, "alumniTicketBundles", cleanBundle.id);
      await setDoc(docRef, cleanBundle);
      console.log(`✓ Bundle ${cleanBundle.id} terkirim ke Cloud Firestore`);
    })
  ]);

  return { rtdbOk, firestoreOk };
}

/**
 * Menyinkronkan SELURUH daftar bundle tiket alumni ke Firebase.
 * Menulis satu per satu (bukan batch) supaya satu bundle gagal tidak
 * membatalkan bundle lain. RTDB ditulis via set() di root (replace-all)
 * supaya bundle yang dihapus juga ikut hilang. Firestore ditulis per-dok.
 */
export async function syncAllAlumniTicketBundlesToFirebase(bundles: AlumniTicketBundle[]): Promise<SyncResult> {
  if (!db && !rtdb) return { rtdbOk: false, firestoreOk: false };

  const cleanList = stripUndefined(bundles);

  // --- RTDB: replace-all (tulis seluruh objek sekaligus) ---
  const rtdbOk = await withRetry(async () => {
    if (!rtdb) throw new Error("RTDB not configured");
    const data: Record<string, AlumniTicketBundle> = {};
    cleanList.forEach((b) => { data[b.id] = b; });
    await set(ref(rtdb, "alumniTicketBundles"), data);
    console.log(`✓ RTDB: ${cleanList.length} bundle terkirim`);
  });

  // --- Firestore: tulis satu per satu ---
  let firestoreOk = true;
  if (db) {
    for (const bundle of cleanList) {
      const ok = await withRetry(async () => {
        if (!db) throw new Error("Firestore not configured");
        await setDoc(doc(db, "alumniTicketBundles", bundle.id), bundle);
      });
      if (!ok) {
        console.error(`✗ Firestore gagal tulis bundle ${bundle.id}`);
        firestoreOk = false;
      }
    }
    // Hapus dokumen Firestore yang tidak ada di list baru
    try {
      const snapshot = await getDocs(collection(db, "alumniTicketBundles"));
      for (const docSnap of snapshot.docs) {
        if (!cleanList.some((b) => b.id === docSnap.id)) {
          await deleteDoc(doc(db, "alumniTicketBundles", docSnap.id)).catch(() => {});
        }
      }
    } catch { /* skip cleanup errors */ }
  }

  console.log(`✓ syncAll: RTDB=${rtdbOk ? "ok" : "fail"}, Firestore=${firestoreOk ? "ok" : "fail"}`);
  return { rtdbOk, firestoreOk };
}

/**
 * Mengambil seluruh data bundle tiket alumni dari Cloud Firestore & Realtime Database.
 */
export async function fetchAlumniTicketBundlesFromFirebase(): Promise<AlumniTicketBundle[]> {
  const bundlesMap = new Map<string, AlumniTicketBundle>();

  if (!db && !rtdb) return [];

  try {
    if (db) {
      const querySnapshot = await getDocs(collection(db, "alumniTicketBundles"));
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as AlumniTicketBundle;
        if (data && data.id) {
          bundlesMap.set(data.id, data);
        }
      });
    }
  } catch (err) {
    console.warn("Firestore fetch alumniTicketBundles error:", err);
  }

  try {
    if (rtdb) {
      const dbRef = ref(rtdb);
      const snapshot = await get(child(dbRef, "alumniTicketBundles"));
      if (snapshot.exists()) {
        const rtdbBundles = snapshot.val();
        Object.keys(rtdbBundles).forEach((id) => {
          const item = rtdbBundles[id] as AlumniTicketBundle;
          if (item && item.id && !bundlesMap.has(item.id)) {
            bundlesMap.set(item.id, item);
          }
        });
      }
    }
  } catch (err) {
    console.warn("RTDB fetch alumniTicketBundles error:", err);
  }

  return Array.from(bundlesMap.values());
}

/**
 * Menyinkronkan bundle seed default (ALUMNI_TICKET_BUNDLES) ke Firebase
 * agar data lengkap tersedia di kedua sumber. Hanya menulis bundle yang
 * belum ada di Firebase (berdasarkan id), tanpa menimpa data yang sudah
 * diedit admin.
 */
export async function seedAlumniTicketBundlesToFirebase(): Promise<number> {
  if (!db && !rtdb) return 0;

  let existing = new Set<string>();
  try {
    if (db) {
      const querySnapshot = await getDocs(collection(db, "alumniTicketBundles"));
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.id) existing.add(data.id);
      });
    }
    if (rtdb) {
      const snapshot = await get(child(ref(rtdb), "alumniTicketBundles"));
      if (snapshot.exists()) {
        Object.keys(snapshot.val() || {}).forEach((id) => existing.add(id));
      }
    }
  } catch (err) {
    console.warn("Gagal membaca bundle yang sudah ada saat seed:", err);
  }

  const missing = ALUMNI_TICKET_BUNDLES.filter((b) => !existing.has(b.id));
  
  // Jika database sudah memiliki data bundle (existing.size > 0),
  // berarti admin mungkin sudah menghapus/mengedit bundle bawaan.
  // Jangan kembalikan bundle yang dihapus. Hanya lakukan seed jika kosong.
  if (existing.size > 0 || missing.length === 0) return 0;

  const results = await Promise.all(
    missing.map((bundle) => syncAlumniTicketBundleToFirebase(bundle))
  );
  const seeded = results.filter((r) => r.rtdbOk || r.firestoreOk).length;
  if (seeded > 0) console.log(`✓ Seed ${seeded} bundle default ke Firebase`);
  return seeded;
}

/**
 * Menghapus satu bundle tiket alumni dari Firebase Realtime Database DAN Cloud Firestore.
 */
export async function deleteAlumniTicketBundleFromFirebase(id: string): Promise<SyncResult> {
  if (!db && !rtdb) return { rtdbOk: false, firestoreOk: false };

  const [rtdbOk, firestoreOk] = await Promise.all([
    withRetry(async () => {
      if (!rtdb) throw new Error("RTDB not configured");
      const bundleRef = ref(rtdb, `alumniTicketBundles/${id}`);
      await remove(bundleRef);
      console.log(`✓ Bundle ${id} dihapus dari Realtime Database`);
    }),
    withRetry(async () => {
      if (!db) throw new Error("Firestore not configured");
      await deleteDoc(doc(db, "alumniTicketBundles", id));
      console.log(`✓ Bundle ${id} dihapus dari Cloud Firestore`);
    })
  ]);

  return { rtdbOk, firestoreOk };
}

/**
 * Menyimpan / memperbarui satu item galeri dokumentasi di Cloud Firestore.
 */
export async function syncGalleryItemToFirebase(item: GalleryItem) {
  try {
    const docRef = doc(db, "gallery", item.id);
    await setDoc(docRef, stripUndefined(item));
    console.log(`✓ Galeri ${item.id} terkirim ke Cloud Firestore`);
  } catch (err) {
    console.warn("Firestore Sync Gallery:", err);
  }
}

/**
 * Menghapus satu item galeri dari Cloud Firestore.
 */
export async function deleteGalleryItemFromFirebase(id: string) {
  try {
    await deleteDoc(doc(db, "gallery", id));
    console.log(`✓ Galeri ${id} dihapus dari Cloud Firestore`);
  } catch (err) {
    console.warn("Firestore Delete Gallery:", err);
  }
}

/**
 * Mengambil seluruh item galeri dokumentasi dari Cloud Firestore.
 */
export async function fetchGalleryFromFirebase(): Promise<GalleryItem[]> {
  const galleryMap = new Map<string, GalleryItem>();
  try {
    const querySnapshot = await getDocs(collection(db, "gallery"));
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as GalleryItem;
      if (data && data.id) {
        galleryMap.set(data.id, data);
      }
    });
  } catch (err) {
    console.warn("Firestore fetch gallery error:", err);
  }

  return Array.from(galleryMap.values()).sort((a, b) => b.year - a.year);
}

/**
 * Menyimpan / Menyinkronkan tiket alumni ke Firebase.
 */
export async function syncAlumniTicketToFirebase(ticket: AlumniTicket): Promise<SyncResult> {
  const cleanTicket = stripUndefined(ticket);

  // Tulis ke RTDB dan Firestore secara PARALEL
  const [rtdbOk, firestoreOk] = await Promise.all([
    withRetry(async () => {
      const ticketRef = ref(rtdb, `alumniTickets/${cleanTicket.id}`);
      await set(ticketRef, cleanTicket);
      console.log(`✓ AlumniTicket ${cleanTicket.id} berhasil terkirim ke Realtime Database`);
    }),
    withRetry(async () => {
      const docRef = doc(db, "alumniTickets", cleanTicket.id);
      await setDoc(docRef, cleanTicket);
      console.log(`✓ AlumniTicket ${cleanTicket.id} berhasil terkirim ke Cloud Firestore`);
    })
  ]);

  if (!rtdbOk || !firestoreOk) {
    console.error(
      `Sinkronisasi alumniTicket ${cleanTicket.id} TIDAK LENGKAP — RTDB: ${rtdbOk ? "ok" : "GAGAL"}, Firestore: ${firestoreOk ? "ok" : "GAGAL"}`
    );
  }

  return { rtdbOk, firestoreOk };
}

/**
 * Mengambil tiket alumni milik satu user tertentu.
 */
export async function fetchAlumniTicketsForUser(
  userId?: string | null,
  userEmail?: string | null
): Promise<AlumniTicket[]> {
  const ticketsMap = new Map<string, AlumniTicket>();

  const collectFirestore = (snapshot: { forEach: (cb: (d: { data: () => unknown; id: string }) => void) => void }) => {
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as AlumniTicket;
      if (data && data.id) ticketsMap.set(data.id, data);
    });
  };

  try {
    if (userId) {
      const snap = await getDocs(query(collection(db, "alumniTickets"), where("userId", "==", userId)));
      collectFirestore(snap);
    }
    if (userEmail) {
      const snap = await getDocs(query(collection(db, "alumniTickets"), where("userEmail", "==", userEmail)));
      collectFirestore(snap);
    }
  } catch (err) {
    console.warn("Firestore fetch user alumni tickets error:", err);
  }

  try {
    if (userId) {
      const snap = await get(rtdbQuery(ref(rtdb, "alumniTickets"), orderByChild("userId"), equalTo(userId)));
      if (snap.exists()) {
        const val = snap.val();
        Object.keys(val).forEach((k) => {
          const item = val[k] as AlumniTicket;
          if (item && item.id && !ticketsMap.has(item.id)) ticketsMap.set(item.id, item);
        });
      }
    }
    if (userEmail) {
      const snap = await get(rtdbQuery(ref(rtdb, "alumniTickets"), orderByChild("userEmail"), equalTo(userEmail)));
      if (snap.exists()) {
        const val = snap.val();
        Object.keys(val).forEach((k) => {
          const item = val[k] as AlumniTicket;
          if (item && item.id && !ticketsMap.has(item.id)) ticketsMap.set(item.id, item);
        });
      }
    }
  } catch (err) {
    console.warn("RTDB fetch user alumni tickets error:", err);
  }

  const result = Array.from(ticketsMap.values());
  result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return result;
}
