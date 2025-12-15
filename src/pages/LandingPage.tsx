import React from 'react';
import { Hero } from '../components/landing/Hero';
import { FeatureShowcase } from '../components/landing/FeatureShowcase';
import { AboutKovan } from '../components/landing/AboutKovan';
import { Roadmap } from '../components/landing/Roadmap';
import { InstallPWA } from '../components/landing/InstallPWA';
import { Footer } from '../components/landing/Footer';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen bg-base-100 flex flex-col font-sans">
            {/* Simple Floating Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
                <div className="container mx-auto">
                    <div className="bg-base-100/70 backdrop-blur-md border border-base-content/10 shadow-lg rounded-full px-6 py-3 flex items-center justify-between">
                        <div className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                            Labs Kovan
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleTheme}
                                className="btn btn-ghost btn-sm btn-circle"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="btn btn-sm btn-primary rounded-full px-6"
                            >
                                Login
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-grow">
                <Hero />
                <FeatureShowcase />
                <AboutKovan />
                <Roadmap />
                <InstallPWA />
            </main>
            <Footer />
        </div>
    );
};
