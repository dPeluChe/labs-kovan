import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MobileModal } from "../ui/MobileModal";
import { Input } from "../ui/Input";
import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";
import { Zap, Wifi, Tv, Shield, CreditCard, Smartphone, HelpCircle, Calendar, Edit2, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";

interface SubscriptionDetailModalProps {
    subscription: Doc<"subscriptions"> | null;
    onClose: () => void;
}

const TYPE_ICONS: Record<string, LucideIcon> = {
    utility: Zap,
    internet: Wifi,
    streaming: Tv,
    insurance: Shield,
    membership: CreditCard,
    software: Smartphone,
    other: HelpCircle,
};

const CYCLE_LABELS: Record<string, string> = {
    monthly: "Mensual",
    bimonthly: "Bimestral",
    quarterly: "Trimestral",
    annual: "Anual",
    variable: "Variable",
};

export function SubscriptionDetailModal({ subscription, onClose }: SubscriptionDetailModalProps) {
    const update = useMutation(api.subscriptions.update);
    const remove = useMutation(api.subscriptions.deleteSubscription);
    const [isEditing, setIsEditing] = useState(false);
    const [openSection, setOpenSection] = useState<"costs" | "scan" | null>("costs");

    // Form State
    const [formData, setFormData] = useState<Partial<Doc<"subscriptions">>>({});

    if (!subscription) return null;

    const handleEditClick = () => {
        setFormData({
            name: subscription.name,
            amount: subscription.amount,
            billingCycle: subscription.billingCycle,
            dueDay: subscription.dueDay,
            referenceNumber: subscription.referenceNumber,
            barcodeValue: subscription.barcodeValue,
            barcodeType: subscription.barcodeType || "code128",
            notes: subscription.notes,
            isActive: subscription.isActive
        });
        setIsEditing(true);
        setOpenSection("costs");
    };

    const handleSave = async () => {
        try {
            await update({
                subscriptionId: subscription._id,
                familyId: subscription.familyId,
                ...formData
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update", error);
        }
    };

    const handleDelete = async () => {
        if (confirm("¿Estás seguro de eliminar esta suscripción?")) {
            try {
                await remove({
                    subscriptionId: subscription._id,
                    familyId: subscription.familyId
                });
                onClose();
            } catch (error) {
                console.error("Failed to delete", error);
            }
        }
    };

    const Icon = TYPE_ICONS[subscription.type] || HelpCircle;

    if (isEditing) {
        return (
            <MobileModal isOpen={!!subscription} onClose={() => setIsEditing(false)} title="Editar Servicio">
                <div className="space-y-4 pb-20"> {/* pb-20 for scroll space */}
                    <Input
                        label="Nombre"
                        value={formData.name || ""}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />

                    {/* Reference Number - Top Level */}
                    <Input
                        label="No. Contrato / Referencia"
                        value={formData.referenceNumber || ""}
                        onChange={e => setFormData({ ...formData, referenceNumber: e.target.value })}
                        placeholder="Ej. 1234567890"
                    />

                    {/* Accordion Group */}
                    <div className="join join-vertical w-full border border-base-200 rounded-xl bg-base-100">
                        {/* Costos y Ciclo */}
                        <div className="collapse collapse-arrow join-item border-base-200">
                            <input
                                type="checkbox"
                                checked={openSection === "costs"}
                                onChange={() => setOpenSection(openSection === "costs" ? null : "costs")}
                            />
                            <div className="collapse-title text-sm font-medium flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Costos y Ciclo
                            </div>
                            <div className="collapse-content space-y-3 pt-2">
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="label py-0 pb-1 text-xs">Costo ($)</label>
                                        <input
                                            type="number"
                                            className="input input-bordered w-full rounded-xl"
                                            value={formData.amount || ""}
                                            onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="label py-0 pb-1 text-xs">Día Pago</label>
                                        <input
                                            type="number"
                                            className="input input-bordered w-full rounded-xl"
                                            value={formData.dueDay || ""}
                                            onChange={e => setFormData({ ...formData, dueDay: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="flex-1 form-control">
                                        <label className="label py-0 pb-1 text-xs">Ciclo</label>
                                        <select
                                            className="select select-bordered w-full rounded-xl"
                                            value={formData.billingCycle}
                                            onChange={e => setFormData({ ...formData, billingCycle: e.target.value as "monthly" | "bimonthly" | "quarterly" | "annual" | "variable" })}
                                        >
                                            <option value="monthly">Mensual</option>
                                            <option value="bimonthly">Bimestral</option>
                                            <option value="quarterly">Trimestral</option>
                                            <option value="annual">Anual</option>
                                            <option value="variable">Variable</option>
                                        </select>
                                    </div>
                                    <div className="flex-1 form-control">
                                        <label className="label py-0 pb-1 text-xs">Estado</label>
                                        <select
                                            className="select select-bordered w-full rounded-xl"
                                            value={formData.isActive ? "active" : "inactive"}
                                            onChange={e => setFormData({ ...formData, isActive: e.target.value === "active" })}
                                        >
                                            <option value="active">Activo</option>
                                            <option value="inactive">Inactivo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Código Escaneable */}
                        <div className="collapse collapse-arrow join-item border-base-200">
                            <input
                                type="checkbox"
                                checked={openSection === "scan"}
                                onChange={() => setOpenSection(openSection === "scan" ? null : "scan")}
                            />
                            <div className="collapse-title text-sm font-medium flex items-center gap-2">
                                <Smartphone className="w-4 h-4" /> Código Escaneable <span className="text-xs text-base-content/40 font-normal">(Barras/QR)</span>
                            </div>
                            <div className="collapse-content pt-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-base-content/40">Tipo y Valor</label>
                                    <div className="flex gap-2">
                                        <select
                                            className="select select-sm select-bordered"
                                            value={formData.barcodeType}
                                            onChange={e => setFormData({ ...formData, barcodeType: e.target.value as "code128" | "qr" })}
                                        >
                                            <option value="code128">Barras</option>
                                            <option value="qr">QR</option>
                                        </select>
                                        <input
                                            type="text"
                                            className="input input-sm input-bordered flex-1"
                                            placeholder="Dígitos..."
                                            value={formData.barcodeValue || ""}
                                            onChange={e => setFormData({ ...formData, barcodeValue: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-[10px] text-base-content/40">Visible directamente en el detalle.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="form-control w-full">
                        <label className="label py-0 pb-1">
                            <span className="label-text text-xs font-medium">Notas</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered rounded-xl w-full"
                            value={formData.notes || ""}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            placeholder="Detalles adicionales..."
                        />
                    </div>

                    {/* Actions Footer */}
                    <div className="flex gap-3 pt-4 border-t border-base-200">
                        <button
                            className="btn btn-ghost btn-square text-error"
                            onClick={handleDelete}
                            title="Eliminar suscripción"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <button className="btn flex-1" onClick={() => setIsEditing(false)}>Cancelar</button>
                        <button className="btn btn-primary flex-1" onClick={handleSave}>Guardar</button>
                    </div>
                </div>
            </MobileModal>
        );
    }

    return (
        <MobileModal isOpen={!!subscription} onClose={onClose} title="Detalle del Servicio">
            <div className="space-y-6 relative">

                {/* Header: Icon Left, Info Right (Rich) */}
                <div className="flex items-start gap-4 pt-1">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1">
                        <Icon className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h2 className="text-lg font-bold leading-tight truncate pr-2">{subscription.name}</h2>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${subscription.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                {subscription.isActive ? "Activo" : "Inactivo"}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs font-medium text-base-content/60 bg-base-200 px-2.5 py-0.5 rounded-full">
                                {CYCLE_LABELS[subscription.billingCycle]}
                            </span>
                            <span className="text-xs font-medium text-base-content/60 bg-base-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                {subscription.amount ? `$${subscription.amount}` : "Variable"}
                            </span>
                            {subscription.dueDay && (
                                <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Día {subscription.dueDay}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contract / Barcode / Payment Info */}
                {(subscription.barcodeValue || subscription.referenceNumber) ? (
                    <div className="space-y-4">
                        {/* Reference Number - Clean design */}
                        {subscription.referenceNumber && (
                            <div className="bg-base-100 p-3 rounded-xl border border-base-200 flex flex-col items-center">
                                <span className="text-[10px] uppercase text-base-content/40 font-bold tracking-wider mb-1">
                                    Contrato / Referencia
                                </span>
                                <div className="text-xl font-mono font-bold tracking-widest text-center select-all">
                                    {subscription.referenceNumber}
                                </div>
                            </div>
                        )}

                        {/* Barcode */}
                        {subscription.barcodeValue && (
                            <div className="bg-white p-4 rounded-xl border border-base-200 shadow-sm flex justify-center overflow-hidden">
                                {subscription.barcodeType === "qr" ? (
                                    <QRCodeSVG value={subscription.barcodeValue} size={150} />
                                ) : (
                                    <div className="w-full flex justify-center">
                                        <Barcode
                                            value={subscription.barcodeValue}
                                            width={1.8}
                                            height={70}
                                            fontSize={16}
                                            background="transparent"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center p-6 bg-base-100 rounded-xl border border-base-200 border-dashed">
                        <p className="text-sm text-base-content/40">Sin datos de pago registrados.</p>
                        <button onClick={handleEditClick} className="btn btn-link btn-sm mt-1 no-underline hover:underline">Agregar datos de pago</button>
                    </div>
                )}

                {/* Notes */}
                {subscription.notes && (
                    <div className="bg-base-100 border border-base-200 rounded-xl p-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/40 mb-2">Notas</h3>
                        <p className="text-sm whitespace-pre-wrap break-words text-base-content/80">{subscription.notes}</p>
                    </div>
                )}

                <div className="pt-2 flex gap-3">
                    <button className="btn btn-outline flex-1" onClick={onClose}>Cerrar</button>
                    <button className="btn btn-primary flex-1" onClick={handleEditClick}>
                        <Edit2 className="w-4 h-4" /> Editar
                    </button>
                </div>
            </div>
        </MobileModal>
    );
}
