
import { motion, useAnimation, type PanInfo } from "framer-motion";
import { useState, type ReactNode } from "react";

interface SwipeableCardProps {
    children: ReactNode;
    actions: ReactNode | ((props: { close: () => void }) => ReactNode);
    onSwipeOpen?: () => void;
    onSwipeClose?: () => void;
    /**
     * Helper to reset swipe programmatically, passed to content/actions if needed via context or simple callback? 
     * For now, simpler to just have the parent manage state if needed, but here inner state controls animation.
     * We'll assume clicking content closes it.
     */
    className?: string; // For the outer container margin etc.
    contentClassName?: string; // For the sliding card (padding, bg, border)
    actionWidth?: number;
    onClick?: () => void; // Triggered when clicking content (if not closing swipe)
}

export function SwipeableCard({
    children,
    actions,
    onSwipeOpen,
    onSwipeClose,
    className = "",
    contentClassName = "bg-base-100 p-4 border border-base-content/5 rounded-2xl shadow-sm",
    actionWidth = 140,
    onClick
}: SwipeableCardProps) {
    const controls = useAnimation();
    const [isOpen, setIsOpen] = useState(false);

    const close = () => {
        controls.start({ x: 0 });
        setIsOpen(false);
        onSwipeClose?.();
    };

    const handleDragEnd = async (_: unknown, info: PanInfo) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        if (offset < -70 || (offset < -50 && velocity < -500)) {
            // Swiped left (Open)
            controls.start({ x: -actionWidth });
            setIsOpen(true);
            onSwipeOpen?.();
        } else {
            // Swiped right/back (Close)
            close();
        }
    };

    const handleClick = () => {
        if (isOpen) {
            close();
        } else {
            onClick?.();
        }
    };

    return (
        <div className={`relative group overflow-hidden rounded-2xl ${className}`}>
            {/* Background Actions */}
            <div className="absolute inset-0 flex items-center justify-end px-4 gap-2 bg-base-200 rounded-2xl">
                {typeof actions === 'function' ? actions({ close }) : actions}
            </div>

            {/* Foreground Card */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -actionWidth - 20, right: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                animate={controls}
                onClick={handleClick}
                className={`relative z-10 select-none ${contentClassName}`}
            >
                {children}
            </motion.div>
        </div>
    );
}
