"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useMounted } from "@/lib/useMounted";
import { MobileNav } from "@/components/MobileNav";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SuccessModal } from "@/components/ui/SuccessModal";

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
        <header className="w-full max-w-md bg-white/90 backdrop-blur-md border border-neutral-100 rounded-b-2xl pl-4 pr-2 py-3 shadow-sm flex justify-between items-center">
          <Link href="/merchandise" className="flex items-center shrink-0 active:scale-95 transition-transform duration-150">
            <Image src="/logo.png" alt="Galaksi XII Logo" width={512} height={512} priority className="h-8 w-auto max-w-[140px] object-contain" />
          </Link>
          <div className="flex items-center">
            {mounted ? (
              user ? (
                <button type="button" onClick={() => setIsLogoutModalOpen(true)} aria-label="Keluar akun" className="flex items-center gap-2 pl-2 pr-3 py-2.5 bg-neutral-50 border border-neutral-100 rounded-xl active:scale-95 transition-transform">
                  <span className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-medium text-[11px]">{(user.displayName || "U").charAt(0).toUpperCase()}</span>
                  <span className="max-w-[100px] truncate font-medium text-[11px] tracking-wide text-neutral-700">{user.displayName || user.email?.split("@")[0]}</span>
                  <span className="material-symbols-outlined text-[16px] text-red-400">logout</span>
                </button>
              ) : (
                <Link href="/login" className="inline-flex items-center gap-2 px-5 py-3 bg-neutral-900 text-white font-medium text-[12px] tracking-wide rounded-xl active:scale-95 transition-transform">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>Masuk
                </Link>
              )
            ) : (
              <div className="w-10 h-10 rounded-xl border border-neutral-100 flex items-center justify-center">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-neutral-200 border-t-transparent rounded-full" />
              </div>
            )}
          </div>
        </header>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          Desktop Header — Full-Width Sticky Bar
          ═══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex w-full sticky top-0 z-50">
        <header
          className={`w-full border-b px-6 py-3 flex items-center justify-between transition-all duration-500 ease-out ${
            isAdminMode
              ? "bg-red-50/80 border-red-100"
              : "bg-white/90 backdrop-blur-md border-neutral-100"
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
          <nav className="hidden lg:flex items-center gap-1.5">
            {isAdminMode ? (
              <>
                <Link
                  href="/merchandise"
                  className={`px-4 py-2 rounded-xl text-[12px] font-medium tracking-wide transition-all duration-200 ${
                    pathname === "/merchandise"
                      ? "bg-red-600 text-white"
                      : "text-red-600 hover:bg-red-50"
                  }`}
                >
                  Dashboard Admin
                </Link>
                <button
                  onClick={() => { setActiveView("shop"); router.push("/merchandise"); }}
                  className="px-4 py-2 rounded-xl text-[12px] font-medium tracking-wide text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 transition-all duration-200"
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
                    className={`relative px-4 py-2 rounded-xl text-[12px] font-medium tracking-wide transition-all duration-200 ${
                      isActive
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
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
                className="px-4 py-2 rounded-xl text-[12px] font-medium tracking-wide text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
                Admin
              </button>
            )}
          </nav>

          {/* ── Right: Actions ── */}
          <div className="flex items-center gap-2">
            {isAdminMode ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-[12px] font-medium tracking-wide">
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
                  className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-100 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-all duration-200 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                  {totalItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#e45b45] text-white text-[9px] font-semibold min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full border-2 border-white animate-bounce">
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
                      className="flex items-center gap-2.5 pl-2 pr-4 py-1.5 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-all duration-200 active:scale-95"
                    >
                      <span className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-[11px] font-medium">
                        {(user.displayName || "U").charAt(0).toUpperCase()}
                      </span>
                      <span className="max-w-[100px] truncate text-[12px] font-medium tracking-wide">
                        {user.displayName || user.email?.split("@")[0]}
                      </span>
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-xl hover:bg-[#e45b45] transition-all duration-200 text-[12px] font-medium tracking-wide active:scale-95"
                    >
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      Masuk
                    </Link>
                  )
                ) : (
                  <div className="w-10 h-10 rounded-xl border border-neutral-100 flex items-center justify-center">
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-neutral-200 border-t-transparent rounded-full" />
                  </div>
                )}
              </>
            )}
          </div>
        </header>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <MobileNav activeView={activeView} setActiveView={setActiveView} />

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={async () => {
          setIsLogoutModalOpen(false);
          await logout();
          setIsLogoutSuccessModalOpen(true);
          router.refresh();
          router.push("/merchandise");
        }}
        title="Konfirmasi Keluar Akun"
        message={`Apakah Anda yakin ingin keluar dari akun ${user?.displayName || user?.email?.split("@")[0]}?`}
        confirmText="Ya, Keluar"
        cancelText="Batal"
        variant="danger"
      />

      <SuccessModal
        isOpen={isLogoutSuccessModalOpen}
        onClose={() => setIsLogoutSuccessModalOpen(false)}
        title="Berhasil Keluar"
        message="Anda telah berhasil keluar dari akun. Terima kasih telah menggunakan aplikasi kami!"
        buttonText="Tutup"
      />
    </>
  );
};

