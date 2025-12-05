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
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
  };

  const initial = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <div
      className={`avatar placeholder ${sizeClasses[size]} ${className || ""}`}
      title={name || "Usuario"}
    >
      {src && typeof src === "string" ? (
        <div className={`rounded-full ${sizeClasses[size]}`}>
          <img src={src} alt={alt} />
        </div>
      ) : (
        <div className={`bg-primary text-primary-content rounded-full flex items-center justify-center font-medium ${sizeClasses[size]}`}>
          <span>{initial}</span>
        </div>
      )}
    </div>
  );
};