
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UpgradeRequest {
  id: string;
  churchId: string;
  churchNome: string;
  planoAtualNome: string;
  planoSolicitadoNome: string;
  planoSolicitadoId: string;
  dataSolicitacao: string;
  status: 'pendente' | 'aprovado' | 'recusado';
}

const UpgradeRequestsManager: React.FC = () => {
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('solicitacoes_upgrade')
        .select(`
          id,
          igreja_id,
          status,
          created_at,
          plano_solicitado_id,
          igrejas (nome),
          plano_atual:planos!solicitacoes_upgrade_plano_atual_id_fkey (nome),
          plano_solicitado:planos!solicitacoes_upgrade_plano_solicitado_id_fkey (nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: UpgradeRequest[] = data.map((r: any) => ({
        id: r.id,
        churchId: r.igreja_id,
        churchNome: r.igrejas?.nome || 'Igreja Desconhecida',
        planoAtualNome: r.plano_atual?.nome || 'Sem Plano',
        planoSolicitadoNome: r.plano_solicitado?.nome || 'Desconhecido',
        planoSolicitadoId: r.plano_solicitado_id,
        dataSolicitacao: r.created_at,
        status: r.status
      }));

      setRequests(formatted);
    } catch (err) {
      console.error('Erro ao buscar solicitações:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (request: UpgradeRequest, newStatus: 'aprovado' | 'recusado') => {
    try {
      // 1. Atualizar status da solicitação
      const { error: updateError } = await supabase
        .from('solicitacoes_upgrade')
        .update({ status: newStatus })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // 2. Se aprovado, atualizar a assinatura da igreja
      if (newStatus === 'aprovado') {
        const { error: subError } = await supabase
          .from('assinaturas')
          .update({ plano_id: request.planoSolicitadoId })
          .eq('igreja_id', request.churchId);

        if (subError) throw subError;
        alert('Upgrade aprovado! O plano da igreja foi atualizado automaticamente.');
      } else {
        alert('Solicitação recusada.');
      }

      fetchRequests();
    } catch (err: any) {
      alert('Erro ao processar ação: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Solicitações de Upgrade</h1>
        <p className="text-slate-500 text-sm">Analise e aprove as mudanças de planos dos seus clientes</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {requests.length > 0 ? (
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Igreja</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fluxo</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{r.churchNome}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="text-slate-400 line-through uppercase">{r.planoAtualNome}</span>
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      <span className="text-emerald-600 uppercase font-black">{r.planoSolicitadoNome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(r.dataSolicitacao).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${r.status === 'pendente' ? 'bg-amber-100 text-amber-700' :
                      r.status === 'aprovado' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {r.status === 'pendente' ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleAction(r, 'aprovado')} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase shadow-lg shadow-emerald-100 transition-all active:scale-95">Aprovar</button>
                        <button onClick={() => handleAction(r, 'recusado')} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase border border-red-100">Recusar</button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Concluído</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-slate-400 font-bold">Nenhuma solicitação pendente.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpgradeRequestsManager;
