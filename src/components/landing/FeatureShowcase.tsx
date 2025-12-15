import React from 'react';
import { Calendar, Wallet, Users, Heart, Car, Bot, Gift, MapPin } from 'lucide-react';

interface FeatureCardProps {
    icon: React.ElementType;
    title: string;
    description: string;
    bgColor: string;
    textColor: string;
    delay: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, bgColor, textColor, delay }) => {
    return (
        <div
            className="card-interactive bg-base-100 p-6 rounded-2xl border border-base-content/5 shadow-sm hover:shadow-xl transition-all duration-300 animate-slide-up"
            style={{ animationDelay: delay }}
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${bgColor}`}>
                <Icon className={`w-6 h-6 ${textColor}`} />
            </div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-base-content/60 leading-relaxed">{description}</p>
        </div>
    );
};

export const FeatureShowcase: React.FC = () => {
    const features = [
        {
            icon: Users,
            title: "Centro Familiar",
            description: "Gestiona perfiles familiares, contactos de emergencia y responsabilidades compartidas en un lugar seguro.",
            bgColor: "bg-blue-500/10",
            textColor: "text-blue-500",
            delay: "0.1s"
        },
        {
            icon: Calendar,
            title: "Calendario Inteligente",
            description: "Coordina horarios, establece recordatorios y nunca te pierdas un evento familiar importante.",
            bgColor: "bg-purple-500/10",
            textColor: "text-purple-500",
            delay: "0.2s"
        },
        {
            icon: Wallet,
            title: "Finanzas",
            description: "Sigue gastos, gestiona presupuestos y vigila la salud financiera de tu hogar.",
            bgColor: "bg-green-500/10",
            textColor: "text-green-500",
            delay: "0.3s"
        },
        {
            icon: Heart,
            title: "Salud",
            description: "Almacena historial médico, sigue recetas y monitorea métricas de salud para toda la familia.",
            bgColor: "bg-red-500/10",
            textColor: "text-red-500",
            delay: "0.4s"
        },
        {
            icon: Bot,
            title: "Asistente IA",
            description: "Tu agente inteligente personal para ayudar a organizar, planificar y responder preguntas 24/7.",
            bgColor: "bg-indigo-500/10",
            textColor: "text-indigo-500",
            delay: "0.5s"
        },
        {
            icon: Car,
            title: "Vehículos",
            description: "Lleva el control de mantenimientos, seguros y documentos de todos tus vehículos.",
            bgColor: "bg-orange-500/10",
            textColor: "text-orange-500",
            delay: "0.6s"
        },
        {
            icon: Gift,
            title: "Regalos",
            description: "Nunca olvides un cumpleaños o aniversario con seguimiento integrado de regalos y listas de deseos.",
            bgColor: "bg-pink-500/10",
            textColor: "text-pink-500",
            delay: "0.7s"
        },
        {
            icon: MapPin,
            title: "Lugares y Actividades",
            description: "Guarda tus lugares favoritos y planifica actividades familiares sin esfuerzo.",
            bgColor: "bg-teal-500/10",
            textColor: "text-teal-500",
            delay: "0.8s"
        }
    ];

    return (
        <section className="py-24 px-4 bg-base-100">
            <div className="container mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl font-bold mb-4">Todo lo que Necesitas</h2>
                    <p className="text-xl text-base-content/60">
                        Una suite completa de herramientas diseñadas para simplificar la gestión de la vida moderna.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <FeatureCard
                            key={index}
                            {...feature}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
