"use client";

import React, { useRef } from "react";
import { Upload, ImageIcon, X, Check } from "lucide-react";

interface ImageUploadBoxProps {
  imagePreview: string | null;
  onImageSelect: (file: File | null, previewUrl: string | null) => void;
  onError?: (errorMessage: string) => void;
}

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const ImageUploadBox: React.FC<ImageUploadBoxProps> = ({
  imagePreview,
  onImageSelect,
  onError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_SIZE_BYTES) {
        if (onError) onError("Image file exceeds the 5 MB size limit.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
        if (onError) onError("Unsupported format. Only JPG, JPEG, PNG, and WEBP images are allowed.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const url = URL.createObjectURL(file);
      onImageSelect(file, url);
    }
  };

  const handleRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onImageSelect(null, null);
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        id="problem-image-upload"
      />

      {!imagePreview ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#075E43]/30 bg-[#E8F8F2]/40 p-4 transition-all hover:border-[#075E43] hover:bg-[#E8F8F2] focus:outline-none focus:ring-2 focus:ring-[#075E43]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F8F2] text-[#075E43] border border-[#075E43]/30 group-hover:scale-110 transition-transform">
            <Upload className="h-5 w-5" />
          </div>
          <p className="mt-2 text-xs font-semibold text-[#17233C]">
            Attach Photo of Problem (Optional)
          </p>
          <p className="mt-0.5 text-[11px] text-[#5F718A]">
            JPG, PNG or WEBP (Max 5MB) • AI Visual Scan
          </p>
        </button>
      ) : (
        <div className="relative flex items-center justify-between rounded-2xl border border-[#075E43]/30 bg-[#E8F8F2]/60 p-3">
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-[#D9E1E8] bg-white shadow-xs">
              <img
                src={imagePreview}
                alt="Problem preview"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#17233C]">
                <ImageIcon className="h-3.5 w-3.5 text-[#075E43]" />
                Photo Attached
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                <Check className="h-3 w-3" /> Ready for AI visual analysis
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D9E1E8] bg-white text-[#17233C] hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Remove photo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
