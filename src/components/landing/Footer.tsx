import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="footer footer-center p-10 bg-base-100 text-base-content border-t border-base-content/10">
            <aside>
                <div className="font-bold text-xl tracking-tight mb-2">
                    Labs Kovan
                </div>
                <p className="font-bold">
                    Sistema Avanzado de Gestión Personal
                </p>
                <p>Copyright © {new Date().getFullYear()} - Todos los derechos reservados</p>
            </aside>
        </footer>
    );
};
