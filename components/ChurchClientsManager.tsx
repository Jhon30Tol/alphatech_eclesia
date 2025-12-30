import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SubscriptionStatus } from '../types';

interface ChurchClient {
  id: string; // ID do perfil
  nome: string; // Nome do usuário (admin)
  emailAdmin: string;
  igrejaId: string | null;
  igrejaNome: string;
  planoNome: string;
  status: SubscriptionStatus;
  dataExpiracao: string;
  membrosAtuais: number;
}

const ChurchClientsManager: React.FC = () => {
  const [clients, setClients] = useState<ChurchClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      // Alterado para buscar de perfis master
      const { data, error } = await supabase
        .from('perfis')
        .select(`
          id,
          nome,
          email,
          igreja_id,
          igrejas (
            id,
            nome,
            assinaturas (
              status,
              data_expiracao,
              planos (nome)
            ),
            membros (count)
          )
        `)
        .eq('role', 'admin_igreja');

      if (error) throw error;

      const formatted: ChurchClient[] = data.map((p: any) => {
        const igreja = p.igrejas;
        const sub = igreja?.assinaturas?.[0];

        return {
          id: p.id,
          nome: p.nome,
          emailAdmin: p.email || 'Sem e-mail',
          igrejaId: igreja?.id || null,
          igrejaNome: igreja?.nome || 'Igreja não criada',
          planoNome: sub?.planos?.nome || 'Nenhum',
          status: sub?.status as SubscriptionStatus || 'pendente',
          dataExpiracao: sub?.data_expiracao || new Date().toISOString(),
          membrosAtuais: igreja?.membros?.[0]?.count || 0
        };
      });

      setClients(formatted);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (client: ChurchClient) => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir o cliente "${client.nome}"? Esta ação removerá os dados da igreja e assinaturas, mas a conta no Auth precisará ser removida manualmente.`);

    if (!confirmed) return;

    try {
      setLoading(true);

      // 1. Deletar assinaturas se houver igreja
      if (client.igrejaId) {
        await supabase.from('assinaturas').delete().eq('igreja_id', client.igrejaId);
        // Outras tabelas dependentes da igreja deveriam ser deletadas aqui ou via CASCADE no banco
        await supabase.from('membros').delete().eq('igreja_id', client.igrejaId);
        await supabase.from('igrejas').delete().eq('id', client.igrejaId);
      }

      // 2. Deletar perfil
      const { error } = await supabase.from('perfis').delete().eq('id', client.id);

      if (error) throw error;

      alert('Cliente excluído com sucesso do banco de dados.');
      fetchClients();
    } catch (err) {
      console.error('Erro ao excluir cliente:', err);
      alert('Erro ao excluir cliente do banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Cliente', 'Email', 'Igreja', 'Plano', 'Status', 'Membros', 'Vencimento'];
    const rows = filtered.map(c => [
      c.nome,
      c.emailAdmin,
      c.igrejaNome,
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
    link.setAttribute('download', `relatorio_clientes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = clients.filter(c =>
    c.nome.toLowerCase().includes(filter.toLowerCase()) ||
    c.igrejaNome.toLowerCase().includes(filter.toLowerCase())
  );

  const toggleStatus = async (igrejaId: string | null, currentStatus: string) => {
    if (!igrejaId) return;
    try {
      const nextStatus = currentStatus === 'ativa' ? 'bloqueada' : 'ativa';
      const { error } = await supabase
        .from('assinaturas')
        .update({ status: nextStatus })
        .eq('igreja_id', igrejaId);

      if (error) throw error;
      fetchClients();
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

  if (loading && clients.length === 0) return <div className="p-10 text-center animate-pulse text-stone-400">Carregando clientes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-stone-800">Base de Clientes</h1>
          <p className="text-stone-500 text-sm">Gerencie todos os perfis de administradores e suas igrejas</p>
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
          placeholder="Buscar por nome do cliente ou igreja..."
          className="w-full px-5 py-3 bg-stone-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-[40px] shadow-xl border border-stone-100 overflow-hidden">
        <table className="min-w-full divide-y divide-stone-100">
          <thead className="bg-stone-50">
            <tr>
              <th className="px-6 py-5 text-left text-[10px] font-black text-stone-400 uppercase tracking-widest">Administrador</th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-stone-400 uppercase tracking-widest">Igreja / Plano</th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-stone-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-stone-400 uppercase tracking-widest">Vencimento</th>
              <th className="px-6 py-5 text-right text-[10px] font-black text-stone-400 uppercase tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.length > 0 ? filtered.map(c => (
              <tr key={c.id} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-stone-800">{c.nome}</span>
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-tight">{c.emailAdmin}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-stone-700">{c.igrejaNome}</span>
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{c.planoNome}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(c.status)}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[11px] font-black uppercase tracking-widest ${new Date(c.dataExpiracao) < new Date() ? 'text-red-500' : 'text-stone-400'}`}>
                    {new Date(c.dataExpiracao).toLocaleDateString('pt-BR')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button
                    onClick={() => toggleStatus(c.igrejaId, c.status)}
                    disabled={!c.igrejaId}
                    className={`px-3 py-2 rounded-xl font-black text-[10px] uppercase transition-all active:scale-95 disabled:opacity-30 ${c.status === 'bloqueada'
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                  >
                    {c.status === 'bloqueada' ? 'OK' : 'Bloquear'}
                  </button>
                  <button
                    onClick={() => handleDeleteClient(c)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase hover:bg-red-100 transition-all active:scale-95"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-stone-400 font-bold italic">
                  Nenhum cliente administrador encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChurchClientsManager;
