import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { User, View } from '../types';
import { canAccessFeature } from '../config/plans';
import { isAuthorizedSuperAdmin } from '../config/security';
import UpgradeRequired from './UpgradeRequired';

interface ProtectedRouteProps {
    user: User;
    isAuthenticated: boolean;
    allowedRoles?: string[];
    requiredFeature?: View; // Feature necessária para esta rota
    redirectPath?: string;
    children?: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    user,
    isAuthenticated,
    allowedRoles,
    requiredFeature,
    redirectPath = '/login',
    children,
}) => {
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to={redirectPath} replace />;
    }

    // 1. Check Roles & Whitelist
    if (allowedRoles) {
        // Se a rota exige 'super_admin', fazemos a verificação de segurança reforçada
        if (allowedRoles.includes('super_admin')) {
            if (!isAuthorizedSuperAdmin(user)) {
                // É um impostor (tem role mas não está na whitelist) ou apenas um admin tentando acessar
                // Redireciona para o dashboard comum da igreja
                return <Navigate to="/dashboard" replace />;
            }
        } else if (!allowedRoles.includes(user.role)) {
            // Verificação padrão para outras roles
            const fallbackPath = user.role === 'super_admin' ? '/saas' : '/dashboard';
            return <Navigate to={fallbackPath} replace />;
        }
    }

    // 2. Check Subscription Status (Ignorar para Super Admin ou rotas de configuração de pagamento)
    const isSubscriptionRoute = location.pathname === '/assinatura';
    if (
        user.role !== 'super_admin' &&
        user.subscription?.status !== 'ativa' &&
        !isSubscriptionRoute
    ) {
        // Se a assinatura não está ativa, força rediorecionamento para tela de pagamento/status
        return <Navigate to="/assinatura" replace />;
    }

    // 3. Check Plan Capabilities (Feature Gating)
    if (requiredFeature && user.role !== 'super_admin') {
        const planId = user.subscription?.planId;
        if (!canAccessFeature(planId, requiredFeature)) {
            // Se o plano não permite essa feature, exibe banner de upgrade à direita
            return <UpgradeRequired inline feature={requiredFeature} />;
        }
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;
