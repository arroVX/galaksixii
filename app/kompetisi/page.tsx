"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { AuthModal } from "@/components/AuthModal";
import { AdminAuthModal } from "@/components/AdminAuthModal";
import { OrderTrackingModal } from "@/components/OrderTrackingModal";
import { DevModal } from "@/components/DevModal";
import { useCart } from "@/context/CartContext";

type SportType = "basket" | "futsal" | "voli";
type TabType = "bracket" | "rules" | "schedule";

export default function KompetisiPage() {
  const router = useRouter();
  const { toastMessage } = useCart();
  const [sport, setSport] = useState<SportType>("basket");
  const [activeTab, setActiveTab] = useState<TabType>("bracket");

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);
  const [isDevModalOpen, setIsDevModalOpen] = useState(true);

  const getSportDetails = () => {
    switch (sport) {
      case "futsal":
        return { name: "Futsal", emoji: "⚽" };
      case "voli":
        return { name: "Voli", emoji: "🏐" };
      case "basket":
      default:
        return { name: "Basket", emoji: "🏀" };
    }
  };

  const { name: sportName, emoji: sportEmoji } = getSportDetails();

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-body-md selection:bg-primary selection:text-on-primary">
      {/* Global Toast used instead */}

      <Navbar
        searchQuery=""
        setSearchQuery={() => {}}
        openAuthModal={() => setIsAuthOpen(true)}
        openAdminAuthModal={() => setIsAdminAuthOpen(true)}
        openOrderTracking={() => setIsOrderTrackingOpen(true)}
        activeView="shop"
        setActiveView={() => {}}
      />

      <main className="w-full max-w-7xl mx-auto px-6 md:px-16 py-6 md:py-10 flex-grow relative">
        {/* Page Header */}
        <section className="mb-10 fade-in relative">
          <div className="relative w-full rounded-3xl bg-gradient-to-br from-[#1b3419] via-[#244222] to-[#122411] text-white p-6 sm:p-10 shadow-2xl overflow-hidden mb-8">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-10 overflow-hidden">
              <span className="font-bold text-[80px] sm:text-[130px] md:text-[180px] leading-none tracking-tighter text-white uppercase text-center font-display-lg whitespace-nowrap">
                LEAGUE
              </span>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-4 py-1.5 rounded-full mb-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-white/90">LIGA OLAHRAGA • GALAKSI XII</span>
                </div>
                <h1 className="font-headline-md text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-3 leading-tight flex items-center gap-3">
                  <span>Liga {sportName}</span>
                  <span className="inline-block text-3xl sm:text-5xl animate-bounce filter drop-shadow">{sportEmoji}</span>
                </h1>
                <p className="font-body-md text-sm sm:text-base text-white/75 leading-relaxed">
                  Turnamen cabang {sportName} dalam festival Gala Aksi Siswa peringatan HUT SMKN 3 Jepara. Saksikan & dukung tim favoritmu hingga babak final!
                </p>
              </div>

              {/* Sport Selector Pill Chips */}
              <div className="flex flex-wrap gap-2.5 z-10 w-full md:w-auto">
                <button onClick={() => setSport("basket")} className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-2 ${sport === 'basket' ? 'bg-white text-[#1b3419]' : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-md border border-white/15'}`}>
                  <span>Basketball</span>
                  <span>🏀</span>
                </button>
                <button onClick={() => setSport("futsal")} className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-2 ${sport === 'futsal' ? 'bg-white text-[#1b3419]' : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-md border border-white/15'}`}>
                  <span>Futsal</span>
                  <span>⚽</span>
                </button>
                <button onClick={() => setSport("voli")} className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-2 ${sport === 'voli' ? 'bg-white text-[#1b3419]' : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-md border border-white/15'}`}>
                  <span>Volleyball</span>
                  <span>🏐</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide fade-in relative z-10">
          <button onClick={() => setActiveTab("bracket")} className={`px-6 py-3 rounded-full text-xs transition-all whitespace-nowrap ${activeTab === "bracket" ? "font-bold bg-[#1b3419] text-white shadow-md" : "font-medium bg-surface-container-low text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container"}`}>
            🏆 Bagan Pertandingan (Bracket)
          </button>
          <button onClick={() => setActiveTab("rules")} className={`px-6 py-3 rounded-full text-xs transition-all whitespace-nowrap ${activeTab === "rules" ? "font-bold bg-[#1b3419] text-white shadow-md" : "font-medium bg-surface-container-low text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container"}`}>
            📜 Info & Peraturan
          </button>
          <button onClick={() => setActiveTab("schedule")} className={`px-6 py-3 rounded-full text-xs transition-all whitespace-nowrap ${activeTab === "schedule" ? "font-bold bg-[#1b3419] text-white shadow-md" : "font-medium bg-surface-container-low text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container"}`}>
            📅 Jadwal Harian
          </button>
        </div>

        {/* Tab Panel 1: Tournament Bracket Section */}
        {activeTab === "bracket" && (
          <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 md:p-10 shadow-xl fade-in relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
            <div className="absolute -top-4 left-6 text-6xl opacity-15 select-none pointer-events-none animate-pulse">{sportEmoji}</div>
            <div className="absolute bottom-6 right-8 text-7xl opacity-15 select-none pointer-events-none animate-bounce">{sportEmoji}</div>

            <div className="flex justify-between items-center mb-12 relative z-10">
              <h2 className="font-headline-md text-2xl md:text-3xl text-primary flex items-center gap-2">
                <span>Playoffs Phase - {sportName}</span>
                <span className="text-2xl animate-pulse">{sportEmoji}</span>
              </h2>
            </div>

            {/* Mock Bracket Visual (Static HTML Translation) */}
            <div className="overflow-x-auto pb-12 relative z-10 custom-scrollbar">
              <div className="flex flex-nowrap min-w-[800px] md:min-w-[1000px] gap-12 items-center relative">
                
                {/* Round 1 (Quarter Finals) */}
                <div className="flex flex-col justify-around gap-12 w-64 relative z-10">
                  <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest text-center mb-6 border-b border-outline-variant pb-2">Quarter Finals</h3>
                  {/* Match 1 */}
                  <div className="bg-[#fbf9f8] rounded-lg border border-outline-variant p-4 relative group hover:border-primary transition-colors cursor-pointer shadow-sm hover:shadow-md">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-on-surface-variant">M1 • Oct 15</span>
                      <span className="text-xs font-semibold bg-surface-container-low px-2 py-0.5 rounded text-gray-500">Final</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary text-[10px] font-bold">TG</div>
                        <span className="text-sm font-bold text-primary">Tim Garuda</span>
                      </div>
                      <span className="text-sm font-bold">78</span>
                    </div>
                    <div className="h-px w-full bg-outline-variant my-1"></div>
                    <div className="flex justify-between items-center py-1 opacity-60">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant text-[10px] font-bold">TE</div>
                        <span className="text-sm">Tim Elang</span>
                      </div>
                      <span className="text-sm">64</span>
                    </div>
                    <div className="absolute right-[-48px] top-1/2 w-12 h-px bg-outline-variant"></div>
                  </div>
                  {/* Match 2 */}
                  <div className="bg-[#fbf9f8] rounded-lg border border-outline-variant p-4 relative group hover:border-primary transition-colors cursor-pointer shadow-sm hover:shadow-md mt-12">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-on-surface-variant">M2 • Oct 15</span>
                      <span className="text-xs font-semibold bg-surface-container-low px-2 py-0.5 rounded text-gray-500">Final</span>
                    </div>
                    <div className="flex justify-between items-center py-1 opacity-60">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant text-[10px] font-bold">TM</div>
                        <span className="text-sm">Tim Macan</span>
                      </div>
                      <span className="text-sm">52</span>
                    </div>
                    <div className="h-px w-full bg-outline-variant my-1"></div>
                    <div className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary text-[10px] font-bold">TS</div>
                        <span className="text-sm font-bold text-primary">Tim Singa</span>
                      </div>
                      <span className="text-sm font-bold">58</span>
                    </div>
                    <div className="absolute right-[-24px] top-1/2 w-6 h-px bg-outline-variant"></div>
                    <div className="absolute right-[-24px]" style={{ top: "-110px", height: "180px", width: "1px", backgroundColor: "#c4c7c7" }}></div>
                  </div>
                </div>

                {/* Round 2 (Semi Finals) */}
                <div className="flex flex-col justify-around gap-12 w-64 relative z-10">
                  <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest text-center mb-6 border-b border-outline-variant pb-2">Semi Finals</h3>
                  <div className="bg-[#fbf9f8] rounded-lg border border-primary p-4 relative group shadow-sm ring-1 ring-primary/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-on-surface-variant">M3 • Oct 18</span>
                      <span className="text-xs bg-black/10 text-black font-bold px-2 py-0.5 rounded">Live</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary text-[10px] font-bold">TG</div>
                        <span className="text-sm font-bold text-primary">Tim Garuda</span>
                      </div>
                      <span className="text-sm font-bold">72</span>
                    </div>
                    <div className="h-px w-full bg-outline-variant my-1"></div>
                    <div className="flex justify-between items-center py-1 opacity-60">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant text-[10px] font-bold">TS</div>
                        <span className="text-sm">Tim Singa</span>
                      </div>
                      <span className="text-sm">68</span>
                    </div>
                    <div className="absolute right-[-48px] top-1/2 w-12 h-px bg-outline-variant"></div>
                  </div>
                </div>

                {/* Round 3 (Finals) */}
                <div className="flex flex-col justify-center gap-12 w-64 relative z-10">
                  <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest text-center mb-6 border-b border-outline-variant pb-2">Finals</h3>
                  <div className="bg-[#fbf9f8] rounded-lg border-2 border-primary p-5 relative group shadow-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-on-surface-variant">Grand Final • Oct 20</span>
                      <span className="text-xs bg-primary text-on-primary px-2 py-0.5 rounded font-bold">Upcoming</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-xs font-bold">TG</div>
                        <span className="text-lg font-bold text-primary">Tim Garuda</span>
                      </div>
                      <span className="text-lg font-bold text-primary">-</span>
                    </div>
                    <div className="h-px w-full bg-outline-variant my-2"></div>
                    <div className="flex justify-between items-center py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant text-xs font-bold">TBD</div>
                        <span className="text-lg text-on-surface-variant">Winner M4</span>
                      </div>
                      <span className="text-lg text-on-surface-variant">-</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="mt-8 bg-gradient-to-r from-[#1b3419] via-[#244222] to-[#122411] text-white rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-white/10 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-[22px]">emoji_events</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Grand Final Liga {sportName}</h4>
                  <p className="text-xs text-white/70">Saksikan pertandingan puncaknya secara live di SMKN 3 Jepara</p>
                </div>
              </div>
              
              <Link href="/merchandise" className="w-full sm:w-auto bg-white text-[#1b3419] hover:bg-white/90 font-bold px-6 py-3 rounded-full text-xs transition-all shadow flex items-center justify-center gap-2 active:scale-95">
                <span>Beli Merchandise Official</span>
                <div className="flex items-center text-[#1b3419]/40 tracking-[0.2em] font-bold text-xs select-none">
                  &gt;&gt;&gt;
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* Tab Panel 2: Info & Rules Section */}
        {activeTab === "rules" && (
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 md:p-12 shadow-sm fade-in relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
              <span className="text-3xl">📋</span>
              <div>
                <h2 className="font-headline-md text-2xl text-primary font-bold">Info &amp; Peraturan Pertandingan {sportName}</h2>
                <p className="text-sm text-on-surface-variant mt-1">Ketentuan umum dan regulasi teknis untuk seluruh peserta Liga {sportName} Galaksi XII SMKN 3 Jepara.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#fbf9f8] rounded-2xl p-6 border border-outline-variant shadow-sm">
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <span className="material-symbols-outlined text-2xl">gavel</span>
                  <h3 className="text-xl font-bold font-headline-md">Ketentuan Umum Peserta</h3>
                </div>
                <ul className="space-y-3 text-sm text-on-surface-variant font-medium">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-emerald-500 text-lg shrink-0">check_circle</span>
                    <span>Setiap tim wajib mendaftarkan susunan pemain resmi (pemain utama &amp; cadangan) dan 1 official pelatih.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span class="material-symbols-outlined text-emerald-500 text-lg shrink-0">check_circle</span>
                    <span>Seluruh pemain merupakan siswa aktif berstatus pelajar dan wajib membawa Kartu Tanda Pelajar saat registrasi ulang.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span class="material-symbols-outlined text-emerald-500 text-lg shrink-0">check_circle</span>
                    <span>Toleransi keterlambatan kehadiran di lapangan maksimal 10 menit dari jadwal tanding. Lebih dari itu dinyatakan WO.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#fbf9f8] rounded-2xl p-6 border border-outline-variant shadow-sm">
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <span className="material-symbols-outlined text-2xl">timer</span>
                  <h3 className="text-xl font-bold font-headline-md">Regulasi Teknis {sportName}</h3>
                </div>
                <ul className="space-y-3 text-sm text-on-surface-variant font-medium">
                  {sport === "basket" && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-lg shrink-0">sports_basketball</span>
                        <span>Durasi Pertandingan: 4 x 10 Menit (Waktu bersih 2 menit terakhir di Kuarter 4).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-lg shrink-0">sports_basketball</span>
                        <span>Aturan Foul: 5 x Personal Foul disqualification, 2 x Timeout per babak (1 menit).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-lg shrink-0">sports_basketball</span>
                        <span>Pakaian: Wajib mengenakan jersey bernomor punggung seragam &amp; sepatu basket non-marking.</span>
                      </li>
                    </>
                  )}
                  {sport === "futsal" && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-emerald-500 text-lg shrink-0">sports_soccer</span>
                        <span>Durasi Pertandingan: 2 x 15 Menit kotor dengan istirahat 5 menit antar babak.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-emerald-500 text-lg shrink-0">sports_soccer</span>
                        <span>Aturan Fouls: Akumulasi 5 x Foul dalam 1 babak menghasilkan penalti titik kedua (10 meter).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-emerald-500 text-lg shrink-0">sports_soccer</span>
                        <span>Perlengkapan: Wajib mengenakan pelindung tulang kering (shin guard) &amp; sepatu futsal.</span>
                      </li>
                    </>
                  )}
                  {sport === "voli" && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-blue-500 text-lg shrink-0">sports_volleyball</span>
                        <span>Sistem Skor: Rally Point 25 Poin (Best of 3 Sets / 2 set kemenangan).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-blue-500 text-lg shrink-0">sports_volleyball</span>
                        <span>Rotasi &amp; Substitution: Maksimal 6 x pergantian pemain per set.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-blue-500 text-lg shrink-0">sports_volleyball</span>
                        <span>Tinggi Net: Standar PBVSI (Putra 2.43m / Putri 2.24m).</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Tab Panel 3: Daily Schedule Section */}
        {activeTab === "schedule" && (
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 md:p-12 shadow-sm fade-in relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
              <span className="text-3xl">📅</span>
              <div>
                <h2 className="font-headline-md text-2xl text-primary font-bold">Jadwal Harian (Daily Schedule) Liga {sportName}</h2>
                <p className="text-sm text-on-surface-variant mt-1">Jadwal lengkap jam tanding &amp; venue babak penyisihan hingga final di SMKN 3 Jepara.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-[#fbf9f8] rounded-2xl p-5 border border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4 hover:border-primary transition-colors">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="bg-surface-container-high px-4 py-2 rounded-xl text-center shrink-0">
                    <span className="block text-xs text-on-surface-variant font-bold">15 OKT</span>
                    <span className="block text-sm font-bold text-primary">08:30 WIB</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quarter Final • Match 1</span>
                    <h4 className="font-headline-md text-lg font-bold text-primary">Tim Garuda vs Tim Elang</h4>
                    <span className="text-xs text-on-surface-variant">Lapangan Utama SMKN 3 Jepara</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Selesai (78 - 64)</span>
                </div>
              </div>

              <div className="bg-[#fbf9f8] rounded-2xl p-5 border border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4 hover:border-primary transition-colors">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="bg-surface-container-high px-4 py-2 rounded-xl text-center shrink-0">
                    <span className="block text-xs text-on-surface-variant font-bold">15 OKT</span>
                    <span className="block text-sm font-bold text-primary">10:45 WIB</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quarter Final • Match 2</span>
                    <h4 className="font-headline-md text-lg font-bold text-primary">Tim Macan vs Tim Singa</h4>
                    <span className="text-xs text-on-surface-variant">Lapangan Utama SMKN 3 Jepara</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Selesai (52 - 58)</span>
                </div>
              </div>

              <div className="bg-[#fbf9f8] rounded-2xl p-5 border-2 border-primary/30 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-primary transition-colors">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="bg-primary text-on-primary px-4 py-2 rounded-xl text-center shrink-0">
                    <span className="block text-xs font-bold opacity-80">18 OKT</span>
                    <span className="block text-sm font-bold">13:30 WIB</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">Semi Final • Live Today</span>
                    <h4 className="font-headline-md text-lg font-bold text-primary">Tim Garuda vs Tim Singa</h4>
                    <span className="text-xs text-on-surface-variant">Gor Olahraga SMKN 3 Jepara</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <span className="px-3.5 py-1.5 bg-primary text-on-primary text-xs font-bold rounded-full animate-pulse">Sedang Berlangsung (Live)</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* League Documentation Section */}
        <section className="mt-16 mb-8 fade-in">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 text-left">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#1b3419]/10 text-[#1b3419] px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                Dokumentasi & Galeri Liga
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold font-headline-md text-primary leading-tight">
                Momen Terbaik Pertandingan
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl mt-1 opacity-80">
                Koleksi foto aksi lapangan, selebrasi tim juara, dan semangat para supporter di Liga Olahraga GALAKSI XII.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest rounded-3xl p-3 border border-outline-variant/30 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-900 mb-3">
                <img src="https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80" alt="Dokumentasi Basket" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                <span className="absolute top-3 left-3 bg-amber-500 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">🏀 Basket Final</span>
              </div>
              <div className="px-2 pb-2 flex flex-col flex-grow">
                <h3 className="font-bold text-base text-primary mb-1 group-hover:text-emerald-700 transition-colors">Sengit! Final Turnamen Basketball Putra</h3>
                <p className="text-xs text-on-surface-variant opacity-80 line-clamp-2 leading-relaxed mb-4">Pertandingan sengit antara Tim Garuda dan Tim Elang memperebutkan piala bergilir Galaksi XII.</p>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-3xl p-3 border border-outline-variant/30 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-900 mb-3">
                <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80" alt="Dokumentasi Futsal" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">⚽ Futsal Derby</span>
              </div>
              <div className="px-2 pb-2 flex flex-col flex-grow">
                <h3 className="font-bold text-base text-primary mb-1 group-hover:text-emerald-700 transition-colors">Aksi Memukau Babak Perempat Final Futsal</h3>
                <p className="text-xs text-on-surface-variant opacity-80 line-clamp-2 leading-relaxed mb-4">Sorak sorai penonton memadati tribun lapangan futsal saat tendangan penalti penentu terjadi.</p>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-3xl p-3 border border-outline-variant/30 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-900 mb-3">
                <img src="https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=800&q=80" alt="Dokumentasi Voli" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">🏐 Voli Putri</span>
              </div>
              <div className="px-2 pb-2 flex flex-col flex-grow">
                <h3 className="font-bold text-base text-primary mb-1 group-hover:text-emerald-700 transition-colors">Smash Tajam Di Pertandingan Voli Putri</h3>
                <p className="text-xs text-on-surface-variant opacity-80 line-clamp-2 leading-relaxed mb-4">Momen spektakuler spike dan defense apik dari tim voli putri mengamankan tempat final.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />

      <CartDrawer />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <AdminAuthModal isOpen={isAdminAuthOpen} onClose={() => setIsAdminAuthOpen(false)} onSuccess={() => {}} />
      <OrderTrackingModal isOpen={isOrderTrackingOpen} onClose={() => setIsOrderTrackingOpen(false)} />
      <DevModal isOpen={isDevModalOpen} onClose={() => { setIsDevModalOpen(false); router.push("/merchandise"); }} />
    </div>
  );
}
