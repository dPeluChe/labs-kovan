interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-base-300 rounded ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 animate-fade-in">
      <div className="card-body p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return (
    <Skeleton className={`${sizeClasses[size]} rounded-full`} />
  );
}

// Profile card skeleton (for Health, Contacts, etc.)
export function SkeletonProfileCard() {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="w-5 h-5 rounded" />
        </div>
      </div>
    </div>
  );
}

// Service/Item card skeleton
export function SkeletonServiceCard() {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="w-5 h-5 rounded" />
        </div>
      </div>
    </div>
  );
}

// Grid skeleton for items like recipes, places
export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card bg-base-100 shadow-sm border border-base-300">
          <Skeleton className="h-32 rounded-t-xl" />
          <div className="card-body p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Tabs skeleton
export function SkeletonTabs() {
  return (
    <div className="tabs tabs-boxed bg-base-200 mx-4 mt-2 p-1">
      <Skeleton className="tab flex-1 h-8" />
      <Skeleton className="tab flex-1 h-8" />
    </div>
  );
}

// Page content skeleton with header simulation
export function SkeletonPageContent({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-3 stagger-children">
      {Array.from({ length: cards }).map((_, i) => (
        <SkeletonProfileCard key={i} />
      ))}
    </div>
  );
}
