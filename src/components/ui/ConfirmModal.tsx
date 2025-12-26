import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { MobileModal } from "./MobileModal";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  icon?: "trash" | "warning" | "none";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar acción",
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "warning",
  icon = "warning",
}: ConfirmModalProps) {
  // ... (keep component implementation)
  // removed useConfirmModal
  const [isClosing, setIsClosing] = useState(false);

  const handleConfirm = () => {
    setIsClosing(true);
    setTimeout(() => {
      onConfirm();
      onClose();
      setIsClosing(false);
    }, 150);
  };

  const handleClose = () => {
    if (!isClosing) {
      onClose();
    }
  };

  const variantConfig = {
    danger: {
      confirmBtn: "btn-error",
      iconColor: "text-error",
      bgColor: "bg-error/10",
    },
    warning: {
      confirmBtn: "btn-warning",
      iconColor: "text-warning",
      bgColor: "bg-warning/10",
    },
    info: {
      confirmBtn: "btn-primary",
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
  };

  const config = variantConfig[variant];

  const renderIcon = () => {
    if (icon === "none") return null;

    const iconClass = `w-6 h-6 ${config.iconColor}`;
    if (icon === "trash") {
      return <Trash2 className={iconClass} />;
    }
    return <AlertTriangle className={iconClass} />;
  };

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      boxClassName="max-w-sm"
    >
      <div className="text-center space-y-4">
        {/* Icon */}
        {renderIcon() && (
          <div className={`w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center mx-auto`}>
            {renderIcon()}
          </div>
        )}

        {/* Message */}
        <p className="text-base-content/80 leading-relaxed">{message}</p>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleClose}
            disabled={isClosing}
            className="btn btn-ghost flex-1"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isClosing}
            className={`btn ${config.confirmBtn} flex-1 btn-active`}
          >
            {isClosing ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </MobileModal>
  );
}
