import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";
import type { Doc } from "../../../convex/_generated/dataModel";

interface SubscriptionPaymentSectionProps {
    subscription: Doc<"subscriptions">;
    onEdit: () => void;
}

export function SubscriptionPaymentSection({ subscription, onEdit }: SubscriptionPaymentSectionProps) {
    if (!subscription.barcodeValue && !subscription.referenceNumber) {
        return (
            <div className="text-center p-6 bg-base-100 rounded-xl border border-base-200 border-dashed">
                <p className="text-sm text-faint">Sin datos de pago registrados.</p>
                <button onClick={onEdit} className="btn btn-link btn-sm mt-1 no-underline hover:underline">Agregar datos de pago</button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Reference Number - Clean design */}
            {subscription.referenceNumber && (
                <div className="bg-base-100 p-3 rounded-xl border border-base-200 flex flex-col items-center">
                    <span className="text-[10px] uppercase text-faint font-bold tracking-wider mb-1">
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
    );
}
