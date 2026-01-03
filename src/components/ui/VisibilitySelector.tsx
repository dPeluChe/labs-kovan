import { Users, Lock } from "lucide-react";

interface VisibilitySelectorProps {
    value: "private" | "family";
    onChange: (value: "private" | "family") => void;
}

export function VisibilitySelector({ value, onChange }: VisibilitySelectorProps) {
    return (
        <div className="flex-none">
            <label className="label text-xs font-medium text-base-content/60">Visibilidad</label>
            <div className="flex bg-base-200 rounded-lg p-1 h-[48px] items-center">
                <button
                    type="button"
                    onClick={() => onChange("private")}
                    className={`h-full px-3 rounded-md flex items-center justify-center gap-1.5 transition-all text-sm font-medium ${value === "private" ? "bg-white shadow-sm text-primary" : "text-base-content/50 hover:text-base-content"
                        }`}
                    title="Solo yo"
                >
                    <Lock className="w-4 h-4" />
                    <span className="hidden sm:inline">Privado</span>
                </button>
                <button
                    type="button"
                    onClick={() => onChange("family")}
                    className={`h-full px-3 rounded-md flex items-center justify-center gap-1.5 transition-all text-sm font-medium ${value === "family" ? "bg-white shadow-sm text-primary" : "text-base-content/50 hover:text-base-content"
                        }`}
                    title="Familia"
                >
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Familia</span>
                </button>
            </div>
        </div>
    );
}
