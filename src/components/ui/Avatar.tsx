import React from "react";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "User Avatar",
  name,
  size = "md",
  className,
}) => {
  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const textSizes = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  const initial = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <div
      className={`${className || ""}`}
      title={name || "Usuario"}
    >
      {src && typeof src === "string" ? (
        <div className={`rounded-full overflow-hidden ${sizeClasses[size]}`}>
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={`rounded-full bg-base-200 flex items-center justify-center text-base-content/70 font-semibold ${sizeClasses[size]} ${textSizes[size]}`}>
          {initial}
        </div>
      )}
    </div>
  );
};