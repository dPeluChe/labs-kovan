// Cloudinary configuration and utilities
// Cloud name and upload preset from environment variables

export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "",
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "",
};

export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

// Extract public_id from Cloudinary URL for deletion
export function extractPublicId(url: string): string | null {
  if (!url || !url.includes("cloudinary.com")) return null;
  
  try {
    // URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{ext}
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    
    // Remove version prefix (v1234567890/) and extension
    const pathWithVersion = parts[1];
    const pathParts = pathWithVersion.split("/");
    
    // If there's a version prefix, remove it
    const startIndex = pathParts[0].startsWith("v") && /^v\d+$/.test(pathParts[0]) ? 1 : 0;
    
    // Join remaining parts and remove extension
    const publicIdWithExt = pathParts.slice(startIndex).join("/");
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");
    
    return publicId;
  } catch {
    return null;
  }
}

// Generate folder path based on context
export function generateFolderPath(
  familyId: string,
  context: "profile" | "pet" | "vehicle" | "recipe" | "health" | "gift" | "family",
  entityId?: string
): string {
  const base = `kovan/${familyId}`;
  
  switch (context) {
    case "profile":
      return `${base}/profiles/${entityId || "unknown"}`;
    case "pet":
      return `${base}/pets/${entityId || "unknown"}`;
    case "vehicle":
      return `${base}/vehicles/${entityId || "unknown"}`;
    case "recipe":
      return `${base}/recipes/${entityId || "unknown"}`;
    case "health":
      return `${base}/health/${entityId || "unknown"}`;
    case "gift":
      return `${base}/gifts/${entityId || "unknown"}`;
    case "family":
      return `${base}/family`;
    default:
      return `${base}/misc`;
  }
}

// Upload options interface
export interface CloudinaryUploadOptions {
  folder: string;
  publicId?: string;
  transformation?: string;
}

// Upload response interface
export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

// Upload a file to Cloudinary
export async function uploadToCloudinary(
  file: File,
  options: CloudinaryUploadOptions
): Promise<CloudinaryUploadResponse> {
  const { cloudName, uploadPreset } = CLOUDINARY_CONFIG;
  
  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration missing. Check environment variables.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", options.folder);
  
  if (options.publicId) {
    formData.append("public_id", options.publicId);
  }

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Upload failed");
  }

  return response.json();
}
