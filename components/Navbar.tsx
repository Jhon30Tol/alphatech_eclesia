import React from 'react';
import { User } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  onSwitchProfile: () => void;
  onOpenSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onSwitchProfile, onOpenSidebar }) => {
  const isSuper = user.role === 'super_admin';

  return (
    <header className="h-20 flex items-center justify-between px-6 md:px-10 bg-stone-50/80 backdrop-blur-xl z-20 sticky top-0 border-b border-stone-200/50">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="p-2 text-stone-900 lg:hidden hover:bg-stone-200 rounded-xl transition-all"
          aria-label="Abrir menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="lg:hidden text-lg font-display font-black tracking-tighter">ARXTech</span>
      </div>

      <div className="flex items-center space-x-4 md:space-x-10">
        <button
          onClick={onSwitchProfile}
          className="hidden sm:block text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 hover:text-amber-600 transition-colors"
        >
          Mudar Perfil
        </button>

        <div className="flex items-center space-x-4 md:space-x-8">
          <div className="hidden md:block h-6 w-[1px] bg-stone-200"></div>
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-stone-900 leading-tight">{user.name}</span>
            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
              {user.isWhitelist ? 'Painel de Gestão' : `Plano ${user.subscription?.planId}`}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-2xl soft-shadow text-stone-400 hover:text-red-600 transition-all transform hover:scale-105 active:scale-95"
            aria-label="Sair"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
