import { useState } from "react";
import { ConfirmModal } from "../components/ui/ConfirmModal";

export interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    icon?: "trash" | "warning" | "none";
}

export function useConfirmModal() {
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        variant?: "danger" | "warning" | "info";
        icon?: "trash" | "warning" | "none";
        resolve?: (value: boolean) => void;
    }>({
        isOpen: false,
        title: "",
        message: "",
    });

    const confirm = ({
        title = "Confirmar acción",
        message,
        confirmText = "Confirmar",
        cancelText = "Cancelar",
        variant = "warning",
        icon = "warning",
    }: {
        title?: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        variant?: "danger" | "warning" | "info";
        icon?: "trash" | "warning" | "none";
    }): Promise<boolean> => {
        return new Promise((resolve) => {
            setModalState({
                isOpen: true,
                title,
                message,
                confirmText,
                cancelText,
                variant,
                icon,
                resolve,
            });
        });
    };

    const handleClose = () => {
        if (modalState.resolve) {
            modalState.resolve(false);
        }
        setModalState((prev) => ({ ...prev, isOpen: false }));
    };

    const handleConfirm = () => {
        if (modalState.resolve) {
            modalState.resolve(true);
        }
        setModalState((prev) => ({ ...prev, isOpen: false }));
    };

    const ConfirmModalComponent = () => {
        if (!modalState.isOpen) return null;

        return (
            <ConfirmModal
                isOpen={modalState.isOpen}
                onClose={handleClose}
                onConfirm={handleConfirm}
                title={modalState.title}
                message={modalState.message}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                variant={modalState.variant}
                icon={modalState.icon}
            />
        );
    };

    return { confirm, ConfirmModal: ConfirmModalComponent };
}
