import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface ImageUploadProps {
  label?: string;
  value?: Id<"_storage">;
  onChange: (storageId: Id<"_storage"> | null) => void;
  className?: string;
}

export function ImageUpload({ label, value, onChange, className = "" }: ImageUploadProps) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // TODO: Add a query to get the image URL from storageId for preview
  // For now we just show the uploaded state

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // 1. Get upload URL
      const postUrl = await generateUploadUrl();

      // 2. Upload file
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.statusText}`);
      }

      const { storageId } = await result.json();
      onChange(storageId);

      // Create local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error("Upload failed:", error);
      // Could add error toast here
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`form-control w-full ${className}`}>
      {label && (
        <label className="label">
          <span className="label-text font-medium">{label}</span>
        </label>
      )}

      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative group">
            <div className="w-24 h-24 rounded-xl border border-base-300 overflow-hidden bg-base-200 flex items-center justify-center">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-base-content/40" />
              )}
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 btn btn-circle btn-xs btn-error shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`w-24 h-24 rounded-xl border-2 border-dashed border-base-300 hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors bg-base-100 hover:bg-base-200/50 ${
              isUploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-base-content/40" />
                <span className="text-[10px] text-base-content/60">Subir</span>
              </>
            )}
          </div>
        )}
        
        {value && !preview && (
          <div className="text-sm text-base-content/60">
            Imagen guardada
            <br />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className="link link-primary text-xs"
            >
              Cambiar imagen
            </button>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*,application/pdf"
        className="hidden"
      />
    </div>
  );
}
