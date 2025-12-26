
import React from 'react';

interface MobileModalProps {
    isOpen?: boolean; // Optional if you control mounting externally
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    boxClassName?: string;
}

export function MobileModal({ isOpen = true, onClose, title, children, boxClassName = "" }: MobileModalProps) {
    if (!isOpen) return null;

    return (
        <div className="modal modal-open modal-bottom sm:modal-middle">
            <div className={`modal-box w-full max-h-[85vh] overflow-y-auto ${boxClassName}`}>
                <h3 className="font-bold text-lg mb-4">{title}</h3>
                {children}
            </div>
            <form method="dialog" className="modal-backdrop">
                <button type="button" onClick={onClose}>close</button>
            </form>
        </div>
    );
}
