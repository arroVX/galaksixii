"use client";

import React, { useState } from "react";
import { useSiteSettings } from "@/context/SiteContext";
import { saveSiteSettings } from "@/lib/firebaseService";

export const AdminSettings: React.FC = () => {
  const { siteSettings, updateLocalSettings } = useSiteSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleToggle = (page: keyof typeof siteSettings, field: "visible" | "locked") => {
    const newSettings = {
      ...siteSettings,
      [page]: {
        ...siteSettings[page],
        [field]: !siteSettings[page][field],
      },
    };
    updateLocalSettings(newSettings);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    const ok = await saveSiteSettings(siteSettings);
    if (ok) {
      setSaveMessage({ type: "success", text: "Pengaturan berhasil disimpan ke server!" });
    } else {
      setSaveMessage({ type: "error", text: "Gagal menyimpan pengaturan ke server. Coba lagi." });
    }
    setIsSaving(false);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const pages = [
    { key: "merchandise", label: "Toko / Merchandise Umum" },
    { key: "tiketAlumni", label: "Tiket & Bundling Alumni" },
    { key: "orders", label: "Cek Pesanan" },
  ] as const;

  return (
    <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 font-headline-md">Pengaturan Halaman</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Atur visibilitas (tampilkan/sembunyikan) dan status kunci (wajib login) untuk setiap halaman.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">save</span>
          )}
          Simpan ke Server
        </button>
      </div>

      {saveMessage && (
        <div
          className={`p-4 mb-6 rounded-xl flex items-center gap-2 text-sm font-semibold ${
            saveMessage.type === "success"
              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
              : "bg-red-50 text-red-600 border border-red-100"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {saveMessage.type === "success" ? "check_circle" : "error"}
          </span>
          {saveMessage.text}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-neutral-100 text-xs font-bold text-neutral-400 uppercase tracking-wider">
              <th className="py-3 px-4">Halaman</th>
              <th className="py-3 px-4 text-center">Tampilkan di Navigasi</th>
              <th className="py-3 px-4 text-center">Wajib Login (Kunci)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {pages.map((page) => (
              <tr key={page.key} className="hover:bg-neutral-50/50 transition-colors">
                <td className="py-4 px-4">
                  <div className="font-semibold text-neutral-800 text-sm">{page.label}</div>
                  <div className="text-xs text-neutral-500 font-mono mt-1">/{page.key === "tiketAlumni" ? "tiket-alumni" : page.key}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleToggle(page.key, "visible")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        siteSettings[page.key].visible ? "bg-emerald-500" : "bg-neutral-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          siteSettings[page.key].visible ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleToggle(page.key, "locked")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        siteSettings[page.key].locked ? "bg-red-500" : "bg-neutral-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform flex items-center justify-center ${
                          siteSettings[page.key].locked ? "translate-x-6" : "translate-x-1"
                        }`}
                      >
                        {siteSettings[page.key].locked && (
                          <span className="material-symbols-outlined text-[10px] text-red-500">lock</span>
                        )}
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
