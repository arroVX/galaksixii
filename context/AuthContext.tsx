"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { UserProfile } from "@/types/merch";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { isAdminEmail } from "@/lib/config";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as updateFirebaseProfile,
  type User,
} from "firebase/auth";
import { AlertModal } from "@/components/ui/AlertModal";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => void;
  showAuthAlert: (msg: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "gala_merch_user";

const getFriendlyAuthError = (err: unknown): string => {
  const code = (err as { code?: string })?.code || "";
  switch (code) {
    case "auth/email-already-in-use":
      return "Email sudah terdaftar. Silakan masuk dengan akun tersebut.";
    case "auth/invalid-email":
      return "Format alamat email tidak valid.";
    case "auth/missing-password":
    case "auth/weak-password":
      return "Kata sandi terlalu lemah atau kosong (minimal 6 karakter).";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email atau kata sandi yang Anda masukkan salah.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan login. Silakan coba lagi nanti.";
    case "auth/network-request-failed":
      return "Gagal terhubung ke server. Periksa koneksi internet Anda.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Jendela login ditutup sebelum proses selesai.";
    case "auth/popup-blocked":
      return "Browser memblokir popup. Izinkan popup lalu coba lagi.";
    case "auth/unauthorized-domain":
      return "Domain ini belum terdaftar di Firebase Console -> Authentication -> Settings -> Authorized Domains.";
    case "auth/operation-not-allowed":
      return "Metode login ini belum diaktifkan di Firebase Console.";
    default:
      return "Terjadi kesalahan saat autentikasi. Silakan coba lagi.";
  }
};

const ensureConfigured = () => {
  if (!isFirebaseConfigured) {
    throw new Error(
      "Konfigurasi Firebase belum lengkap. Salin .env.example menjadi .env.local lalu isi semua variabel."
    );
  }
};

const buildUserProfile = (fbUser: User, extras: Partial<UserProfile> = {}): UserProfile => ({
  uid: fbUser.uid,
  email: fbUser.email,
  displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "Pelanggan GALA",
  photoURL: fbUser.photoURL ?? null,
  address: extras.address ?? "",
  phone: extras.phone ?? "",
  classGroup: extras.classGroup ?? "",
  role: isAdminEmail(fbUser.email) ? "admin" : "user",
});

const readSavedProfile = (): Partial<UserProfile> | null => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Ambil data profil tambahan (alamat, dll.) hanya jika cache lokal milik akun yang sama.
const pickExtras = (saved: Partial<UserProfile> | null, email: string | null): Partial<UserProfile> =>
  saved && saved.email && saved.email === email
    ? { address: saved.address, phone: saved.phone, classGroup: saved.classGroup }
    : {};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authAlertMsg, setAuthAlertMsg] = useState<string | null>(null);

  // Ref agar callback async selalu membaca profil terbaru (menghindari stale closure).
  const userRef = useRef<UserProfile | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const showAuthAlert = (msg: string) => {
    setAuthAlertMsg(msg);
  };

  const applyUser = (profile: UserProfile | null) => {
    setUser(profile);
    try {
      if (profile) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
      else localStorage.removeItem(USER_STORAGE_KEY);
    } catch (e) {
      console.error("Failed to access localStorage", e);
    }
  };

  useEffect(() => {
    // Hydrasi cepat dari cache lokal supaya UI tidak berkedip, validasi asli tetap oleh listener Firebase.
    const saved = readSavedProfile();
    if (saved && saved.uid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrasi cache profil dari localStorage saat mount (sumber eksternal, tidak tersedia saat SSR).
      setUser(saved as UserProfile);
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        applyUser(buildUserProfile(firebaseUser, pickExtras(readSavedProfile(), firebaseUser.email)));
      } else {
        applyUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    ensureConfigured();
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      applyUser(buildUserProfile(res.user, pickExtras(readSavedProfile(), res.user.email)));
    } catch (err: unknown) {
      showAuthAlert(getFriendlyAuthError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email: string, password: string, name: string) => {
    ensureConfigured();
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name.trim()) {
        await updateFirebaseProfile(cred.user, { displayName: name.trim() });
      }
      applyUser(buildUserProfile(cred.user, pickExtras(readSavedProfile(), cred.user.email)));
    } catch (err: unknown) {
      showAuthAlert(getFriendlyAuthError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    ensureConfigured();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      applyUser(buildUserProfile(cred.user, pickExtras(readSavedProfile(), cred.user.email)));
    } catch (err: unknown) {
      showAuthAlert(getFriendlyAuthError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {}
  };

  const updateProfileData = (data: Partial<UserProfile>) => {
    const current = userRef.current;
    if (!current) return;
    const updated = { ...current, ...data };
    setUser(updated);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));

    if (data.displayName && auth.currentUser) {
      updateFirebaseProfile(auth.currentUser, { displayName: data.displayName }).catch((e) =>
        console.warn("Failed to sync display name to Firebase:", e)
      );
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        loginWithGoogle,
        registerWithEmail,
        loginWithEmail,
        logout,
        updateProfileData,
        showAuthAlert,
      }}
    >
      {children}

      <AlertModal
        isOpen={!!authAlertMsg}
        onClose={() => setAuthAlertMsg(null)}
        title="Peringatan"
        message={authAlertMsg || ""}
        icon="error"
        iconColor="red"
        buttonText="Mengerti"
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
