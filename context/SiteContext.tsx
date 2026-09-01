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
    const saved = localStorage.getItem(SITE_SETTINGS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SiteSettings;
        queueMicrotask(() => {
          if (!cancelled) setSiteSettings(parsed);
        });
      } catch {}
    }

    // 2. Fetch sinkronisasi dari Firebase
    fetchSiteSettings()
      .then((fbSettings) => {
        if (cancelled) return;
        setSiteSettings(fbSettings);
        localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(fbSettings));
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateLocalSettings = (settings: SiteSettings) => {
    setSiteSettings(settings);
    localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));
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
