
import React, { useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { TextArea } from '../ui/TextArea';

import { MobileModal } from '../ui/MobileModal';

interface FeatureRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FeatureRequestModal: React.FC<FeatureRequestModalProps> = ({ isOpen, onClose }) => {
    const submitFeature = useMutation(api.featureRequests.submit);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [email, setEmail] = useState('');
    const [category, setCategory] = useState('general');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Custom validations
        const onlyNumbersRegex = /^\d+$/;
        if (onlyNumbersRegex.test(title.trim()) || onlyNumbersRegex.test(description.trim())) {
            setError("Por favor, describe tu idea con palabras, no solo números.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await submitFeature({
                title,
                description,
                email: email || undefined,
                category
            });
            setIsSuccess(true);
        } catch (err) {
            console.error("Error submitting feature:", err);
            setError("Ocurrió un error al enviar tu sugerencia. Por favor intenta de nuevo.");
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsSuccess(false);
        setTitle('');
        setDescription('');
        setEmail('');
        setCategory('general');
        setError(null);
        onClose();
    }

    return (
        <MobileModal isOpen={isOpen} onClose={handleClose} title="Propuesta de Funcionalidad">
            <div className="space-y-4">
                {/* Header Subtext */}
                <div className="-mt-4 mb-4 flex items-center gap-2 text-base-content/60">
                    <p className="text-xs">Ayúdanos a mejorar Kovan con tus ideas.</p>
                </div>

                {isSuccess ? (
                    <div className="text-center py-6 animate-fade-in">
                        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">¡Gracias por tu idea!</h3>
                        <p className="text-base-content/70 mb-6 text-sm">
                            Hemos recibido tu sugerencia y la revisaremos pronto.
                        </p>
                        <button onClick={handleClose} className="btn btn-primary rounded-full px-8 w-full">
                            Cerrar
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="alert alert-error text-sm rounded-xl">
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text font-medium text-sm">Título</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Ej. Lista de compras compartida..."
                                className="input input-bordered w-full rounded-xl focus:input-primary bg-base-200/50"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                maxLength={100}
                                pattern="^(?!\d+$).+"
                                title="Por favor ingresa un texto descriptivo, no solo números."
                                disabled={isSubmitting}
                            />
                        </div>

                        <TextArea
                            label="Descripción"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Cuéntanos más detalles..."
                            className="h-24 rounded-xl bg-base-200/50"
                            required
                            disabled={isSubmitting}
                        />

                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text font-medium text-sm">Email (Opcional)</span>
                            </label>
                            <input
                                type="email"
                                placeholder="tu@email.com"
                                className="input input-bordered w-full rounded-xl focus:input-primary bg-base-200/50"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="btn btn-ghost flex-1 rounded-full"
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className={`btn btn-primary flex-1 rounded-full gap-2 ${isSubmitting ? 'loading' : ''}`}
                                disabled={isSubmitting}
                            >
                                {!isSubmitting && <Send className="w-4 h-4" />}
                                {isSubmitting ? 'Enviando...' : 'Enviar'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </MobileModal>
    );
};
