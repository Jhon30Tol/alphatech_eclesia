import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SubscriptionStatus } from '../types';

interface ChurchClient {
  id: string;
  nome: string;
  emailAdmin: string;
  planoNome: string;
  status: SubscriptionStatus;
  dataExpiracao: string;
  membrosAtuais: number;
}

const ChurchClientsManager: React.FC = () => {
  const [churches, setChurches] = useState<ChurchClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchChurches();
  }, []);

  const fetchChurches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('igrejas')
        .select(`
          id,
          nome,
          email_principal,
          status,
          assinaturas (
            status,
            data_expiracao,
            planos (nome)
          ),
          membros (count)
        `);

      if (error) throw error;

      const formatted: ChurchClient[] = data.map((c: any) => {
        const sub = c.assinaturas?.[0];
        return {
          id: c.id,
          nome: c.nome,
          emailAdmin: c.email_principal || 'Sem e-mail',
          planoNome: sub?.planos?.nome || 'Nenhum',
          status: sub?.status || 'pendente',
          dataExpiracao: sub?.data_expiracao || new Date().toISOString(),
          membrosAtuais: c.membros?.[0]?.count || 0
        };
      });

      setChurches(formatted);
    } catch (err) {
      console.error('Erro ao buscar igrejas:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Igreja', 'Email', 'Plano', 'Status', 'Membros', 'Vencimento'];
    const rows = filtered.map(c => [
      c.nome,
      c.emailAdmin,
      c.planoNome,
      c.status,
      c.membrosAtuais,
      new Date(c.dataExpiracao).toLocaleDateString('pt-BR')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_igrejas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = churches.filter(c => c.nome.toLowerCase().includes(filter.toLowerCase()));

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'ativa' ? 'bloqueada' : 'ativa';
      const { error } = await supabase
        .from('assinaturas')
        .update({ status: nextStatus })
        .eq('igreja_id', id);

      if (error) throw error;
      fetchChurches();
    } catch (err) {
      alert('Erro ao alterar status');
    }
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    const styles = {
      ativa: 'bg-emerald-100 text-emerald-700',
      expirada: 'bg-red-100 text-red-700',
      cancelada: 'bg-slate-100 text-slate-500',
      bloqueada: 'bg-stone-800 text-white',
      pendente: 'bg-amber-100 text-amber-700'
    };
    return <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${styles[status]}`}>{status}</span>;
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-stone-400">Carregando clientes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-stone-800">Assinantes (Igrejas)</h1>
          <p className="text-stone-500 text-sm">Gerencie o acesso e planos das igrejas clientes</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-[10px] font-black uppercase text-stone-600 hover:bg-stone-50 transition-all active:scale-95 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Exportar Relatório
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-stone-100">
        <input
          type="text"
          placeholder="Buscar por nome da igreja..."
          className="w-full px-5 py-3 bg-stone-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-[40px] shadow-xl border border-stone-100 overflow-hidden">
        <table className="min-w-full divide-y divide-stone-100">
          <thead className="bg-stone-50">
            <tr>
              <th className="px-6 py-5 text-left text-[10px] font-black text-stone-400 uppercase tracking-widest">Igreja</th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-stone-400 uppercase tracking-widest">Plano / Status</th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-stone-400 uppercase tracking-widest">Membros</th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-stone-400 uppercase tracking-widest">Vencimento</th>
              <th className="px-6 py-5 text-right text-[10px] font-black text-stone-400 uppercase tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-stone-800">{c.nome}</span>
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-tight">{c.emailAdmin}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest bg-stone-100 px-2 py-0.5 rounded-lg">{c.planoNome}</span>
                    {getStatusBadge(c.status)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-stone-700">{c.membrosAtuais}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[11px] font-black uppercase tracking-widest ${new Date(c.dataExpiracao) < new Date() ? 'text-red-500' : 'text-stone-400'}`}>
                    {new Date(c.dataExpiracao).toLocaleDateString('pt-BR')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => toggleStatus(c.id, c.status)}
                    className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all active:scale-95 ${c.status === 'bloqueada'
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                  >
                    {c.status === 'bloqueada' ? 'Desbloquear' : 'Bloquear'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChurchClientsManager;
