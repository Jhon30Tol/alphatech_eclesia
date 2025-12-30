import React from 'react';
import { Link } from 'react-router-dom';

interface UpgradeRequiredProps {
    inline?: boolean;
    feature?: string;
}

const UpgradeRequired: React.FC<UpgradeRequiredProps> = ({ inline, feature }) => {
    if (inline) {
        return (
            <div className="fixed top-20 right-8 w-80 bg-white rounded-2xl border border-amber-200 shadow-2xl p-6 z-50 animate-in slide-in-from-right-8 duration-500">
                <div className="w-12 h-12 mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">Upgrade Necessário</h3>
                <p className="text-stone-500 text-sm mb-6">
                    A funcionalidade <span className="font-bold text-amber-700">{feature || 'selecionada'}</span> é exclusiva de planos superiores.
                </p>
                <div className="flex flex-col gap-3">
                    <Link
                        to="/assinatura"
                        className="w-full py-3 bg-amber-600 text-white rounded-xl text-center font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20"
                    >
                        Ver Planos
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="w-full py-2 bg-stone-100 text-stone-600 rounded-xl text-center font-bold hover:bg-stone-200 transition-colors"
                    >
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center bg-stone-50 rounded-3xl border border-stone-200/60">
            <div className="w-24 h-24 mb-8 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>

            <h2 className="text-4xl font-display text-stone-900 mb-4">
                Evolua seu <span className="text-amber-600 font-serif italic">Ecossistema</span>
            </h2>

            <p className="text-stone-500 text-lg max-w-md mb-10 leading-relaxed">
                Esta funcionalidade é exclusiva de planos superiores. Desbloqueie todo o potencial da sua gestão hoje mesmo.
            </p>

            <div className="flex gap-4">
                <Link
                    to="/assinatura"
                    className="px-8 py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-transform hover:-translate-y-1 shadow-xl shadow-stone-900/20"
                >
                    Ver Planos Disponíveis
                </Link>
                <Link
                    to="/dashboard"
                    className="px-8 py-4 bg-white text-stone-600 border border-stone-200 rounded-2xl font-bold hover:bg-stone-50 transition-colors"
                >
                    Voltar ao Início
                </Link>
            </div>
        </div>
    );
};

export default UpgradeRequired;
