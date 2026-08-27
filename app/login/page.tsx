"use client";

import React, { useState } from "react";
import { SuccessModal } from "@/components/ui/SuccessModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isAdminEmail } from "@/lib/config";
import { Navbar } from "@/components/Navbar";

export default function LoginPage() {
  const router = useRouter();
  const { user, loginWithGoogle, registerWithEmail, loginWithEmail, showAuthAlert, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      setShowSuccessModal(true);
    } catch {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isRegister && !name)) {
      showAuthAlert("Mohon lengkapi semua kolom yang wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await registerWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
      setShowSuccessModal(true);
    } catch {
      // Pesan error yang ramah sudah ditampilkan oleh AuthContext.
    } finally {
      setLoading(false);
    }
  };



  const continueToApp = () => {
    setShowSuccessModal(false);
    if (isAdminEmail(email)) {
      router.push("/?view=admin");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-body-md selection:bg-primary selection:text-on-primary">
      
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12 relative z-10">
        
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-sm relative text-on-background space-y-6 animate-in fade-in">
          
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary font-semibold transition"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="text-center space-y-3">
            <img
              src="/logo.png"
              alt="GALAKSI XII Logo"
              className="h-14 sm:h-16 object-contain mx-auto"
            />
            
            <h1 className="text-2xl font-bold font-headline-md text-primary">
              {isRegister ? "Daftar Akun Baru" : "Masuk ke Akun Anda"}
            </h1>
            <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
              {isRegister ? "Buat akun untuk mulai berbelanja merchandise." : "Masuk untuk memantau status pesanan & checkout instan."}
            </p>
          </div>

          {user && !showSuccessModal ? (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col gap-4 text-xs mt-4">
              <div className="flex flex-col items-center gap-2 text-emerald-800 font-semibold text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
                </div>
                <span>Anda sudah terhubung sebagai <b>{user.displayName}</b></span>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="w-full bg-black text-white hover:bg-neutral-800 font-bold py-3 px-4 rounded-full transition-all active:scale-95 text-center shadow-sm"
                >
                  Ke Beranda
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await logout();
                    } catch (err) {
                      console.error("Logout failed:", err);
                    }
                  }}
                  className="w-full bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 font-bold py-3 px-4 rounded-full transition-all active:scale-95 text-center"
                >
                  Ganti Akun / Keluar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 px-4 rounded-full bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs shadow-sm border border-outline-variant/50 flex items-center justify-center gap-3 transition active:scale-95"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.39 7.36 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.61 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>{isRegister ? "Daftar dengan Google" : "Lanjut Masuk dengan Google"}</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/50" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono">
                  <span className="bg-surface-container-lowest px-2 text-on-surface-variant font-bold">
                    {isRegister ? "Atau Daftar dengan Email" : "Atau Masuk dengan Email"}
                  </span>
                </div>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-3 text-xs">
                {isRegister && (
                  <div className="animate-in slide-in-from-top-2">
                    <label className="block text-on-surface-variant mb-1 font-semibold">Nama Lengkap</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">person</span>
                      <input
                        type="text"
                        required
                        placeholder="Budi Santoso"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-surface border border-outline-variant/50 rounded-xl py-3 pl-10 pr-4 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-on-surface-variant mb-1 font-semibold">Alamat Email</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">mail</span>
                    <input
                      type="email"
                      required
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-surface border border-outline-variant/50 rounded-xl py-3 pl-10 pr-4 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-on-surface-variant mb-1 font-semibold">Kata Sandi</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">lock</span>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-surface border border-outline-variant/50 rounded-xl py-3 pl-10 pr-4 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-full bg-primary hover:bg-neutral-800 text-on-primary font-extrabold text-xs shadow-md transition active:scale-95"
                >
                  {loading ? "Memproses..." : (isRegister ? "Daftar dengan Email" : "Masuk dengan Email")}
                </button>
              </form>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-xs font-bold text-on-surface-variant hover:text-primary transition py-2"
                >
                  {isRegister ? "Sudah punya akun? Masuk di sini" : "Belum punya akun? Daftar sekarang"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Berhasil Masuk!"
        message={`Selamat datang kembali, ${user?.displayName || "Pengguna Galaksi"}! Anda telah berhasil masuk.`}
        buttonText="Lanjutkan"
        onAction={continueToApp}
      />

    </div>
  );
}
