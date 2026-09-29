
import { useState, useRef} from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Input } from "../../ui/Input";
import { TextArea } from "../../ui/TextArea";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MobileModal } from "../../ui/MobileModal";

export function CreateListModal({
    sessionToken,
    familyId,
    onClose,
}: {
    sessionToken: string | null;
    familyId: Id<"families">;
    onClose: () => void;
}) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState("📍");
    const [isLoading, setIsLoading] = useState(false);

    const submitSeq = useRef(0);

    const createList = useMutation(api.places.createList);

    const handleSubmit = async (e: React.FormEvent) => {
        const seq = ++submitSeq.current;
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading((cur) => (seq === submitSeq.current ? true : cur));
        try {
            if (!sessionToken) return;
            await createList({
                sessionToken,
                familyId,
                name: name.trim(),
                description: description.trim() || undefined,
                icon,
            });
            if (seq === submitSeq.current) onClose();
        } finally {
            setIsLoading((cur) => (seq === submitSeq.current ? false : cur));
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
                        <button type="button" className="btn btn-outline text-2xl h-[3rem] w-[3rem] px-0" aria-label="Elegir icono de la lista">
                            {icon}
                        </button>
                        <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 grid grid-cols-5 gap-1">
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
