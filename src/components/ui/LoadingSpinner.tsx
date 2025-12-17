import { Hexagon } from "lucide-react";

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "loading-sm",
    md: "loading-md",
    lg: "loading-lg",
  };

  return (
    <div className="flex items-center justify-center p-4">
      <span className={`loading loading-spinner ${sizeClasses[size]} text-primary`} />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
      <div className="relative flex items-center justify-center">
        {/* Outer Ring */}
        <span className="loading loading-ring w-20 h-20 text-primary opacity-50"></span>

        {/* Inner Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Hexagon className="w-8 h-8 text-primary fill-primary/20 animate-pulse" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <h3 className="font-semibold text-primary/80 tracking-widest uppercase text-xs">Kovan</h3>
        <p className="text-sm text-base-content/60 animate-pulse">
          Actualizando tu colmena...
        </p>
      </div>
    </div>
  );
}
