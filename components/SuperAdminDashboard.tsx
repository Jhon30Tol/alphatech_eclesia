import React, { useMemo, useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import AdminSubscriptionApproval from './AdminSubscriptionApproval';

const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState([
    { label: 'Total de Igrejas', value: '-', change: '...', trend: 'neutral' },
    { label: 'Assinaturas Ativas', value: '-', change: '...', trend: 'neutral' },
    { label: 'MRR (Rec. Mensal)', value: 'R$ -', change: '...', trend: 'neutral' },
    { label: 'Churn Rate', value: '0%', change: '0%', trend: 'neutral' },
  ]);

  const [popularPlans, setPopularPlans] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState({ upgrades: 0, expired: 0 });
  const [growthData, setGrowthData] = useState<{ month: string, revenue: number }[]>([]);

  useEffect(() => {
    fetchRealStats();
  }, []);

  const fetchRealStats = async () => {
    try {
      // 1. Total Igrejas
      const { count: churchesCount } = await supabase.from('igrejas').select('*', { count: 'exact', head: true });

      // 2. Assinaturas e Planos para MRR e Popularidade
      const { data: allSubs, error: subsError } = await supabase
        .from('assinaturas')
        .select('*, planos(*)');

      if (subsError) throw subsError;

      const activeSubs = allSubs?.filter(s => s.status === 'ativa') || [];
      const mrr = activeSubs.reduce((acc, sub: any) => acc + (Number(sub.planos?.preco) || 0), 0) || 0;

      // 3. Planos Populares
      const planCounts: Record<string, { count: number, name: string }> = {};
      activeSubs.forEach((sub: any) => {
        const name = sub.planos?.nome || 'Desconhecido';
        if (!planCounts[name]) planCounts[name] = { count: 0, name };
        planCounts[name].count++;
      });

      const sortedPlans = Object.values(planCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      // 4. Pendências
      const { count: upgradeCount } = await supabase
        .from('solicitacoes_upgrade')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');

      const { count: expiredCount } = await supabase
        .from('assinaturas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'expirada');

      // 5. Cálculo de Crescimento de Receita (Últimos 6 Meses)
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const currentMonth = new Date().getMonth();
      const lastSixMonths: { month: string, revenue: number }[] = [];

      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const monthYear = new Date().getFullYear() - (currentMonth - i < 0 ? 1 : 0);
        const monthName = months[monthIndex];

        // Calcular receita para este mês específico
        // Simplificação: Considerar assinaturas que foram criadas até o final desse mês
        // E que ainda estão ativas ou expiraram depois desse mês.
        const targetDate = new Date(monthYear, monthIndex + 1, 0); // Último dia do mês

        const monthRevenue = allSubs?.reduce((acc, sub: any) => {
          const startDate = new Date(sub.data_inicio || sub.created_at);
          // Se começou antes do fim do mês e (não expirou ou expirou depois do início do mês)
          if (startDate <= targetDate && (sub.status === 'ativa' || new Date(sub.data_expiracao) >= new Date(monthYear, monthIndex, 1))) {
            return acc + (Number(sub.planos?.preco) || 0);
          }
          return acc;
        }, 0) || 0;

        lastSixMonths.push({ month: monthName, revenue: monthRevenue });
      }

      setStats([
        { label: 'Total de Igrejas', value: String(churchesCount || 0), change: '+0%', trend: 'neutral' },
        { label: 'Assinaturas Ativas', value: String(activeSubs.length || 0), change: '+0%', trend: 'neutral' },
        { label: 'MRR (Real)', value: `R$ ${mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: '+0%', trend: 'neutral' },
        { label: 'Churn Rate', value: '0%', change: '0%', trend: 'neutral' },
      ]);

      setPopularPlans(sortedPlans);
      setPendingRequests({ upgrades: upgradeCount || 0, expired: expiredCount || 0 });
      setGrowthData(lastSixMonths);

    } catch (err) {
      console.error('Erro ao buscar estatísticas reais:', err);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-stone-900">Painel Executivo</h1>
        <p className="text-stone-500">Métricas reais consolidadas do Supabase</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[32px] shadow-sm border border-stone-100 transition-hover hover:border-emerald-200">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-3">{stat.label}</p>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-stone-900 uppercase">{stat.value}</p>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${stat.trend === 'up' ? 'bg-emerald-100 text-emerald-700' :
                stat.trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-500'
                }`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-stone-100">
            <h3 className="text-lg font-black text-stone-800 mb-6 uppercase tracking-tight">Crescimento de Receita</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorEmerald" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                    itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorEmerald)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <AdminSubscriptionApproval />
        </div>

        <div className="space-y-6">
          <div className="bg-stone-950 p-8 rounded-[40px] shadow-xl text-white">
            <h3 className="text-sm font-black mb-6 uppercase tracking-widest text-stone-500">Planos Populares</h3>
            <div className="space-y-6">
              {popularPlans.length > 0 ? popularPlans.map((p, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-black uppercase">{p.name}</span>
                    <span className="text-stone-500 font-bold">{p.count} ativos</span>
                  </div>
                  <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${(p.count / (stats[1].value === '-' ? 1 : parseInt(stats[1].value))) * 100}%` }}></div>
                  </div>
                </div>
              )) : <p className="text-stone-500 text-xs font-bold">Nenhum plano ativo encontrado.</p>}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-stone-100">
            <h3 className="text-xs font-black text-stone-400 mb-6 uppercase tracking-widest">Pendências Críticas</h3>
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-4 rounded-2xl text-xs font-bold transition-all ${pendingRequests.expired > 0 ? 'bg-red-50 text-red-700' : 'bg-stone-50 text-stone-400 opacity-50'}`}>
                <div className={`w-2 h-2 rounded-full ${pendingRequests.expired > 0 ? 'bg-red-600 animate-pulse' : 'bg-stone-300'}`} />
                {pendingRequests.expired} Assinaturas Expiradas
              </div>
              <div className={`flex items-center gap-3 p-4 rounded-2xl text-xs font-bold transition-all ${pendingRequests.upgrades > 0 ? 'bg-amber-50 text-amber-700' : 'bg-stone-50 text-stone-400 opacity-50'}`}>
                <div className={`w-2 h-2 rounded-full ${pendingRequests.upgrades > 0 ? 'bg-amber-600' : 'bg-stone-300'}`} />
                {pendingRequests.upgrades} Upgrades Pendentes
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
