import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getDatabase, type Database } from "firebase/database";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? ""
};

// True hanya jika semua variabel NEXT_PUBLIC_FIREBASE_* wajib terisi di .env.local.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// getAuth memvalidasi apiKey secara eager dan melempar error bila kosong —
// itu membuat prerender/build gagal saat env belum diset (mis. di Vercel).
// Pemakaian runtime tetap aman karena AuthContext selalu memanggil ensureConfigured() dulu.
export const auth = (isFirebaseConfigured ? getAuth(app) : null) as Auth;
export const googleProvider = new GoogleAuthProvider();
export const db = (isFirebaseConfigured ? getFirestore(app) : null) as Firestore;
export const rtdb = (isFirebaseConfigured ? getDatabase(app) : null) as Database;
export const storage = (isFirebaseConfigured ? getStorage(app) : null) as FirebaseStorage;

export default app;
