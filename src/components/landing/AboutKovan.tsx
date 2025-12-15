import React from 'react';
import { Hexagon } from 'lucide-react';

export const AboutKovan: React.FC = () => {
    return (
        <section className="py-24 px-4 bg-base-100 overflow-hidden relative">
            {/* Background Decorative Hexagons */}
            <div className="absolute -left-20 top-20 opacity-5 text-primary">
                <Hexagon size={300} strokeWidth={1} />
            </div>
            <div className="absolute -right-20 bottom-20 opacity-5 text-secondary">
                <Hexagon size={400} strokeWidth={1} />
            </div>

            <div className="container mx-auto">
                <div className="flex flex-col md:flex-row items-center gap-16">

                    {/* Visual Side */}
                    <div className="w-full md:w-1/2 flex justify-center relative">
                        <div className="relative w-80 h-80">
                            {/* Abstract Hive Construction */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-amber-500/10 backdrop-blur-sm p-8 rounded-full animate-pulse-glow"></div>

                            <div className="absolute top-10 left-10 text-primary opacity-80 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                                <Hexagon fill="currentColor" size={64} className="text-primary/20" />
                            </div>
                            <div className="absolute top-0 right-20 text-secondary opacity-80 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                                <Hexagon fill="currentColor" size={48} className="text-secondary/20" />
                            </div>
                            <div className="absolute bottom-20 left-20 text-accent opacity-80 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                                <Hexagon fill="currentColor" size={56} className="text-accent/20" />
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <h3 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-amber-500 to-orange-600 tracking-tighter">
                                    KOVAN
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* Text Side */}
                    <div className="w-full md:w-1/2 text-left">
                        <div className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-sm font-bold mb-4">
                            Nuestra Inspiración
                        </div>
                        <h2 className="text-4xl font-bold mb-6">Tu Familia, Tu Colmena</h2>
                        <div className="space-y-6 text-lg text-base-content/70 leading-relaxed">
                            <p>
                                <span className="font-bold text-base-content">"Kovan"</span> significa <span className="italic">colmena</span> en turco. Elegimos este nombre porque representa perfectamente nuestra visión de la familia moderna.
                            </p>
                            <p>
                                Una colmena es una maravilla de organización, colaboración y propósito compartido. Cada miembro tiene un rol, cada recurso es valioso y el bienestar del grupo es la prioridad absoluta.
                            </p>
                            <p>
                                Creamos Labs Kovan para darte las herramientas digitales que permitan a tu "colmena" funcionar con esa misma armonía y eficiencia, eliminando el caos del día a día para que puedan enfocarse en lo que realmente importa: <span className="text-primary font-medium">prosperar juntos.</span>
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};
