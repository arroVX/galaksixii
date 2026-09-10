"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { SiteSettings } from "@/types/merch";
import { fetchSiteSettings, DEFAULT_SITE_SETTINGS } from "@/lib/firebaseService";

interface SiteContextType {
  siteSettings: SiteSettings;
  updateLocalSettings: (settings: SiteSettings) => void;
  loading: boolean;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

const SITE_SETTINGS_KEY = "gala_merch_site_settings";

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // 1. Load dari LocalStorage untuk instant render — gunakan queueMicrotask untuk hindari setState sync di effect
    try {
      const saved = localStorage.getItem(SITE_SETTINGS_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as SiteSettings;
          queueMicrotask(() => {
            if (!cancelled) setSiteSettings(parsed);
          });
        } catch {}
      }
    } catch {}

    // 2. Fetch sinkronisasi dari Firebase (dibatasi timeout di firebaseService
    // agar loading tidak menggantung saat jaringan stall)
    fetchSiteSettings()
      .then((fbSettings) => {
        if (cancelled) return;
        setSiteSettings(fbSettings);
        try {
          localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(fbSettings));
        } catch {}
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Gagal memuat pengaturan situs, memakai default:", err);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateLocalSettings = (settings: SiteSettings) => {
    setSiteSettings(settings);
    try {
      localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  };

  return (
    <SiteContext.Provider value={{ siteSettings, updateLocalSettings, loading }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error("useSiteSettings must be used within a SiteProvider");
  }
  return context;
};
