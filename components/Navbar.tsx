"use client";

import React, { useState, useEffect } from "react";
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
  const { totalItemCount, setIsCartOpen } = useCart();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLogoutSuccessModalOpen, setIsLogoutSuccessModalOpen] = useState(false);
  const mounted = useMounted();

  // Live Jepara Clock
  const [timeString, setTimeString] = useState("");

  useEffect(() => {
    const updateClock = () => {
      setTimeString(new Date().toLocaleTimeString("en-US", { hour12: false }));
    };

    // Pembaruan pertama lewat interval (callback async), bukan setState sinkron di body effect.
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { name: "Merchandise", path: "/merchandise" },
    { name: "Tiket & Bundling", path: "/tiket-alumni", isSpecial: true },
    { name: "Cek Pesanan", path: "/orders" }
  ];

  return (
    <>
      {/* Mobile Top App-Bar — ringkas, navigasi utama ada di bottom bar */}
      <div className="lg:hidden w-full flex justify-center sticky top-0 z-50 px-4 pb-2">
        <header className="w-full max-w-md bg-white/95 backdrop-blur-md border border-neutral-200 rounded-b-[26px] pl-4 pr-2 py-3 shadow-sm flex justify-between items-center">
          <Link href="/" className="flex items-center shrink-0 active:scale-95 transition-transform duration-150">
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

      {/* Desktop Header */}
      <div className="hidden lg:flex w-full justify-center sticky top-8 z-50 mb-8 px-6 md:px-16">
        <header className="w-full max-w-7xl bg-white/95 backdrop-blur-md border border-neutral-200 rounded-full px-4 sm:px-6 py-3 md:py-4 shadow-sm flex justify-between items-center transition-all duration-300">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Brand */}
            <Link 
              href="/" 
              className="flex items-center shrink-0 hover:scale-105 transition-transform duration-200"
            >
              <Image src="/logo.png" alt="Galaksi XII Logo" width={512} height={512} priority className="h-8 sm:h-9 md:h-10 w-auto max-w-[150px] object-contain" />
            </Link>
            {/* Badge */}
            <div className="hidden md:flex items-center gap-2 bg-neutral-100 border border-neutral-200 px-3 py-1.5 transition-colors" style={{ borderRadius: '2px' }}>
              <div className="w-1.5 h-1.5 bg-neutral-900 animate-pulse" style={{ borderRadius: '1px' }}></div>
              <span className="font-dot-matrix text-[10px] font-bold text-neutral-900 tracking-widest uppercase mt-0.5">JEPARA {timeString || "..."}</span>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8">
            {activeView === "admin" ? (
              <>
                <Link href="/merchandise" className={`font-label-md text-label-md transition-all duration-200 hover:-translate-y-0.5 ${pathname === '/merchandise' ? 'text-primary border-b-2 border-primary pb-1 font-bold' : 'text-on-surface-variant hover:text-primary'}`}>Dashboard Admin</Link>
                <button onClick={() => { setActiveView("shop"); router.push("/merchandise"); }} className="font-label-md text-label-md text-red-500 hover:text-red-700 transition-all duration-200 font-bold">Keluar Admin</button>
              </>
            ) : (
              <>
                {navLinks.map((link) => {
                  return (
                    <Link 
                      key={link.name} 
                      href={link.path}
                      className={`font-sans text-[11px] tracking-[0.2em] uppercase transition-all duration-200 hover:-translate-y-0.5 ${pathname === link.path ? 'text-neutral-900 font-bold border-b-2 border-neutral-900 pb-1' : 'text-neutral-400 hover:text-neutral-900 font-bold'}`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
                {isAdmin && (
                  <button 
                    onClick={() => {
                      setActiveView("admin");
                      if (pathname !== "/merchandise") router.push("/merchandise");
                    }} 
                    className="font-label-md text-label-md transition-all duration-200 hover:-translate-y-0.5 text-red-600 hover:text-red-700 font-bold flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                    <span>Dashboard Admin</span>
                  </button>
                )}
              </>
            )}
          </nav>

          {/* Trailing Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {activeView !== "admin" ? (
              <>
                {/* Cart Icon Button */}
                <button onClick={() => setIsCartOpen(true)} aria-label="shopping_bag" className="flex items-center justify-center w-10 h-10 bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:border-neutral-900 transition-all relative" style={{ borderRadius: '2px' }}>
                  <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                  {totalItemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-neutral-900 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center animate-bounce" style={{ borderRadius: '2px' }}>{totalItemCount}</span>
                  )}
                </button>

                {/* User Auth Profile */}
                <div className="hidden md:block relative group">
                  {mounted ? (
                    user ? (
                      <button type="button" onClick={() => setIsLogoutModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-900 font-bold text-[11px] uppercase tracking-wider hover:bg-neutral-100 transition-all shadow-sm active:scale-95" style={{ borderRadius: '2px' }}>
                        <span className="w-1.5 h-1.5 bg-neutral-900"></span>
                        <span className="max-w-[120px] truncate">{user.displayName || user.email?.split("@")[0]}</span>
                        <span className="material-symbols-outlined text-[14px]">logout</span>
                      </button>
                    ) : (
                      <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2 bg-neutral-900 text-white font-bold text-[11px] uppercase tracking-wider hover:bg-[#e45b45] transition-colors shadow-sm active:scale-95" style={{ borderRadius: '2px' }}>
                        <span className="w-1.5 h-1.5 bg-white"></span>
                        <span>Masuk</span>
                      </Link>
                    )
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-50 border border-neutral-200 text-neutral-400 font-bold text-xs" style={{ borderRadius: '2px' }}>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent text-neutral-400 rounded-full" />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-red-50 border border-red-100 text-red-600 font-bold rounded-full text-xs">
                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span> Administrator
              </div>
            )}

          </div>
        </header>
      </div>

      {/* Bottom Navigation (Mobile) — navigasi ala aplikasi */}
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
              <button onClick={async () => { setIsLogoutModalOpen(false); await logout(); setIsLogoutSuccessModalOpen(true); router.refresh(); router.push("/"); }} className="flex-1 bg-black text-white hover:bg-neutral-800 font-bold py-2.5 px-4 rounded-full text-xs transition-all shadow-md active:scale-95">Ya, Keluar</button>
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

