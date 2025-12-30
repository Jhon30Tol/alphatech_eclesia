import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface PendingSubscription {
    id: string;
    status: string;
    plano: { nome: string };
    igreja: { nome: string; email_principal: string };
    created_at: string;
}

const AdminSubscriptionApproval: React.FC = () => {
    const [requests, setRequests] = useState<PendingSubscription[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        setLoading(true);
        // Busca assinaturas com status 'pendente' ou 'bloqueada' (para desbloqueio)
        const { data, error } = await supabase
            .from('assinaturas')
            .select(`
        id,
        status,
        created_at,
        plano:planos(nome),
        igreja:igrejas(nome, email_principal)
      `)
            .in('status', ['pendente', 'bloqueada'])
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar solicitações:', error);
        } else {
            setRequests(data as any);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleStatusChange = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('assinaturas')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            alert('Erro ao atualizar status');
        } else {
            // Atualiza lista localmente
            setRequests(requests.filter(req => req.id !== id));
            alert(`Assinatura ${newStatus === 'ativa' ? 'aprovada' : 'bloqueada'} com sucesso!`);
        }
    };

    if (loading) return <div className="p-4">Carregando solicitações...</div>;

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-4">Aprovações Pendentes</h3>

            {requests.length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhuma solicitação pendente no momento.</p>
            ) : (
                <div className="space-y-4">
                    {requests.map((req) => (
                        <div key={req.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 rounded-2xl gap-4">
                            <div>
                                <h4 className="font-bold text-slate-800">{req.igreja?.nome || 'Igreja sem nome'}</h4>
                                <p className="text-xs text-slate-500">{req.igreja?.email_principal}</p>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-bold">
                                        Plano: {req.plano?.nome}
                                    </span>
                                    <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-lg font-bold uppercase">
                                        Status: {req.status}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => handleStatusChange(req.id, 'ativa')}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors"
                                >
                                    Aprovar
                                </button>
                                <button
                                    onClick={() => handleStatusChange(req.id, 'cancelada')}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-red-100 text-red-600 text-sm font-bold rounded-xl hover:bg-red-200 transition-colors"
                                >
                                    Recusar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminSubscriptionApproval;
