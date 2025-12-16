
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Input } from "../../ui/Input";
import { DateInput } from "../../ui/DateInput";
import { TextArea } from "../../ui/TextArea";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MobileModal } from "../../ui/MobileModal";

type NutritionType = "food" | "treats" | "supplement" | "other";

export function AddNutritionModal({
    personId,
    onClose,
}: {
    personId: Id<"personProfiles">;
    onClose: () => void;
}) {
    const [brand, setBrand] = useState("");
    const [productName, setProductName] = useState("");
    const [type, setType] = useState<NutritionType>("food");
    const [amount, setAmount] = useState("");
    const [weight, setWeight] = useState("");
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
    const [store, setStore] = useState("");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const createRecord = useMutation(api.petNutrition.createNutritionRecord);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!brand.trim()) return;

        setIsLoading(true);
        try {
            await createRecord({
                personId,
                brand: brand.trim(),
                productName: productName.trim() || undefined,
                type,
                amount: amount ? parseFloat(amount) : undefined,
                weight: weight.trim() || undefined,
                purchaseDate: new Date(purchaseDate).getTime(),
                store: store.trim() || undefined,
                notes: notes.trim() || undefined,
            });
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const OPTIONS: { id: NutritionType; label: string }[] = [
        { id: "food", label: "Comida" },
        { id: "treats", label: "Premios" },
        { id: "supplement", label: "Suplemento" },
        { id: "other", label: "Otro" }
    ];

    return (
        <MobileModal
            isOpen={true}
            onClose={onClose}
            title="Registrar Alimento"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Marca *"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ej: Royal Canin, Pro Plan"
                    autoFocus
                    disabled={isLoading}
                />

                <Input
                    label="Producto (Nombre específico)"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ej: Puppy Medium Breed"
                    disabled={isLoading}
                />

                <div className="form-control">
                    <label className="label"><span className="label-text">Tipo</span></label>
                    <select
                        className="select select-bordered w-full"
                        value={type}
                        onChange={(e) => setType(e.target.value as NutritionType)}
                        disabled={isLoading}
                    >
                        {OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                        <label className="label"><span className="label-text">Costo ($)</span></label>
                        <input
                            type="number"
                            step="0.01"
                            className="input input-bordered w-full"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Peso / Cantidad</span></label>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            placeholder="Ej: 15kg"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <DateInput
                        label="Fecha de compra"
                        value={purchaseDate}
                        onChange={setPurchaseDate}
                        disabled={isLoading}
                    />
                    <Input
                        label="Tienda"
                        value={store}
                        onChange={(e) => setStore(e.target.value)}
                        placeholder="Ej: Amazon, Petco"
                        disabled={isLoading}
                    />
                </div>

                <TextArea
                    label="Notas"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observaciones..."
                    rows={2}
                    disabled={isLoading}
                />

                <div className="modal-action">
                    <button type="button" className="btn" onClick={onClose} disabled={isLoading}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={isLoading || !brand.trim()}>
                        {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
                    </button>
                </div>
            </form>
        </MobileModal>
    );
}
