import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Smartphone } from 'lucide-react';

export const Hero: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="relative overflow-hidden min-h-[90vh] flex items-center justify-center bg-base-200">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[100px] animate-pulse-glow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
            </div>

            <div className="relative z-10 container mx-auto px-4 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-base-100/50 backdrop-blur-md border border-base-content/10 mb-8 animate-slide-down">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Sistema de Gestión Familiar</span>
                    <span className="badge badge-warning badge-sm ml-2 font-bold opacity-80">BETA v1.0</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    Organiza tu Vida <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                        Sin Límites
                    </span>
                </h1>

                <p className="text-xl text-base-content/70 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    Labs Kovan es una potente aplicación web instalable diseñada para armonizar tu familia, finanzas y salud, todo en una experiencia perfecta.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn btn-primary btn-lg rounded-full px-8 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105"
                    >
                        Comenzar
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </button>

                    <a
                        href="#install"
                        className="btn btn-ghost btn-lg rounded-full px-8 hover:bg-base-100/50"
                    >
                        <Smartphone className="w-5 h-5 ml-2" />
                        Instalar App
                    </a>
                </div>

                {/* Mockup Preview */}
                <div className="mt-16 mx-auto max-w-4xl relative animate-slide-up" style={{ animationDelay: '0.5s' }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-base-200 to-transparent z-10 bottom-0 h-40" />
                    <div className="rounded-xl border border-base-content/10 bg-base-100/50 backdrop-blur-xl p-2 shadow-2xl" style={{ transform: 'perspective(1000px) rotateX(12deg)' }}>
                        <div className="rounded-lg overflow-hidden bg-base-100 aspect-video flex items-center justify-center border border-base-content/5 relative group">
                            <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:bg-primary/30 transition-all duration-500" />
                            <img
                                src="/src/assets/dashboard-preview.png"
                                alt="Vista Previa del Panel del Sistema"
                                className="w-full h-full object-cover relative z-10"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
