
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Input } from "../../ui/Input";
import { TextArea } from "../../ui/TextArea";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MobileModal } from "../../ui/MobileModal";

export function CreateListModal({
    familyId,
    onClose,
}: {
    familyId: Id<"families">;
    onClose: () => void;
}) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState("📍");
    const [isLoading, setIsLoading] = useState(false);

    const createList = useMutation(api.places.createList);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            await createList({
                familyId,
                name: name.trim(),
                description: description.trim() || undefined,
                icon,
            });
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const PRESET_ICONS = ["📍", "🌮", "🇯🇵", "🏖️", "🏨", "☕", "🍷", "🛍️", "🎡", "🏛️"];

    return (
        <MobileModal
            isOpen={true}
            onClose={onClose}
            title="Nueva Lista"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2">
                    <div className="dropdown">
                        <div tabIndex={0} role="button" className="btn btn-outline text-2xl h-[3rem] w-[3rem] px-0">
                            {icon}
                        </div>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 grid grid-cols-5 gap-1">
                            {PRESET_ICONS.map(i => (
                                <li key={i}>
                                    <button
                                        type="button"
                                        className="text-xl px-2 py-2 flex justify-center"
                                        onClick={() => {
                                            setIcon(i);
                                            const elem = document.activeElement as HTMLElement;
                                            if (elem) elem.blur();
                                        }}
                                    >
                                        {i}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex-1">
                        <Input
                            label="Nombre de la lista *"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Favoritos GDL"
                            autoFocus
                        />
                    </div>
                </div>

                <TextArea
                    label="Descripción"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="¿Para qué es esta lista?"
                    rows={2}
                />

                <div className="modal-action">
                    <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={isLoading || !name.trim()}>
                        {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Crear Lista"}
                    </button>
                </div>
            </form>
        </MobileModal>
    );
}
