"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile } from "@/types/merch";
import { auth, googleProvider } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogle: (isRegister?: boolean) => Promise<void>;
  loginAsDemoUser: (role?: "user" | "admin") => void;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => void;
  showAuthAlert: (msg: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authAlertMsg, setAuthAlertMsg] = useState<string | null>(null);

  const showAuthAlert = (msg: string) => {
    setAuthAlertMsg(msg);
  };

  useEffect(() => {
    // Check saved user in localStorage first for quick hydration or demo state
    const savedUser = localStorage.getItem("gala_merch_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        const registeredAccounts = JSON.parse(localStorage.getItem("gala_merch_registered_accounts") || "[]");
        const isRegistered = registeredAccounts.some((acc: any) => acc.email === parsed.email);
        if (isRegistered || parsed.email?.includes("admin")) {
          setUser(parsed);
        } else {
          localStorage.removeItem("gala_merch_user");
        }
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const fbEmail = firebaseUser.email || "";
        const registeredAccounts = JSON.parse(localStorage.getItem("gala_merch_registered_accounts") || "[]");
        const isRegistered = registeredAccounts.some((acc: any) => acc.email === fbEmail);
        
        if (!isRegistered && !fbEmail.includes("admin")) {
          await signOut(auth);
          setUser(null);
          localStorage.removeItem("gala_merch_user");
          setLoading(false);
          return;
        }

        const userObj: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Pelanggan GALA",
          photoURL: firebaseUser.photoURL,
          role: firebaseUser.email?.includes("admin") ? "admin" : "user",
          address: user?.address || "",
          phone: user?.phone || "",
          classGroup: user?.classGroup || ""
        };
        setUser(userObj);
        localStorage.setItem("gala_merch_user", JSON.stringify(userObj));
      } else {
        // If not firebase user, keep the demo user if it's there
        const currentSaved = localStorage.getItem("gala_merch_user");
        if (!currentSaved) {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (isRegister: boolean = false) => {
    try {
      setLoading(true);
      const res = await signInWithPopup(auth, googleProvider);
      const fbUser = res.user;
      const fbEmail = fbUser.email || "";

      const registeredAccounts = JSON.parse(localStorage.getItem("gala_merch_registered_accounts") || "[]");
      const isRegistered = registeredAccounts.some((acc: any) => acc.email === fbEmail);

      if (isRegister) {
        if (!isRegistered) {
          registeredAccounts.push({ email: fbEmail, password: "", name: fbUser.displayName || "Google User" });
          localStorage.setItem("gala_merch_registered_accounts", JSON.stringify(registeredAccounts));
        }
      } else {
        if (!isRegistered && !fbEmail.includes("admin")) {
          await signOut(auth);
          throw new Error("Akun Google belum terdaftar. Silakan daftar terlebih dahulu.");
        }
      }

      const userObj: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || "Pelanggan GALA",
        photoURL: fbUser.photoURL,
        role: fbUser.email?.includes("admin") ? "admin" : "user",
      };
      setUser(userObj);
      localStorage.setItem("gala_merch_user", JSON.stringify(userObj));
    } catch (err: any) {
      if (err.message === "Akun Google belum terdaftar. Silakan daftar terlebih dahulu.") {
        showAuthAlert(err.message);
      } else {
        console.warn("Google Auth failed:", err);
        // Fallback for demo purposes if popup is blocked
        if (isRegister) {
           const registeredAccounts = JSON.parse(localStorage.getItem("gala_merch_registered_accounts") || "[]");
           registeredAccounts.push({ email: "pembeli@gmail.com", password: "", name: "Budi Santoso" });
           localStorage.setItem("gala_merch_registered_accounts", JSON.stringify(registeredAccounts));
        }
        loginAsDemoUser("user");
      }
      throw err; // Re-throw to be handled by the UI
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoUser = (role: "user" | "admin" = "user") => {
    const demoObj: UserProfile = {
      uid: role === "admin" ? "admin-999" : "demo-user-123",
      email: role === "admin" ? "admin@galamerch.com" : "pembeli@gmail.com",
      displayName: role === "admin" ? "Admin Merchandise" : "Budi Santoso",
      photoURL: role === "admin" ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      role: role,
      phone: "081234567890",
      address: "Jl. Merdeka No. 45, Jakarta Selatan",
      classGroup: "XII MIPA 2 / 2026"
    };
    setUser(demoObj);
    localStorage.setItem("gala_merch_user", JSON.stringify(demoObj));
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    localStorage.removeItem("gala_merch_user");
  };

  const updateProfileData = (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem("gala_merch_user", JSON.stringify(updated));
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        loginWithGoogle,
        loginAsDemoUser,
        logout,
        updateProfileData,
        showAuthAlert,
      }}
    >
      {children}

      {/* Global Auth Alert Modal */}
      {authAlertMsg && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center text-slate-900 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 mx-auto mb-4 flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[28px]">error</span>
            </div>
            <h3 className="text-xl font-bold font-serif-title text-slate-900 mb-2">Peringatan</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {authAlertMsg}
            </p>
            <button
              onClick={() => setAuthAlertMsg(null)}
              className="w-full py-3 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition active:scale-95"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
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
