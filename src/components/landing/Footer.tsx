import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="footer footer-center p-10 bg-base-100 text-base-content border-t border-base-content/10">
            <aside>
                <div className="font-bold text-xl tracking-tight mb-2">
                    Kovan
                </div>
                <p className="font-bold">
                    Sistema Avanzado de Gestión Personal
                </p>
            </aside>
            <div className="w-full flex flex-col items-center justify-between gap-2 pt-4 border-t border-base-content/10 sm:flex-row sm:px-8">
                <p className="text-xs text-base-content/60">
                    Copyright &copy; {new Date().getFullYear()} Kovan — Todos los derechos reservados.
                </p>
                <p className="text-xs text-base-content/60">
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
        </footer>
    );
};
