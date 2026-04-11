import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-base-100 text-base-content border-t border-base-content/10">
            {/* Brand block */}
            <div className="max-w-7xl mx-auto px-6 py-10 text-center">
                <p className="font-bold text-xl tracking-tight">Kovan</p>
                <p className="text-base-content/70 text-sm mt-1">Sistema Avanzado de Gestión Personal</p>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-base-content/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-xs text-base-content/50">
                        Copyright &copy; {new Date().getFullYear()} Kovan — Todos los derechos reservados.
                    </p>
                    <p className="text-xs text-base-content/50">
                        Built with code &amp; caffeine by{' '}
                        <a
                            href="https://iteris.tech"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-base-content hover:opacity-70 transition-opacity"
                        >
                            ITERIS<span className="font-mono text-[10px]">.tech</span>
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
};
