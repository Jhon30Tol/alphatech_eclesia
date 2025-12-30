import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface ChurchProfile {
    id: string;
    nome: string;
    email: string;
    role: string;
    igreja_id: string;
}

const PLAN_LIMITS: Record<string, number> = {
    'basico': 2,
    'profissional': 5,
    'enterprise': 8
};

const ChurchUsersManager: React.FC<{ currentUser?: User }> = ({ currentUser }) => {
    const [users, setUsers] = useState<ChurchProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInviting, setIsInviting] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');

    const planId = currentUser?.subscription?.planId || 'basico';
    const limit = PLAN_LIMITS[planId as keyof typeof PLAN_LIMITS] || 2;
    const canInvite = users.length < limit;

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('perfis')
                .select('*');

            if (data) setUsers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canInvite) {
            alert(`Seu plano (${planId}) atingiu o limite de ${limit} membros.`);
            return;
        }

        try {
            setIsInviting(true);
            // Simulação de convite: No mundo real, usaríamos Supabase Auth Invite ou uma Cloud Function
            // Para o MVP, vamos apenas criar um perfil "pendente" se a tabela permitir
            // Como as tabelas são protegidas, o ideal é que o super_admin ou admin use a API do supabase auth

            // Mas para o frontend demonstrar:
            const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail);

            if (error) {
                // Se der erro por falta de permissão service_role (esperado no client-side)
                // Vamos apenas persistir na tabela de perfis como "convidado" para demonstração
                // Mas o usuário receberá o aviso.
                alert("Para convidar membros, é necessário configurar o SMTP e usar service_role. No momento, o perfil foi pré-registrado.");

                const { error: profileError } = await supabase
                    .from('perfis')
                    .insert([{
                        email: inviteEmail,
                        nome: 'Pendente',
                        role: 'membro_igreja',
                        igreja_id: currentUser?.igrejaId
                    }]);

                if (profileError) throw profileError;
            } else {
                alert("Convite enviado com sucesso!");
            }

            setInviteEmail('');
            fetchUsers();
        } catch (error) {
            console.error(error);
            alert("Erro ao convidar membro. Verifique se você tem permissões de administrador.");
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-display text-stone-900">Equipe</h1>
                    <p className="text-stone-500">
                        {users.length} de {limit} membros utilizados (Plano {planId.toUpperCase()})
                    </p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200 mb-8 shadow-sm">
                <h3 className="font-bold text-stone-800 mb-4 text-sm uppercase tracking-wide">Convidar Novo Membro</h3>
                <form onSubmit={handleInvite} className="flex gap-4">
                    <input
                        type="email"
                        required
                        placeholder="email@membro.com"
                        className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        disabled={!canInvite}
                    />
                    <button
                        type="submit"
                        disabled={!canInvite || isInviting}
                        className={`px-6 py-3 rounded-xl font-bold transition-all ${canInvite
                            ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-600/20'
                            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            }`}
                    >
                        {isInviting ? 'Enviando...' : 'Enviar Convite'}
                    </button>
                </form>
                {!canInvite && (
                    <p className="mt-3 text-amber-600 text-xs font-bold">
                        Limite do seu plano atingido. Faça upgrade para adicionar mais pessoas.
                    </p>
                )}
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead className="bg-stone-50 border-b border-stone-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-widest">Nome</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-widest">E-mail</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-widest">Função</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-widest">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-stone-800">{user.nome || 'Pendente'}</div>
                                </td>
                                <td className="px-6 py-4 text-stone-600 font-medium">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin_igreja' ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-800'
                                        }`}>
                                        {user.role === 'admin_igreja' ? 'Administrador' : user.role === 'membro_igreja' ? 'Equipe' : user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={user.nome === 'Pendente' ? "text-amber-500 font-bold text-xs uppercase tracking-wide" : "text-emerald-500 font-bold text-xs uppercase tracking-wide"}>
                                        {user.nome === 'Pendente' ? 'Convidado' : 'Ativo'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && !loading && (
                    <div className="p-12 text-center text-stone-400">Nenhum membro na equipe ainda.</div>
                )}
            </div>
        </div>
    );
};

export default ChurchUsersManager;
