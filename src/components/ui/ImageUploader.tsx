import { useRef, useState } from "react";
import { Camera, X, Upload, Loader2, User, Image as ImageIcon } from "lucide-react";
import { useCloudinary, type ImageContext } from "../../hooks/useCloudinary";

interface ImageUploaderProps {
  // Current image URL (if any)
  value?: string | null;
  // Callback when image changes (new URL or null if removed)
  onChange: (url: string | null) => void;
  // Cloudinary context
  familyId: string;
  context: ImageContext;
  entityId?: string;
  // UI customization
  shape?: "circle" | "square" | "rounded";
  size?: "sm" | "md" | "lg" | "xl";
  placeholder?: "user" | "image" | "camera";
  label?: string;
  disabled?: boolean;
  // Optional class for container
  className?: string;
}

const SIZE_CLASSES = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
  xl: "w-40 h-40",
};

const SHAPE_CLASSES = {
  circle: "rounded-full",
  square: "rounded-none",
  rounded: "rounded-xl",
};

const ICON_SIZES = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
  xl: "w-12 h-12",
};

export function ImageUploader({
  value,
  onChange,
  familyId,
  context,
  entityId,
  shape = "circle",
  size = "md",
  placeholder = "user",
  label,
  disabled = false,
  className = "",
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { upload, remove, isUploading, isDeleting, error, progress } = useCloudinary({
    familyId,
    context,
    entityId,
    onSuccess: (url) => {
      setPreviewUrl(null);
      onChange(url);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona una imagen");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("La imagen es muy grande. Máximo 10MB");
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    await upload(file, value || undefined);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!value) return;
    
    const success = await remove(value);
    if (success) {
      onChange(null);
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading && !isDeleting) {
      fileInputRef.current?.click();
    }
  };

  const isLoading = isUploading || isDeleting;
  const displayUrl = previewUrl || value;

  const PlaceholderIcon = {
    user: User,
    image: ImageIcon,
    camera: Camera,
  }[placeholder];

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Image container */}
      <div className="relative">
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || isLoading}
          className={`
            ${SIZE_CLASSES[size]}
            ${SHAPE_CLASSES[shape]}
            overflow-hidden
            bg-base-200
            border-2 border-dashed border-base-300
            hover:border-primary hover:bg-base-300
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            transition-all duration-200
            flex items-center justify-center
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            ${displayUrl ? "border-solid border-base-300" : ""}
          `}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-1">
              <Loader2 className={`${ICON_SIZES[size]} animate-spin text-primary`} />
              {isUploading && progress > 0 && (
                <span className="text-xs text-base-content/60">{progress}%</span>
              )}
            </div>
          ) : displayUrl ? (
            <img
              src={displayUrl}
              alt="Preview"
              className={`w-full h-full object-cover ${SHAPE_CLASSES[shape]}`}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-base-content/40">
              <PlaceholderIcon className={ICON_SIZES[size]} />
              {size !== "sm" && (
                <Upload className="w-3 h-3" />
              )}
            </div>
          )}
        </button>

        {/* Remove button */}
        {displayUrl && !isLoading && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            className="absolute -top-1 -right-1 btn btn-circle btn-xs btn-error shadow-md"
            title="Eliminar imagen"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Camera overlay for non-empty states */}
        {displayUrl && !isLoading && !disabled && (
          <div
            onClick={handleClick}
            className={`
              absolute inset-0 
              ${SHAPE_CLASSES[shape]}
              bg-black/50 opacity-0 hover:opacity-100
              flex items-center justify-center
              transition-opacity cursor-pointer
            `}
          >
            <Camera className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      {/* Label */}
      {label && (
        <span className="text-sm text-base-content/60">{label}</span>
      )}

      {/* Error message */}
      {error && (
        <span className="text-xs text-error">{error}</span>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isLoading}
      />
    </div>
  );
}
