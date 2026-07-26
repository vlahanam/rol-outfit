"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { api } from "@/lib/api";

type Props = {
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  label?: string;
  error?: string;
};

function filenameFromUrl(url: string): string {
  const raw = url.split("/").pop() ?? url;
  return raw.split("?")[0];
}

export function ImageUploader({
  value,
  onChange,
  required,
  label = "Ảnh",
  error,
  modelType,
  modelID,
}: Props & { modelType?: string; modelID?: string }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Ảnh không được vượt quá 10 MB");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const newUrl = await api.uploads.upload(file, modelType, modelID);
      if (value) {
        api.uploads.delete(filenameFromUrl(value)).catch(() => {});
      }
      onChange(newUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (value) {
      api.uploads.delete(filenameFromUrl(value)).catch(() => {});
    }
    onChange("");
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={`relative w-20 h-20 rounded-lg border-2 ${
          error ? "border-red-500" : "border-gray-300"
        } border-dashed overflow-hidden cursor-pointer hover:border-blue-400 transition-colors`}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {value ? (
          <Image src={value} alt={label} fill unoptimized className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <ImageIcon className="w-6 h-6 text-gray-400" />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <button
          type="button"
          onClick={() => !uploading && inputRef.current?.click()}
          className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
          disabled={uploading}
        >
          {value ? "Thay ảnh" : "Chọn ảnh"}
        </button>
        {!required && value && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-red-500 hover:text-red-600"
          >
            Xóa
          </button>
        )}
      </div>
      {(error || uploadError) && (
        <p className="mt-1 text-xs text-red-600">{error ?? uploadError}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
