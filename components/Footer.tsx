"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export const Footer: React.FC = () => {
  const { isAdmin } = useAuth();

  return (
    <>
      <footer className="w-full bg-surface-container-low dark:bg-surface-container-highest mt-auto relative overflow-hidden border-t border-outline-variant/20">
        {/* Decorative Glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-32 bg-primary/5 blur-[80px] rounded-full pointer-events-none"></div>
        
        <div className="px-6 md:px-16 pt-16 pb-8 max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-12 mb-12">
            {/* Brand & Tagline */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <Link href="/" className="inline-block group mb-4">
                <Image src="/logo.png" alt="Galaksi XII Logo" width={512} height={512} className="h-20 md:h-28 w-auto object-contain group-hover:scale-105 transition-transform duration-300" />
              </Link>
              <p className="font-body-md text-on-surface-variant max-w-[320px] leading-relaxed">
                Merayakan kreativitas, sportivitas, dan potensi tak terbatas bersama SMKN 3 Jepara.
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col items-center md:items-start">
              <h3 className="font-label-md text-primary mb-6 uppercase tracking-[0.15em]">Tautan Cepat</h3>
              <div className="flex flex-col gap-4">
                <Link className="text-body-md font-body-md text-on-surface-variant hover:text-primary hover:translate-x-2 transition-all duration-300 flex items-center gap-2 group" href="/">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Beranda
                </Link>
                <Link className="text-body-md font-body-md text-on-surface-variant hover:text-primary hover:translate-x-2 transition-all duration-300 flex items-center gap-2 group" href="/kompetisi">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Kompetisi
                </Link>
                <Link className="text-body-md font-body-md text-on-surface-variant hover:text-primary hover:translate-x-2 transition-all duration-300 flex items-center gap-2 group" href="/">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Merchandise
                </Link>
                {isAdmin && (
                  <Link className="text-body-md font-body-md text-red-600 font-bold hover:translate-x-2 transition-all duration-300 flex items-center gap-2 group" href="/?view=admin">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Dashboard Admin
                  </Link>
                )}
              </div>
            </div>
          
          {/* Socials & Contact */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="font-label-md text-primary mb-6 uppercase tracking-[0.15em]">Terhubung</h3>
            <div className="flex gap-4">
              <a href="#" className="w-11 h-11 rounded-full bg-surface-container hover:bg-primary hover:text-on-primary border border-outline-variant/30 flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
                <span className="material-symbols-outlined text-[20px]">public</span>
              </a>
              <a href="#" className="w-11 h-11 rounded-full bg-surface-container hover:bg-primary hover:text-on-primary border border-outline-variant/30 flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
                <span className="material-symbols-outlined text-[20px]">share</span>
              </a>
              <a href="#" className="w-11 h-11 rounded-full bg-surface-container hover:bg-primary hover:text-on-primary border border-outline-variant/30 flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="w-full pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-label-sm font-label-sm text-on-surface-variant text-center md:text-left">
            &copy; {new Date().getFullYear()} GALAKSI XII SMKN 3 Jepara. Hak cipta dilindungi.
          </p>
        </div>
      </div>
      </footer>
    </>
  );
};
