import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  user: User;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, user }) => {
  const isSuperAdmin = user.role === 'super_admin';
  const location = useLocation();

  const churchMenuItems = [
    { path: '/dashboard', label: 'Início', icon: <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
    { path: '/configuracoes', label: 'Instituição', icon: <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> },
    { path: '/membros', label: 'Comunidade', icon: <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> },
    { path: '/financeiro', label: 'Tesouraria', icon: <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /> },
    { path: '/agenda', label: 'Agenda', icon: <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
    { path: '/equipe', label: 'Equipe', icon: <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> },
    { path: '/assinatura', label: 'Assinatura', icon: <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /> },
    { path: '/ia', label: 'Insights IA', icon: <path d="M13 10V3L4 14h7v7l9-11h-7z" /> },
  ];

  const saasMenuItems = [
    { path: '/saas', label: 'Visão Geral', icon: <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
    { path: '/saas/clientes', label: 'Clientes', icon: <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /> },
    { path: '/saas/planos', label: 'Planos', icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
    { path: '/saas/upgrades', label: 'Upgrades', icon: <path d="M5 11l7-7 7 7M5 19l7-7 7 7" /> },
  ];

  const menuItems = isSuperAdmin ? saasMenuItems : churchMenuItems;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-950/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-stone-950 text-stone-300 flex flex-col transition-all duration-500 ease-in-out lg:translate-x-0 lg:static ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-24 flex items-center px-8 border-b border-stone-800/50">
          <div className="flex flex-col">
            <span className="text-xl font-display text-white tracking-tight leading-tight">
              ARXTech<span className="text-amber-500">.</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-stone-500 font-medium">Gestão Estratégica</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
          <div className="mb-4 px-4 text-[10px] uppercase tracking-widest text-stone-600 font-bold">Menu Principal</div>
          {menuItems.map((item) => {
            // Verifica se a rota atual começa com o path do item (para active state)
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'));

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`w-full group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${isActive
                  ? 'bg-stone-900 text-amber-500'
                  : 'hover:bg-stone-900 hover:text-stone-100'
                  }`}
              >
                <svg className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-amber-500' : 'text-stone-600 group-hover:text-stone-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  {item.icon}
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-stone-800/50">
          <div className="flex items-center px-4 py-3 rounded-xl bg-stone-900/50">
            <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-xs font-bold text-white uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-semibold text-stone-200 truncate">{user.name}</p>
              <p className="text-[10px] text-stone-500 uppercase tracking-tighter truncate">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;