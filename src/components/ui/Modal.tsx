import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to trigger animation
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-200 ${
          isAnimating ? "opacity-50" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={`relative bg-base-100 w-full ${sizeClasses[size]} rounded-t-2xl sm:rounded-2xl shadow-2xl transition-all duration-300 ease-out ${
          isAnimating
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-8 opacity-0 scale-95"
        }`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-base-300">
            <h3 id="modal-title" className="font-bold text-lg">{title}</h3>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// Bottom sheet variant for mobile
export function BottomSheet({ isOpen, onClose, title, children }: Omit<ModalProps, "size">) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isAnimating ? "opacity-50" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sheet content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "sheet-title" : undefined}
        className={`relative bg-base-100 w-full rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${
          isAnimating ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 bg-base-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b border-base-300">
            <h3 id="sheet-title" className="font-bold text-lg">{title}</h3>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Close sheet"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto safe-bottom">
          {children}
        </div>
      </div>
    </div>
  );
}
