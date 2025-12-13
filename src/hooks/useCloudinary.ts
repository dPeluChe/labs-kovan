import { useState, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  uploadToCloudinary,
  extractPublicId,
  generateFolderPath,
  type CloudinaryUploadResponse,
} from "../lib/cloudinary";

export type ImageContext = "profile" | "pet" | "vehicle" | "recipe" | "health" | "gift" | "family";

interface UseCloudinaryOptions {
  familyId: string;
  context: ImageContext;
  entityId?: string;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

interface UseCloudinaryReturn {
  upload: (file: File, previousUrl?: string) => Promise<string | null>;
  remove: (url: string) => Promise<boolean>;
  isUploading: boolean;
  isDeleting: boolean;
  error: string | null;
  progress: number;
}

export function useCloudinary(options: UseCloudinaryOptions): UseCloudinaryReturn {
  const { familyId, context, entityId, onSuccess, onError } = options;
  
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const deleteImage = useAction(api.cloudinary.deleteImage);

  const upload = useCallback(
    async (file: File, previousUrl?: string): Promise<string | null> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        // Generate folder path
        const folder = generateFolderPath(familyId, context, entityId);

        // Simulate progress (Cloudinary doesn't give real progress for unsigned uploads)
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 10, 90));
        }, 100);

        // Upload new image
        const result: CloudinaryUploadResponse = await uploadToCloudinary(file, {
          folder,
        });

        clearInterval(progressInterval);
        setProgress(100);

        // If there was a previous image, delete it (cleanup)
        if (previousUrl) {
          const previousPublicId = extractPublicId(previousUrl);
          if (previousPublicId) {
            // Fire and forget - don't block on deletion
            deleteImage({ publicId: previousPublicId }).catch(console.error);
          }
        }

        onSuccess?.(result.secure_url);
        return result.secure_url;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload failed");
        setError(error.message);
        onError?.(error);
        return null;
      } finally {
        setIsUploading(false);
        setTimeout(() => setProgress(0), 500);
      }
    },
    [familyId, context, entityId, deleteImage, onSuccess, onError]
  );

  const remove = useCallback(
    async (url: string): Promise<boolean> => {
      setIsDeleting(true);
      setError(null);

      try {
        const publicId = extractPublicId(url);
        if (!publicId) {
          throw new Error("Invalid Cloudinary URL");
        }

        await deleteImage({ publicId });
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Delete failed");
        setError(error.message);
        onError?.(error);
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [deleteImage, onError]
  );

  return {
    upload,
    remove,
    isUploading,
    isDeleting,
    error,
    progress,
  };
}
