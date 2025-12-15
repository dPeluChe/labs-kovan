import React, { useState } from 'react';
import { Smartphone, Share, PlusSquare, Menu, Download } from 'lucide-react';

export const InstallPWA: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios');

    return (
        <section id="install" className="py-24 px-4 bg-base-200">
            <div className="container mx-auto">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

                    {/* Phone Mockup - Shows first on mobile, second on desktop */}
                    <div className="w-full lg:w-1/2 flex justify-center order-1 lg:order-2 mb-8 lg:mb-0">
                        <div className="mockup-phone border-primary shadow-2xl transform hover:scale-105 transition-transform duration-300">
                            <div className="camera"></div>
                            <div className="display">
                                <div className="artboard artboard-demo phone-1 bg-base-100 flex flex-col justify-center items-center gap-4 text-center p-4">
                                    <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
                                        <Smartphone className="w-10 h-10 text-primary animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Labs Kovan</h3>
                                        <p className="text-sm opacity-70">Bienvenido a Casa</p>
                                    </div>
                                    <button className="btn btn-primary w-full mt-8 rounded-full">Comenzar</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Instructions - Shows second on mobile, first on desktop */}
                    <div className="w-full lg:w-1/2 order-2 lg:order-1">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Instálala como una App</h2>
                        <p className="text-lg text-base-content/70 mb-8 leading-relaxed">
                            Labs Kovan es una Aplicación Web Progresiva (PWA). Instálala directamente en tu dispositivo para una experiencia nativa sin necesidad de tiendas de aplicaciones.
                        </p>

                        <div className="flex gap-4 mb-8">
                            <button
                                onClick={() => setActiveTab('ios')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${activeTab === 'ios' ? 'bg-primary text-primary-content shadow-lg' : 'bg-base-100 hover:bg-base-300'}`}
                            >
                                <span className="font-bold">iOS</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('android')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${activeTab === 'android' ? 'bg-primary text-primary-content shadow-lg' : 'bg-base-100 hover:bg-base-300'}`}
                            >
                                <span className="font-bold">Android</span>
                            </button>
                        </div>

                        <div className="bg-base-100 p-6 md:p-8 rounded-2xl shadow-sm border border-base-content/5 relative overflow-hidden min-h-[300px]">
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10"></div>

                            {activeTab === 'ios' ? (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center shrink-0 font-bold">1</div>
                                        <div>
                                            <h4 className="font-bold mb-1">Abre en Safari</h4>
                                            <p className="text-sm text-base-content/60">Abre Safari y navega a esta página.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center shrink-0 font-bold">2</div>
                                        <div>
                                            <h4 className="font-bold mb-1">Toca 'Compartir'</h4>
                                            <div className="flex items-center gap-2 text-sm text-base-content/60 flex-wrap">
                                                <span>Toca el icono de Compartir </span>
                                                <Share className="w-4 h-4 inline" />
                                                <span> en la barra inferior.</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center shrink-0 font-bold">3</div>
                                        <div>
                                            <h4 className="font-bold mb-1">Añadir a Inicio</h4>
                                            <div className="flex items-center gap-2 text-sm text-base-content/60 flex-wrap">
                                                <span>Baja y toca </span>
                                                <PlusSquare className="w-4 h-4 inline" />
                                                <span> 'Añadir a Inicio'.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center shrink-0 font-bold">1</div>
                                        <div>
                                            <h4 className="font-bold mb-1">Abre en Chrome</h4>
                                            <p className="text-sm text-base-content/60">Abre Chrome y navega a esta página.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center shrink-0 font-bold">2</div>
                                        <div>
                                            <h4 className="font-bold mb-1">Abre el Menú</h4>
                                            <div className="flex items-center gap-2 text-sm text-base-content/60 flex-wrap">
                                                <span>Toca el icono de tres puntos </span>
                                                <Menu className="w-4 h-4 inline" />
                                                <span> arriba a la derecha.</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center shrink-0 font-bold">3</div>
                                        <div>
                                            <h4 className="font-bold mb-1">Instalar Aplicación</h4>
                                            <div className="flex items-center gap-2 text-sm text-base-content/60 flex-wrap">
                                                <span>Toca </span>
                                                <Download className="w-4 h-4 inline" />
                                                <span> 'Instalar Aplicación' o 'Añadir a pantalla de inicio'.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};
