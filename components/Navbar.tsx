"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useMounted } from "@/lib/useMounted";
import { MobileNav } from "@/components/MobileNav";

interface NavbarProps {
  activeView?: "shop" | "admin";
  setActiveView?: (view: "shop" | "admin") => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView = "shop",
  setActiveView = () => {}
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const { totalItemCount } = useCart();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLogoutSuccessModalOpen, setIsLogoutSuccessModalOpen] = useState(false);
  const mounted = useMounted();

  const navLinks = [
    { name: "Merchandise", path: "/merchandise" },
    { name: "Keranjang", path: "/keranjang" },
    { name: "Tiket & Bundling", path: "/tiket-alumni", isSpecial: true },
    { name: "Cek Pesanan", path: "/orders" }
  ];

  const isAdminMode = activeView === "admin";

  return (
    <>
      {/* Mobile Top App-Bar */}
      <div className="lg:hidden w-full flex justify-center sticky top-0 z-50 px-4 pb-2">
        <header className="w-full max-w-md bg-white/95 backdrop-blur-md border border-neutral-200 rounded-b-[26px] pl-4 pr-2 py-3 shadow-sm flex justify-between items-center">
          <Link href="/merchandise" className="flex items-center shrink-0 active:scale-95 transition-transform duration-150">
            <Image src="/logo.png" alt="Galaksi XII Logo" width={512} height={512} priority className="h-8 w-auto max-w-[140px] object-contain" />
          </Link>
          <div className="flex items-center">
            {mounted ? (
              user ? (
                <button type="button" onClick={() => setIsLogoutModalOpen(true)} aria-label="Keluar akun" className="flex items-center gap-2 pl-2 pr-3 py-2 bg-neutral-100 border border-neutral-200 rounded-full active:scale-95 transition-transform">
                  <span className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-bold text-[11px]">{(user.displayName || "U").charAt(0).toUpperCase()}</span>
                  <span className="max-w-[100px] truncate font-bold text-[11px] uppercase tracking-wide text-neutral-900">{user.displayName || user.email?.split("@")[0]}</span>
                  <span className="material-symbols-outlined text-[16px] text-red-500">logout</span>
                </button>
              ) : (
                <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white font-bold text-[11px] uppercase tracking-wider rounded-full active:scale-95 transition-transform shadow-sm">
                  <span className="w-1.5 h-1.5 bg-white"></span>Masuk
                </Link>
              )
            ) : (
              <div className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-neutral-300 border-t-transparent rounded-full" />
              </div>
            )}
          </div>
        </header>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          Desktop Header — Floating Pill, 3-Section Layout
          ═══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex w-full justify-center sticky top-6 z-50 mb-6 px-6 xl:px-12">
        <header
          className={`w-full max-w-6xl backdrop-blur-xl border rounded-full px-5 py-3 shadow-lg flex items-center justify-between transition-all duration-500 ease-out ${
            isAdminMode
              ? "bg-red-50/80 border-red-200/60 shadow-red-900/5"
              : "bg-white/90 border-neutral-200/60 shadow-neutral-900/5"
          }`}
        >
          {/* ── Left: Logo ── */}
          <Link
            href="/merchandise"
            className="flex items-center shrink-0 transition-transform duration-200 hover:scale-105"
          >
            <Image
              src="/logo.png"
              alt="Galaksi XII Logo"
              width={512}
              height={512}
              priority
              className="h-9 w-auto max-w-[140px] object-contain"
            />
          </Link>

          {/* ── Center: Navigation Links ── */}
          <nav className="hidden lg:flex items-center gap-1">
            {isAdminMode ? (
              <>
                <Link
                  href="/merchandise"
                  className={`px-4 py-2 rounded-full text-[11px] font-semibold tracking-[0.12em] uppercase transition-all duration-200 ${
                    pathname === "/merchandise"
                      ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                      : "text-red-600 hover:bg-red-100"
                  }`}
                >
                  Dashboard Admin
                </Link>
                <button
                  onClick={() => { setActiveView("shop"); router.push("/merchandise"); }}
                  className="px-4 py-2 rounded-full text-[11px] font-semibold tracking-[0.12em] uppercase text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-all duration-200"
                >
                  Keluar Admin
                </button>
              </>
            ) : (
              navLinks.map((link) => {
                const isActive = pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    href={link.path}
                    className={`relative px-4 py-2 rounded-full text-[11px] font-semibold tracking-[0.12em] uppercase transition-all duration-200 ${
                      isActive
                        ? "bg-neutral-900 text-white shadow-md shadow-neutral-900/15"
                        : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                  >
                    {link.name}
                    {link.isSpecial && !isActive && (
                      <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-[#e45b45] rounded-full align-middle animate-pulse" />
                    )}
                  </Link>
                );
              })
            )}
            {isAdmin && !isAdminMode && (
              <button
                onClick={() => {
                  setActiveView("admin");
                  if (pathname !== "/merchandise") router.push("/merchandise");
                }}
                className="px-4 py-2 rounded-full text-[11px] font-semibold tracking-[0.12em] uppercase text-red-500 hover:bg-red-50 transition-all duration-200 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
                Admin
              </button>
            )}
          </nav>

          {/* ── Right: Actions ── */}
          <div className="flex items-center gap-2">
            {isAdminMode ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full text-[11px] font-bold tracking-wider uppercase">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                Admin
              </div>
            ) : (
              <>
                {/* Cart */}
                <Link
                  href="/keranjang"
                  aria-label="Keranjang"
                  className="relative flex items-center justify-center w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 transition-all duration-200 active:scale-90"
                >
                  <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                  {totalItemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#e45b45] text-white text-[9px] font-bold min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                      {totalItemCount}
                    </span>
                  )}
                </Link>

                {/* Auth */}
                {mounted ? (
                  user ? (
                    <button
                      type="button"
                      onClick={() => setIsLogoutModalOpen(true)}
                      className="flex items-center gap-2.5 pl-2 pr-4 py-1.5 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-all duration-200 active:scale-95"
                    >
                      <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-[11px] font-bold">
                        {(user.displayName || "U").charAt(0).toUpperCase()}
                      </span>
                      <span className="max-w-[100px] truncate text-[11px] font-semibold tracking-wide">
                        {user.displayName || user.email?.split("@")[0]}
                      </span>
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-full hover:bg-[#e45b45] transition-all duration-200 text-[11px] font-bold tracking-wider uppercase active:scale-95"
                    >
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      Masuk
                    </Link>
                  )
                ) : (
                  <div className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center">
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-neutral-300 border-t-transparent rounded-full" />
                  </div>
                )}
              </>
            )}
          </div>
        </header>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <MobileNav activeView={activeView} setActiveView={setActiveView} />

      {/* Logout Modal */}
      {isLogoutModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsLogoutModalOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-6 shadow-2xl z-10 text-center animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200 shadow-sm">
              <span className="material-symbols-outlined text-[28px]">logout</span>
            </div>
            <h3 className="font-bold text-xl text-primary mb-1 font-headline-md">Konfirmasi Keluar Akun</h3>
            <p className="text-xs text-on-surface-variant opacity-80 mb-6 leading-relaxed">
              Apakah Anda yakin ingin keluar dari akun <strong className="text-primary font-bold capitalize">{user?.displayName || user?.email?.split("@")[0]}</strong>?
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-on-surface font-bold py-2.5 px-4 rounded-full text-xs transition-colors">Batal</button>
              <button onClick={async () => { setIsLogoutModalOpen(false); await logout(); setIsLogoutSuccessModalOpen(true); router.refresh(); router.push("/merchandise"); }} className="flex-1 bg-black text-white hover:bg-neutral-800 font-bold py-2.5 px-4 rounded-full text-xs transition-all shadow-md active:scale-95">Ya, Keluar</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Logout Success Modal */}
      {isLogoutSuccessModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsLogoutSuccessModalOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-6 shadow-2xl z-10 text-center animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-sm">
              <span className="material-symbols-outlined text-[28px]">check_circle</span>
            </div>
            <h3 className="font-bold text-xl text-primary mb-1 font-headline-md">Berhasil Keluar</h3>
            <p className="text-xs text-on-surface-variant opacity-80 mb-6 leading-relaxed">
              Anda telah berhasil keluar dari akun. Terima kasih telah menggunakan aplikasi kami!
            </p>
            <button onClick={() => setIsLogoutSuccessModalOpen(false)} className="w-full bg-black text-white hover:bg-neutral-800 font-bold py-2.5 px-4 rounded-full text-xs transition-all shadow-md active:scale-95">Tutup</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

