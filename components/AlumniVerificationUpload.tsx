"use client";

import React, { useState } from "react";
import { MAX_VERIFICATION_FILE_SIZE, ALLOWED_VERIFICATION_FILE_TYPES } from "@/data/alumniTicketBundles";

interface AlumniVerificationUploadProps {
  onFileChange: (fileUrl: string | null, fileName: string | null) => void;
  currentFileUrl?: string | null;
  currentFileName?: string | null;
  disabled?: boolean;
  label?: string;
  accept?: string;
}

export const AlumniVerificationUpload: React.FC<AlumniVerificationUploadProps> = ({
  onFileChange,
  currentFileUrl = null,
  currentFileName = null,
  disabled = false,
  label = "Upload Bukti Verifikasi (Kartu Pelajar / SKL)",
  accept = "image/*"
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentFileUrl);
  const [fileName, setFileName] = useState<string | null>(currentFileName);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_VERIFICATION_FILE_TYPES.includes(file.type)) {
      setError("Format file tidak didukung. Gunakan JPG, PNG, atau WebP.");
      return false;
    }
    if (file.size > MAX_VERIFICATION_FILE_SIZE) {
      setError(`Ukuran file terlalu besar. Maksimal 2MB (file Anda: ${(file.size / 1024 / 1024).toFixed(2)}MB).`);
      return false;
    }
    setError(null);
    return true;
  };

  const processFile = (file: File) => {
    if (!validateFile(file)) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setPreviewUrl(dataUrl);
        setFileName(file.name);
        onFileChange(dataUrl, file.name);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setPreviewUrl(null);
    setFileName(null);
    onFileChange(null, null);
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
        {label} <span className="text-red-500">*</span>
      </label>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-[16px]">error</span>
          {error}
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full flex items-center justify-center gap-2 bg-surface-container-lowest border-2 border-dashed rounded-xl p-6 cursor-pointer transition ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-surface"
        } ${isDragging ? "border-primary bg-primary/5" : ""}`}
      >
        <input
          type="file"
          accept={accept}
          className="hidden"
          id="verification-upload"
          onChange={handleFileSelect}
          disabled={disabled}
        />
        <label
          htmlFor="verification-upload"
          className="w-full h-full flex flex-col items-center justify-center gap-3 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[28px] text-outline">
            {previewUrl ? "image" : "upload_file"}
          </span>
          <span className="text-xs font-medium text-on-surface-variant text-center px-4">
            {previewUrl
              ? `${fileName || "File terpilih"}. Klik untuk mengubah.`
              : "Pilih file gambar / foto bukti verifikasi (Max 2MB)"}
          </span>
        </label>
      </div>

      {previewUrl && (
        <div className="relative bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-on-surface-variant truncate pr-4">
              {fileName || "Verifikasi"}
            </span>
            <button
              type="button"
              onClick={handleRemoveFile}
              disabled={disabled}
              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition flex-shrink-0"
              aria-label="Hapus file"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <img
            src={previewUrl}
            alt="Preview verifikasi"
            className="w-full max-h-48 object-contain rounded-lg bg-white border border-outline-variant/30"
          />
        </div>
      )}

      <p className="text-[10px] text-on-surface-variant text-center">
        Format: JPG, PNG, WebP • Maksimal 2MB • Akan dikompres otomatis (max 800px)
      </p>
    </div>
  );
};