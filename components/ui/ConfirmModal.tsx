"use client";

import React from "react";
import { Modal } from "./Modal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  variant = "default"
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="p-6 text-center">
        <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${
          variant === "danger" ? "bg-red-50 text-red-500" : "bg-neutral-100 text-neutral-600"
        }`}>
          <span className="material-symbols-outlined text-[24px]">
            {variant === "danger" ? "delete" : "help"}
          </span>
        </div>
        <h3 className="text-sm font-bold text-neutral-900 mb-1">{title}</h3>
        <p className="text-xs text-neutral-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl text-xs font-semibold transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm ${
              variant === "danger"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-neutral-900 hover:bg-neutral-800 text-white"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
