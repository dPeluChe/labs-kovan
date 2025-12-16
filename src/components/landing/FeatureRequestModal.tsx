
import React, { useState } from 'react';
import { Sparkles, Send, X, Lightbulb } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { TextArea } from '../ui/TextArea';

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

    if (!isOpen) return null;

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden animate-scale-in border border-base-content/10">

                {/* Header */}
                <div className="bg-primary/5 p-6 border-b border-base-content/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            <Lightbulb className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Propuesta de Funcionalidad</h3>
                            <p className="text-xs text-base-content/60">Para seguir creciendo y mejorando Kovan</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="btn btn-ghost btn-sm btn-circle">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isSuccess ? (
                        <div className="text-center py-10 animate-fade-in">
                            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">¡Gracias por tu idea!</h3>
                            <p className="text-base-content/70 mb-8">
                                Hemos recibido tu sugerencia y la revisaremos pronto. Juntos hacemos de Kovan el mejor hogar digital.
                            </p>
                            <button onClick={handleClose} className="btn btn-primary rounded-full px-8">
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
                                <label className="label">
                                    <span className="label-text font-medium">Título</span>
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
                                placeholder="Cuéntanos más detalles sobre cómo esto ayudaría a tu familia..."
                                className="h-24 rounded-xl bg-base-200/50"
                                required
                                disabled={isSubmitting}
                            />

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Email (Opcional) <span className="text-base-content/50 font-normal">- Te avisaremos cuando esté listo</span></span>
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

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className={`btn btn-primary w-full rounded-full gap-2 ${isSubmitting ? 'loading' : ''}`}
                                    disabled={isSubmitting}
                                >
                                    {!isSubmitting && <Send className="w-5 h-5" />}
                                    {isSubmitting ? 'Enviando...' : 'Enviar Sugerencia'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

            </div>
        </div>
    );
};
