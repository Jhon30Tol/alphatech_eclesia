import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Subscription, User, View } from './types';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Componentes
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import MembersManager from './components/MembersManager';
import FinanceManager from './components/FinanceManager';
import FinanceTypesManager from './components/FinanceTypesManager';
import EventsCalendar from './components/EventsCalendar';
import ChurchSettings from './components/ChurchSettings';
import Billing from './components/Billing';

// Novos componentes Super Admin
import SuperAdminDashboard from './components/SuperAdminDashboard';
import ChurchClientsManager from './components/ChurchClientsManager';
import SaaSPlansManager from './components/SaaSPlansManager';
import UpgradeRequestsManager from './components/UpgradeRequestsManager';
import ChurchUsersManager from './components/ChurchUsersManager';
import ErrorBoundary from './components/ErrorBoundary';
import { isAuthorizedSuperAdmin, isWhitelistEmail } from './config/security';

const DEFAULT_SUBSCRIPTION: Subscription = {
  id: 'sub-default',
  igrejaId: 'church-default',
  planId: 'basico',
  status: 'ativa',
  startDate: new Date().toISOString().split('T')[0],
  renewalDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
};

const MOCK_USER: User = {
  id: 'u1',
  name: 'Administrador SaaS',
  email: 'admin@saas.com',
  avatar: '',
  role: 'super_admin',
  subscription: DEFAULT_SUBSCRIPTION
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USER);

  useEffect(() => {
    // 1. Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // 2. Escutar mudanças de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSession = async (session: any) => {
    if (!session?.user) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Verificar se é um Super Admin pela Whitelist
      const isWhitelist = isWhitelistEmail(session.user.email);
      const preferredRole = localStorage.getItem('preferredRole');

      // Buscar perfil no banco
      const { data: profile } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', session.user.id)
        .single();

      let user: User;

      if (profile) {
        user = {
          id: profile.id,
          name: profile.nome || session.user.email,
          email: profile.email || session.user.email,
          avatar: profile.avatar_url || '',
          role: isWhitelist ? (preferredRole as any || 'super_admin') : (profile.role || 'admin_igreja'),
          igrejaId: profile.igreja_id,
          subscription: DEFAULT_SUBSCRIPTION,
          isWhitelist
        };
      } else {
        user = {
          id: session.user.id,
          name: session.user.user_metadata?.nome || session.user.email,
          email: session.user.email,
          avatar: '',
          role: isWhitelist ? (preferredRole as any || 'super_admin') : 'admin_igreja',
          igrejaId: session.user.user_metadata?.igreja_id,
          subscription: DEFAULT_SUBSCRIPTION,
          isWhitelist
        };
      }

      setCurrentUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubscription = (newSub: Partial<Subscription>) => {
    const updated = { ...currentUser.subscription, ...newSub } as Subscription;
    setCurrentUser({ ...currentUser, subscription: updated });
  };

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await handleSession(session);
  };

  const isPremium = currentUser.subscription?.status === 'ativa' && (currentUser.subscription?.planId === 'profissional' || currentUser.subscription?.planId === 'enterprise');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('preferredRole'); // Limpar ao deslogar
    setIsAuthenticated(false);
  };

  const handleSwitchProfile = () => {
    if (!currentUser.isWhitelist) return;

    const newRole = currentUser.role === 'super_admin' ? 'admin_igreja' : 'super_admin';
    localStorage.setItem('preferredRole', newRole);
    setCurrentUser({ ...currentUser, role: newRole });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          !isAuthenticated ?
            <Auth onLogin={() => setIsAuthenticated(true)} /> :
            <Navigate to="/" replace />
        } />

        {/* Layout Principal Protegido */}
        <Route element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={currentUser}>
            <Layout
              user={currentUser}
              onLogout={handleLogout}
              onSwitchProfile={handleSwitchProfile}
            />
          </ProtectedRoute>
        }>
          {/* Redirecionador inicial inteligente */}
          <Route path="/" element={
            currentUser.role === 'super_admin' ?
              <Navigate to="/saas" replace /> :
              <Navigate to="/dashboard" replace />
          } />

          {/* Rotas de Igreja (Admin/User) */}
          <Route path="dashboard" element={
            <ErrorBoundary>
              <Dashboard />
            </ErrorBoundary>
          } />
          <Route path="configuracoes" element={<ChurchSettings currentUser={currentUser} onChurchCreated={refreshProfile} />} />
          <Route path="membros" element={<MembersManager currentUser={currentUser} />} />

          {/* Rotas com Feature Gating */}
          <Route path="financeiro" element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={currentUser} requiredFeature={View.FINANCES}>
              <FinanceManager isPremium={isPremium} onUpgrade={() => { }} />
            </ProtectedRoute>
          } />

          <Route path="tipos-financeiros" element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={currentUser} requiredFeature={View.FINANCE_TYPES}>
              <FinanceTypesManager />
            </ProtectedRoute>
          } />

          <Route path="agenda" element={<EventsCalendar />} />
          <Route path="equipe" element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={currentUser}>
              <ChurchUsersManager currentUser={currentUser} />
            </ProtectedRoute>
          } />
          <Route path="assinatura" element={<Billing currentSubscription={currentUser.subscription!} onUpdateSubscription={updateSubscription} />} />

          <Route path="ia" element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={currentUser} requiredFeature={View.AI_ASSISTANT}>
              <div className="p-10 text-center">Módulo de IA em desenvolvimento (Enterprise)</div>
            </ProtectedRoute>
          } />

          {/* Rotas Super Admin */}
          <Route path="saas" element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={currentUser} allowedRoles={['super_admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="saas/clientes" element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={currentUser} allowedRoles={['super_admin']}>
              <ChurchClientsManager />
            </ProtectedRoute>
          } />
          <Route path="saas/planos" element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={currentUser} allowedRoles={['super_admin']}>
              <SaaSPlansManager />
            </ProtectedRoute>
          } />
          <Route path="saas/upgrades" element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={currentUser} allowedRoles={['super_admin']}>
              <UpgradeRequestsManager />
            </ProtectedRoute>
          } />
        </Route>

        {/* Rota 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
