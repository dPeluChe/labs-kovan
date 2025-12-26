
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MobileModal } from "../ui/MobileModal";
import { TYPE_CONFIG, STATUS_LABELS, type CollectionType, type CollectionStatus } from "./CollectionConstants";
import { useAuth } from "../../contexts/AuthContext";
import type { Id } from "../../../convex/_generated/dataModel";

export function NewItemModal({
    familyId,
    onClose,
}: {
    familyId: Id<"families">;
    onClose: () => void;
}) {
    const { user } = useAuth();
    const [type, setType] = useState<Exclude<CollectionType, "all">>("book");
    const [title, setTitle] = useState("");
    const [creator, setCreator] = useState("");
    const [series, setSeries] = useState("");
    const [volumeOrVersion, setVolumeOrVersion] = useState("");
    const [owned, setOwned] = useState(true);
    const [status, setStatus] = useState<CollectionStatus>("owned_unread");
    const [isLoading, setIsLoading] = useState(false);

    const createItem = useMutation(api.collections.createItem);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        if (!user) {
            console.error("User not found");
            return;
        }

        setIsLoading(true);
        try {
            await createItem({
                familyId,
                type,
                title: title.trim(),
                creator: creator.trim() || undefined,
                series: series.trim() || undefined,
                volumeOrVersion: volumeOrVersion.trim() || undefined,
                owned,
                status,
                addedBy: user._id,
            });
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MobileModal isOpen={true} onClose={onClose} title="Nuevo Elemento">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-control">
                    <label className="label"><span className="label-text">Tipo</span></label>
                    <select
                        className="select select-bordered w-full"
                        value={type}
                        onChange={(e) => setType(e.target.value as Exclude<CollectionType, "all">)}
                    >
                        {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text">Título *</span></label>
                    <input className="input input-bordered" placeholder="Ej: Catan, Batman Vol 1" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text">Creador / Autor (Opcional)</span></label>
                    <input className="input input-bordered" placeholder="Autor, Diseñador, Estudio" value={creator} onChange={(e) => setCreator(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="form-control">
                        <label className="label"><span className="label-text">Serie / Colección</span></label>
                        <input className="input input-bordered" placeholder="Ej: Harry Potter" value={series} onChange={(e) => setSeries(e.target.value)} />
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Volumen / Versión</span></label>
                        <input className="input input-bordered" placeholder="Ej: Vol 1, Ed. 2024" value={volumeOrVersion} onChange={(e) => setVolumeOrVersion(e.target.value)} />
                    </div>
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text">Estado</span></label>
                    <select className="select select-bordered" value={status} onChange={e => setStatus(e.target.value as CollectionStatus)}>
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>

                <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-2">
                        <input type="checkbox" className="checkbox checkbox-primary" checked={owned} onChange={e => setOwned(e.target.checked)} />
                        <span className="label-text">Ya lo tengo</span>
                    </label>
                </div>

                <div className="modal-action">
                    <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={isLoading || !title.trim()}>
                        {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
                    </button>
                </div>
            </form>
        </MobileModal>
    );
}
