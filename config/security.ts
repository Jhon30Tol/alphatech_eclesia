import { User } from '../types';

// Lista de e-mails autorizados para acesso Super Admin
// Esta lista é HARDCODED para garantir que apenas estes e-mails consigam acessar
// o painel de gestão do SaaS, independentemente do que conste no banco de dados.
const SUPER_ADMIN_WHITELIST = [
    'altechzero@gmail.com',
    // Adicione outros emails da equipe ARXTech aqui se necessário
];

export const isWhitelistEmail = (email: string): boolean => {
    if (!email) return false;
    return SUPER_ADMIN_WHITELIST.includes(email.toLowerCase());
};

export const isAuthorizedSuperAdmin = (user: User): boolean => {
    // 1. Deve ter a role 'super_admin' (vinda do banco/token)
    if (user.role !== 'super_admin') {
        return false;
    }

    // 2. O e-mail DEVE estar na whitelist
    return isWhitelistEmail(user.email);
};
