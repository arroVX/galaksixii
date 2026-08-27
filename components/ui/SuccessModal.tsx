"use client";

import React from "react";
import { Modal } from "./Modal";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
  onAction?: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "Tutup",
  onAction
}) => {
  const handleAction = () => {
    if (onAction) onAction();
    else onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 mx-auto mb-4 flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>
        <h3 className="text-sm font-bold text-neutral-900 mb-1">{title}</h3>
        <p className="text-xs text-neutral-500 mb-6 leading-relaxed">{message}</p>
        <button
          onClick={handleAction}
          className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm"
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  );
};
