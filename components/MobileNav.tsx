"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

interface MobileNavProps {
  activeView?: "shop" | "admin";
  setActiveView?: (view: "shop" | "admin") => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeView = "shop",
  setActiveView = () => {}
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { totalItemCount } = useCart();
  const [popKey, setPopKey] = useState(0);

  const { siteSettings } = require("@/context/SiteContext").useSiteSettings();

  const navTabs = [
    ...(siteSettings.merchandise.visible ? [{ name: "Toko", path: "/merchandise", icon: "storefront" }] : []),
    ...(siteSettings.tiketAlumni.visible ? [{ name: "Tiket", path: "/tiket-alumni", icon: "confirmation_number" }] : []),
    { name: "Keranjang", path: "/keranjang", icon: "shopping_bag" },
    ...(siteSettings.orders.visible ? [{ name: "Pesanan", path: "/orders", icon: "receipt_long" }] : [])
  ];

  const extraTabs = [
    ...(isAdmin ? [{ name: "Admin", path: "__admin__", icon: "admin_panel_settings" }] : [])
  ];

  const tabs = [...navTabs, ...extraTabs];

  const navMatch = navTabs.findIndex((t) => t.path === pathname);
  const isAdminActive = activeView === "admin" && isAdmin;
  const activeIndex = isAdminActive ? tabs.length - 1 : (navMatch >= 0 ? navMatch : -1);

  const handleTabPress = (tabPath: string) => {
    setPopKey((k) => k + 1);
    if (tabPath === "__admin__") {
      setActiveView("admin");
      if (pathname !== "/merchandise") router.push("/merchandise?admin=true");
      return;
    }
    if (pathname !== tabPath) router.push(tabPath);
  };

  const indicatorWidth = `${100 / tabs.length}%`;
  const indicatorTransform = activeIndex >= 0 ? `translateX(${activeIndex * 100}%)` : "translateX(-100%)";

  return (
    <nav
      aria-label="Navigasi utama"
      className="lg:hidden fixed bottom-0 inset-x-0 z-[80] px-3 pb-safe pt-2 pointer-events-none"
    >
      <div className="nav-bar-enter mx-auto max-w-md bg-white/90 backdrop-blur-md border border-neutral-100 rounded-2xl shadow-sm pointer-events-auto overflow-hidden">
        <div className="flex items-stretch relative">
          {/* Indikator aktif yang meluncur mulus antar tab */}
          <div
            aria-hidden
            className="absolute top-1.5 bottom-1.5 left-0 rounded-xl bg-neutral-900 will-change-transform"
            style={{
              width: indicatorWidth,
              transform: indicatorTransform,
              transition: "transform 550ms cubic-bezier(0.34, 1.56, 0.64, 1)"
            }}
          />
          {tabs.map((tab) => {
            const isActive = tab.path === "__admin__" ? isAdminActive : tab.path === pathname;
            return (
              <button
                key={tab.name}
                type="button"
                onClick={() => handleTabPress(tab.path)}
                aria-current={isActive ? "page" : undefined}
                aria-label={tab.name}
                className={`relative z-10 flex-1 flex flex-col items-center justify-center gap-0.5 py-3 min-h-[60px] select-none touch-manipulation transition-transform duration-150 ease-out active:scale-90 ${
                  isActive ? "text-white font-semibold" : "text-neutral-300 font-medium hover:text-neutral-500"
                }`}
              >
                <span key={`${tab.name}-${isActive ? popKey : "idle"}`} className={`relative ${isActive ? "tab-pop" : ""}`}>
                  <span className="material-symbols-outlined text-[24px] leading-none block">
                    {tab.icon}
                  </span>
                  {tab.name === "Keranjang" && totalItemCount > 0 && (
                    <span
                      key={totalItemCount}
                      className="badge-pop absolute -top-1 -right-1.5 min-w-[20px] h-[20px] px-1.5 bg-[#e45b45] text-white text-[10px] font-semibold flex items-center justify-center rounded-full border-2 border-white"
                    >
                      {totalItemCount}
                    </span>
                  )}
                  {tab.name === "Admin" && (
                    <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full">
                      !
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
