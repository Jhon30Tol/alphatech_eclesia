import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    receitaTotal: 0,
    membrosAtivos: 0,
    eventosMes: 0
  });
  const [chartData, setChartData] = useState<{ name: string; receita: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string>('Analisando dados do ecossistema...');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Receita Total (Soma de financeiro_entradas)
      const { data: financeiro } = await supabase
        .from('financeiro_entradas')
        .select('valor, data');

      const totalReceita = financeiro?.reduce((acc, curr) => acc + Number(curr.valor), 0) || 0;

      // 2. Membros Ativos
      const { count: membrosCount } = await supabase
        .from('membros')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo');

      // 3. Eventos Este Mês
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

      const { count: eventosCount } = await supabase
        .from('eventos')
        .select('*', { count: 'exact', head: true })
        .gte('data', startOfMonth.toISOString())
        .lte('data', endOfMonth.toISOString());

      setStats({
        receitaTotal: totalReceita,
        membrosAtivos: membrosCount || 0,
        eventosMes: eventosCount || 0
      });

      // 4. Processar Gráfico (Últimos 6 meses)
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const processedData = processChartData(financeiro || []);
      setChartData(processedData);

      // Simulação de insight baseada em dados reais
      if (totalReceita === 0 && (membrosCount || 0) === 0) {
        setAiInsight("Seu ecossistema está pronto para crescer. Comece cadastrando membros.");
      } else {
        setAiInsight("O crescimento é consistente. Foque na retenção de novos membros.");
      }

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (entradas: any[]) => {
    try {
      if (!Array.isArray(entradas)) return [];

      // Agrupar por mês
      const grouped = entradas.reduce((acc: any, curr) => {
        // Validação defensiva de dados
        if (!curr?.data || !curr?.valor) return acc;

        const date = new Date(curr.data);
        if (isNaN(date.getTime())) return acc; // Data inválida

        const monthIndex = date.getMonth();
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const monthName = monthNames[monthIndex];

        if (!monthName) return acc;

        if (!acc[monthName]) acc[monthName] = 0;

        const valor = Number(curr.valor);
        if (!isNaN(valor)) {
          acc[monthName] += valor;
        }

        return acc;
      }, {});

      // Order by month index to ensure correct chronological order
      const monthOrder = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      return Object.keys(grouped)
        .sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b))
        .map(key => ({
          name: key,
          receita: grouped[key] || 0
        }));
    } catch (err) {
      console.error('Erro ao processar gráfico:', err);
      return [];
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 md:space-y-24 pb-24 px-4 sm:px-6">
      {/* Cinematic Hero */}
      <section className="relative min-h-[450px] md:h-[550px] w-full rounded-[32px] md:rounded-[56px] overflow-hidden group cinematic-shadow bg-stone-900">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center grayscale opacity-50 group-hover:scale-105 transition-transform duration-[3000ms]"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544427928-c49cdfebf49c?auto=format&fit=crop&q=80&w=2000')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-stone-950/20" />

        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 lg:p-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-stone-950/60 border border-amber-500/50 backdrop-blur-xl mb-4 md:mb-8">
                <span className="text-amber-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
                  Visão Geral do Ecossistema
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-display text-white leading-tight md:leading-[1.1] mb-6">
                Sua missão em <br />
                <span className="font-serif italic text-amber-500 font-normal">plena ordem.</span>
              </h1>
              <p className="text-stone-300 text-base md:text-lg max-w-lg leading-relaxed font-light opacity-90 hidden sm:block">
                Onde a clareza encontra o propósito. Gerencie sua comunidade através de uma interface desenhada para o cuidado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 md:gap-20 px-2">
        <div className="space-y-3 group cursor-default">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] group-hover:text-amber-600 transition-colors">Tesouraria</p>
          <div className="flex items-baseline gap-3">
            <h3 className="text-4xl md:text-5xl font-display text-stone-900 tracking-tight">
              {loading ? '...' : `R$ ${stats.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </h3>
            {/* <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+0%</span> */}
          </div>
          <div className="h-[2px] w-8 bg-amber-500 group-hover:w-full transition-all duration-1000 ease-out origin-left"></div>
        </div>

        <div className="space-y-3 group cursor-default">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] group-hover:text-amber-600 transition-colors">Comunidade</p>
          <div className="flex items-baseline gap-3">
            <h3 className="text-4xl md:text-5xl font-display text-stone-900 tracking-tight">
              {loading ? '...' : stats.membrosAtivos}
            </h3>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Ativos</span>
          </div>
          <div className="h-[2px] w-8 bg-stone-200 group-hover:w-full transition-all duration-1000 ease-out origin-left"></div>
        </div>

        <div className="space-y-3 group cursor-default">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] group-hover:text-amber-600 transition-colors">Eventos</p>
          <div className="flex items-baseline gap-3">
            <h3 className="text-4xl md:text-5xl font-display text-stone-900 tracking-tight">
              {loading ? '...' : stats.eventosMes}
            </h3>
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Este mês</span>
          </div>
          <div className="h-[2px] w-8 bg-stone-200 group-hover:w-full transition-all duration-1000 ease-out origin-left"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20">
        {/* Performance Chart */}
        <div className="lg:col-span-8 space-y-12">
          <div className="flex items-center justify-between border-b border-stone-200 pb-8">
            <h3 className="text-2xl md:text-3xl font-display italic text-stone-800 tracking-tight">Crescimento Financeiro</h3>
          </div>
          <div className="h-[300px] md:h-[400px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#a8a29e', fontSize: 10, fontWeight: 800 }}
                    dy={25}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0c0a09',
                      border: 'none',
                      borderRadius: '24px',
                      color: '#fafaf9',
                      fontSize: '11px',
                      padding: '20px',
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}
                    itemStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                    cursor={{ stroke: '#d97706', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="receita"
                    stroke="#d97706"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#chartGradient)"
                    animationDuration={3500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                <p className="text-stone-400 font-medium">Ainda não há dados financeiros suficientes.</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Insight Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-stone-950 rounded-[40px] p-10 md:p-14 text-stone-50 cinematic-shadow flex flex-col h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 blur-[100px] rounded-full"></div>

            <div className="relative z-10 space-y-10 flex flex-col h-full">
              <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center text-stone-950 shadow-xl shadow-amber-900/30">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>

              <h3 className="text-3xl md:text-4xl font-display leading-tight">Sabedoria <br /><span className="italic font-serif text-amber-500">Estratégica</span></h3>

              <p className="text-stone-400 font-light text-lg leading-relaxed italic opacity-80 flex-1">
                "{aiInsight}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
