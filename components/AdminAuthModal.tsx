"use client";

import React, { useState } from "react";
import { X, Shield, Lock, KeyRound, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginAsDemoUser } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const inputUser = username.trim().toLowerCase();
    const inputPass = password.trim();

    // Flexible valid credentials:
    const validUsernames = ["admin", "admin123", "admingalaksi", "admin@galamerch.com", "smkn3jepara", "gala"];
    const validPasswords = ["admin", "admin123", "galaksi2026", "123456", "admin"];

    if (
      validUsernames.includes(inputUser) || 
      inputUser.includes("admin") ||
      validPasswords.includes(inputPass)
    ) {
      loginAsDemoUser("admin");
      onSuccess();
      onClose();
    } else {
      setErrorMsg("Username atau Password Admin salah. Silakan coba: admin / admin123");
    }
  };

  const handleQuickDemoAdmin = () => {
    loginAsDemoUser("admin");
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-slate-900">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
        >
          <X size={20} />
        </button>

        {/* Icon & Title */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30 mx-auto flex items-center justify-center shadow-sm">
            <Shield size={28} />
          </div>

          <h3 className="text-xl font-bold font-serif-title text-slate-900">
            Autentikasi Mode Admin
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Masukkan Username dan Password pengelola untuk membuka Panel Manajemen Merchandise.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-700 font-medium animate-in fade-in">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Username Admin</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                required
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Password Khusus Admin</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="password"
                required
                placeholder="admin123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 font-mono font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition transform active:scale-98"
          >
            <Shield size={16} />
            <span>Verifikasi & Masuk Mode Admin</span>
          </button>
        </form>

        {/* Quick Demo Access Button */}
        <div className="mt-4 pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={handleQuickDemoAdmin}
            className="w-full py-2.5 px-4 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Sparkles size={15} className="text-amber-600" />
            <span>⚡ Masuk Mode Admin Langsung (Pintas Demo)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
