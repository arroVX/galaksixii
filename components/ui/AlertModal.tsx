"use client";

import React from "react";
import { Modal } from "./Modal";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: string;
  iconColor?: "red" | "amber" | "emerald" | "neutral";
  buttonText?: string;
}

const iconColorMap = {
  red: "bg-red-50 text-red-500",
  amber: "bg-amber-50 text-amber-500",
  emerald: "bg-emerald-50 text-emerald-500",
  neutral: "bg-neutral-100 text-neutral-600"
};

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  icon = "info",
  iconColor = "neutral",
  buttonText = "Mengerti"
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="p-6 text-center">
        <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${iconColorMap[iconColor]}`}>
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>
        <h3 className="text-sm font-bold text-neutral-900 mb-1">{title}</h3>
        <p className="text-xs text-neutral-500 mb-6 leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm"
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  );
};
