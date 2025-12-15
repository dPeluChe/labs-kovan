
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Input } from "../../ui/Input";
import { DateInput } from "../../ui/DateInput";
import { ImageUpload } from "../../ui/ImageUpload";
import { Plus, X } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MobileModal } from "../../ui/MobileModal";

export function AddStudyModal({
    personId,
    onClose,
}: {
    personId: Id<"personProfiles">;
    onClose: () => void;
}) {
    const [title, setTitle] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [laboratory, setLaboratory] = useState("");
    const [storageId, setStorageId] = useState<Id<"_storage"> | null>(null);
    const [results, setResults] = useState<Array<{ parameter: string, value: string, unit: string, status: string }>>([]);
    const [isLoading, setIsLoading] = useState(false);

    const createStudy = useMutation(api.health.createStudy);

    const addResult = () => {
        setResults([...results, { parameter: "", value: "", unit: "", status: "normal" }]);
    };

    const updateResult = (index: number, field: string, value: string) => {
        const newResults = [...results];
        newResults[index] = { ...newResults[index], [field]: value };
        setResults(newResults);
    };

    const removeResult = (index: number) => {
        setResults(results.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsLoading(true);
        try {
            await createStudy({
                personId,
                title: title.trim(),
                date: new Date(date).getTime(),
                laboratory: laboratory.trim() || undefined,
                fileStorageId: storageId || undefined,
                results: results.filter(r => r.parameter && r.value).map(r => ({
                    parameter: r.parameter,
                    value: r.value,
                    unit: r.unit,
                    status: r.status as "normal" | "high" | "low"
                })),
            });
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MobileModal
            isOpen={true}
            onClose={onClose}
            title="Nuevo estudio"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nombre del estudio *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Biometría Hemática"
                />

                <div className="grid grid-cols-2 gap-2">
                    <DateInput label="Fecha" value={date} onChange={setDate} />
                    <Input
                        label="Laboratorio"
                        value={laboratory}
                        onChange={(e) => setLaboratory(e.target.value)}
                        placeholder="Lab. Chopo"
                    />
                </div>

                <div className="divider text-xs">Resultados clave</div>

                <div className="space-y-2">
                    {results.map((result, index) => (
                        <div key={index} className="flex gap-2 items-start">
                            <div className="flex-1 grid grid-cols-12 gap-2">
                                <input
                                    className="input input-bordered input-sm col-span-5"
                                    placeholder="Parámetro (Glucosa)"
                                    value={result.parameter}
                                    onChange={(e) => updateResult(index, "parameter", e.target.value)}
                                />
                                <input
                                    className="input input-bordered input-sm col-span-3"
                                    placeholder="Valor"
                                    value={result.value}
                                    onChange={(e) => updateResult(index, "value", e.target.value)}
                                />
                                <input
                                    className="input input-bordered input-sm col-span-2"
                                    placeholder="Unidad"
                                    value={result.unit}
                                    onChange={(e) => updateResult(index, "unit", e.target.value)}
                                />
                                <select
                                    className="select select-bordered select-sm col-span-2 px-1"
                                    value={result.status}
                                    onChange={(e) => updateResult(index, "status", e.target.value)}
                                >
                                    <option value="normal">OK</option>
                                    <option value="high">Alto</option>
                                    <option value="low">Bajo</option>
                                </select>
                            </div>
                            <button type="button" onClick={() => removeResult(index)} className="btn btn-ghost btn-xs btn-circle text-error">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={addResult} className="btn btn-ghost btn-sm text-primary gap-1 w-full border border-dashed border-base-300">
                        <Plus className="w-3 h-3" /> Agregar resultado
                    </button>
                </div>

                <div className="divider text-xs">Archivo adjunto</div>

                <ImageUpload
                    label="Foto del resultado"
                    value={storageId ?? undefined}
                    onChange={(id) => setStorageId(id)}
                />

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
