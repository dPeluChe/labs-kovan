import React, { useState } from 'react';
import { Target, Lock, Zap, CreditCard, Sparkles, ChefHat } from 'lucide-react';
import { FeatureRequestModal } from './FeatureRequestModal';

export const Roadmap: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const roadmapItems = [
        {
            quarter: "En Desarrollo",
            title: "Pagos y Finanzas Pro",
            description: "División de gastos automática, integración con bancos y reportes financieros avanzados.",
            icon: CreditCard,
            color: "text-blue-500",
            bgFrom: "from-blue-500/10",
            status: "progress"
        },
        {
            quarter: "Próximamente",
            title: "Modo Niños",
            description: "Interfaz simplificada y segura para que los más pequeños participen en tareas y vean su calendario.",
            icon: Lock,
            color: "text-green-500",
            bgFrom: "from-green-500/10",
            status: "planned"
        },
        {
            quarter: "Próximamente",
            title: "Kovan Chef AI",
            description: "Generación de menús semanales y listas de compras automáticas basadas en gustos y dieta familiar.",
            icon: ChefHat,
            color: "text-orange-500",
            bgFrom: "from-orange-500/10",
            status: "planned"
        },
        {
            quarter: "Futuro",
            title: "Automatización de Hogar",
            description: "Controla recordatorios basados en ubicación y conecta dispositivos inteligentes.",
            icon: Zap,
            color: "text-purple-500",
            bgFrom: "from-purple-500/10",
            status: "planned"
        }
    ];

    return (
        <section className="py-24 px-4 bg-base-200/50">
            <div className="container mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-base-200 border border-base-content/10 rounded-full text-sm font-medium mb-4">
                        <Target className="w-4 h-4 text-primary" />
                        <span>Roadmap 2026</span>
                    </div>
                    <h2 className="text-4xl font-bold mb-4">Hacia Dónde Vamos</h2>
                    <p className="text-xl text-base-content/60">
                        Apenas estamos comenzando. Esto es lo que estamos construyendo para tu familia.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {roadmapItems.map((item, index) => (
                        <div key={index} className="relative group">
                            <div className={`absolute inset-0 bg-gradient-to-br ${item.bgFrom} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`}></div>
                            <div className="card bg-base-100 border border-base-content/10 h-full relative z-10 hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-lg">
                                <div className="card-body">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl bg-base-200 ${item.color} bg-opacity-20`}>
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        {item.status === 'progress' && (
                                            <span className="badge badge-primary badge-outline text-xs font-bold">En Progreso</span>
                                        )}
                                    </div>
                                    <h3 className="card-title text-lg mb-2">{item.title}</h3>
                                    <p className="text-base-content/70 text-sm mb-4">{item.description}</p>
                                    <div className="mt-auto pt-4 border-t border-base-content/5">
                                        <span className="text-xs font-bold text-base-content/40 uppercase tracking-wider">{item.quarter}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn btn-outline gap-2 rounded-full"
                    >
                        <Sparkles className="w-4 h-4" />
                        Sugerir una Funcionalidad
                    </button>
                </div>

                <FeatureRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            </div>
        </section>
    );
};
