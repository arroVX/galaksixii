"use client";

import React, { useState } from "react";
import { ArrowRight, Search, ShoppingBag, User, X, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface MobileOnboardingProps {
  onComplete: () => void;
  onSearch: (q: string) => void;
}

export const MobileOnboarding: React.FC<MobileOnboardingProps> = ({ onComplete, onSearch }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [searchInput, setSearchInput] = useState("");

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else {
      onComplete();
    }
  };

  const handleQuickTagClick = (query: string) => {
    onSearch(query);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A] text-white flex flex-col font-sans overflow-hidden animate-in fade-in md:hidden">
      
      {/* STEP 1: DARK LUXURY ONBOARDING (Matching CHICKIDS Left Phone) */}
      {step === 1 && (
        <div className="flex-1 flex flex-col items-center justify-between p-6 pb-10 overflow-y-auto animate-in fade-in">
          
          {/* Top Brand Name */}
          <div className="w-full text-center pt-8 pb-4">
            <h1 className="text-xl font-bold tracking-[0.2em] font-sans text-white/90 uppercase">
              DREAMORA
            </h1>
          </div>
          
          {/* Main Hero Image (Like the kid model in the reference) */}
          <div className="flex-1 w-full flex items-center justify-center relative">
             {/* A subtle dark gradient behind to blend the image */}
             <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent z-10 pointer-events-none"></div>
             <img
                src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800&auto=format&fit=crop"
                alt="Galaksi XII Model"
                className="w-full h-full max-h-[50vh] object-contain rounded-3xl object-bottom relative z-0"
             />
          </div>

          {/* Welcome Text Section */}
          <div className="w-full text-center space-y-4 pt-6 relative z-20">
            <h2 className="text-[28px] leading-[1.1] font-bold font-sans tracking-tight text-white uppercase">
              GET READY FOR <br />
              DREAMORA GALAKSI XII
            </h2>

            <p className="text-sm text-white/50 leading-relaxed max-w-[280px] mx-auto font-medium">
              Discover Trendy Outfits, Chic Accessories.<br/>Cozy Essentials for Students of All Ages.
            </p>

            <div className="pt-6">
              <button
                onClick={handleNext}
                className="w-full py-4 px-6 rounded-full bg-white hover:bg-gray-100 text-[#1A1A1A] font-bold text-sm shadow-xl flex items-center justify-between transition transform active:scale-95"
              >
                <span className="pl-4 uppercase tracking-wider">GET STARTED</span>
                <div className="flex items-center text-white/30 gap-0.5 pr-2">
                  <ChevronRight size={16} />
                  <ChevronRight size={16} />
                  <ChevronRight size={16} />
                </div>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* STEP 2: "NEED ANYTHING?" SEARCH & QUICK TAGS (Light Theme matching CHICKIDS Middle Phone) */}
      {step === 2 && (
        <div className="absolute inset-0 bg-[#F8F8F6] text-slate-900 flex-1 flex flex-col justify-between p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right-5">
          
          <div className="space-y-6">
            {/* User Greeting Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={user?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                  alt="User"
                  className="w-10 h-10 rounded-full object-cover border border-slate-300 shadow-sm"
                />
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block font-bold uppercase">Welcome back</span>
                  <h4 className="font-bold text-slate-900 text-sm font-sans uppercase tracking-tight">
                    {user?.displayName?.split(" ")[0] || "STUDENT / ALUMNI"}
                  </h4>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-900">
                <ShoppingBag size={20} strokeWidth={1.5} />
              </div>
            </div>

            {/* Big "Need anything?" Section */}
            <div className="text-center space-y-3 pt-6">
              <h2 className="text-3xl font-black font-serif-title tracking-tight text-slate-900">
                Need anything?
              </h2>

              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto font-medium">
                Sistem pintar kami membantu temukan merchandise suvenir & cabang lomba edisi GALAKSI XII lebih cepat dari sebelumnya.
              </p>

              {/* Pill Search Input Capsule */}
              <div className="pt-4">
                <div className="relative bg-white border border-slate-300/80 rounded-full p-2 pl-4 flex items-center gap-2 shadow-lg shadow-slate-200/50">
                  <Search size={18} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Cari merchandise, stiker, kaos..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onSearch(searchInput);
                        onComplete();
                      }
                    }}
                    className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
                  />

                  <button
                    onClick={() => {
                      if (searchInput) onSearch(searchInput);
                      onComplete();
                    }}
                    className="w-9 h-9 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center shadow-md shrink-0 hover:bg-black transition"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* Horizontal Tag Pills (Matching ALL, NEW IN, PARTYCHIC) */}
              <div className="flex items-center justify-center gap-2 flex-wrap pt-3 text-[11px] font-bold">
                <button
                  onClick={() => handleQuickTagClick("Semua")}
                  className="px-4 py-1.5 rounded-full bg-[#1A1A1A] text-white shadow-sm flex items-center"
                >
                  <span>ALL</span>
                </button>

                <button
                  onClick={() => handleQuickTagClick("Baru")}
                  className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-100 flex items-center"
                >
                  <span>NEW IN</span>
                </button>

                <button
                  onClick={() => handleQuickTagClick("Aksesoris")}
                  className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-100 flex items-center"
                >
                  <span>ACCESSORIES</span>
                </button>
              </div>

            </div>
          </div>

          {/* Bottom Action Button */}
          <div className="pt-4 pb-6">
            <button
              onClick={onComplete}
              className="w-full py-4 px-6 rounded-full bg-[#1A1A1A] hover:bg-black text-white font-bold text-xs shadow-xl flex items-center justify-center gap-2 transition transform active:scale-95"
            >
              <span>EXPLORE NOW</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
