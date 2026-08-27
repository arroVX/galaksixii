"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Sparkles } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, registerWithEmail, loginWithEmail, showAuthAlert } = useAuth();
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
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
      onClose();
    } catch {
      // Pesan error yang ramah sudah ditampilkan oleh AuthContext.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
        >
          <X size={20} />
        </button>

        <div className="w-12 h-12 rounded-full bg-slate-900 text-white mx-auto mb-4 flex items-center justify-center shadow-md">
          <Sparkles size={22} />
        </div>

        <h3 className="text-xl font-bold font-serif-title text-slate-900 mb-1 text-center">
          {isRegister ? "Daftar Akun Baru" : "Masuk ke GALAKSI"}
        </h3>
        <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto text-center">
          {isRegister ? "Buat akun untuk mulai berbelanja merchandise." : "Autentikasi aman untuk mengakses pesanan & checkout instan."}
        </p>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs shadow-sm flex items-center justify-center gap-3 transition border border-slate-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.39 7.36 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.61 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            <span>{isRegister ? "Daftar dengan Google" : "Lanjut dengan Google"}</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono">
              <span className="bg-white px-2 text-slate-400">
                {isRegister ? "Atau Daftar dengan Email" : "Atau Masuk dengan Email"}
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-3 text-xs">
            {isRegister && (
              <div className="animate-in slide-in-from-top-2">
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 font-semibold"
                />
              </div>
            )}
            <div>
              <input
                type="email"
                required
                placeholder="Alamat Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 font-semibold"
              />
            </div>
            <div>
              <input
                type="password"
                required
                placeholder="Kata Sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 font-semibold"
              />
            </div>
            <div className="flex justify-end -mt-2 mb-4">
              <button
                type="button"
                onClick={async () => {
                  if (email) {
                    try {
                      const { getAuth, sendPasswordResetEmail } = await import("firebase/auth");
                      await sendPasswordResetEmail(getAuth(), email);
                      showAuthAlert("Email reset password telah dikirim. Cek inbox kamu.");
                    } catch {
                      showAuthAlert("Gagal mengirim email reset. Pastikan email benar.");
                    }
                  } else {
                    showAuthAlert("Masukkan email terlebih dahulu.");
                  }
                }}
                className="text-[11px] text-neutral-500 hover:text-neutral-900 transition-colors py-1"
              >
                Lupa password?
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition active:scale-95"
            >
              {loading ? "Memproses..." : (isRegister ? "Daftar dengan Email" : "Masuk dengan Email")}
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 transition py-2"
            >
              {isRegister ? "Sudah punya akun? Masuk di sini" : "Belum punya akun? Daftar sekarang"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
