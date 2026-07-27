"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface DevModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export const DevModal: React.FC<DevModalProps> = ({
  isOpen,
  onClose,
  title = "Dalam Pengembangan",
  message = "Fitur ini masih dalam proses pengembangan"
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center space-y-5 border border-amber-100 transform scale-100 animate-scale-up">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center mx-auto shadow-inner">
          <span className="material-symbols-outlined text-[36px]">construction</span>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-gray-900 font-headline-md">{title}</h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-body-md">
            {message}
          </p>
        </div>

        {/* Button */}
        <button
          onClick={onClose}
          className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-3 px-6 rounded-full text-xs transition-all shadow-md active:scale-95"
        >
          Mengerti
        </button>
      </div>
    </div>,
    document.body
  );
};
