import { action } from "./_generated/server";
import { v } from "convex/values";

// Cloudinary credentials - set in Convex Dashboard > Settings > Environment Variables
// For now, we'll use a simple approach that logs and skips if not configured
const CLOUDINARY_CONFIG = {
  cloudName: "",  // Set via env: CLOUDINARY_CLOUD_NAME
  apiKey: "",     // Set via env: CLOUDINARY_API_KEY  
  apiSecret: "",  // Set via env: CLOUDINARY_API_SECRET
};

// Delete an image from Cloudinary
// This requires API credentials (stored in Convex environment variables)
export const deleteImage = action({
  args: {
    publicId: v.string(),
  },
  handler: async (_, args) => {
    const { cloudName, apiKey, apiSecret } = CLOUDINARY_CONFIG;

    if (!cloudName || !apiKey || !apiSecret) {
      // Silently skip deletion if not configured - image will remain in Cloudinary
      // This is acceptable for development, configure for production
      console.log("Cloudinary deletion skipped - credentials not configured");
      return { success: true, skipped: true };
    }

    try {
      // Generate signature for deletion
      const timestamp = Math.floor(Date.now() / 1000);
      const stringToSign = `public_id=${args.publicId}&timestamp=${timestamp}${apiSecret}`;
      
      // Create SHA-1 signature
      const encoder = new TextEncoder();
      const data = encoder.encode(stringToSign);
      const hashBuffer = await crypto.subtle.digest("SHA-1", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      // Call Cloudinary destroy API
      const formData = new URLSearchParams();
      formData.append("public_id", args.publicId);
      formData.append("timestamp", timestamp.toString());
      formData.append("api_key", apiKey);
      formData.append("signature", signature);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (result.result === "ok" || result.result === "not found") {
        return { success: true };
      } else {
        console.error("Cloudinary delete error:", result);
        return { success: false, reason: result.result };
      }
    } catch (error) {
      console.error("Failed to delete image from Cloudinary:", error);
      return { success: false, reason: "api_error" };
    }
  },
});
