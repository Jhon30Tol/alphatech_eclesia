
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Subscription, SubscriptionStatus } from '../types';

interface BillingProps {
  currentSubscription: Subscription;
  onUpdateSubscription: (sub: Partial<Subscription>) => void;
}

const Billing: React.FC<BillingProps> = ({ currentSubscription, onUpdateSubscription }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .eq('ativo', true)
        .order('preco');

      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    const styles = {
      ativa: 'bg-green-100 text-green-700',
      pendente: 'bg-amber-100 text-amber-700',
      cancelada: 'bg-red-100 text-red-700',
      expirada: 'bg-slate-200 text-slate-600',
      bloqueada: 'bg-stone-800 text-white'
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${styles[status]}`}>{status}</span>;
  };

  if (loading) return <div className="text-center p-20 animate-pulse text-stone-400">Carregando planos...</div>;

  return (
    <div className="space-y-10 pb-20">
      {/* Current Subscription Card */}
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800">Sua Assinatura Atual</h2>
            {getStatusBadge(currentSubscription.status)}
          </div>
          <p className="text-slate-500 font-medium capitalize">Plano: {currentSubscription.planId}</p>
          <div className="flex gap-4 text-sm font-semibold">
            <span className="text-slate-400">Início: <span className="text-slate-700">{new Date(currentSubscription.startDate).toLocaleDateString()}</span></span>
            <span className="text-slate-400">Renovação: <span className="text-slate-700">{new Date(currentSubscription.renewalDate).toLocaleDateString()}</span></span>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {currentSubscription.status === 'ativa' ? (
            <button onClick={() => onUpdateSubscription({ status: 'cancelada' })} className="flex-1 md:flex-none px-6 py-3 border-2 border-red-500 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all">Cancelar Plano</button>
          ) : (
            <button onClick={() => onUpdateSubscription({ status: 'ativa' })} className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition-all">Reativar Agora</button>
          )}
        </div>
      </div>

      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-black text-slate-900">Mude seu Nível de Gestão</h1>
        <p className="text-slate-500 font-medium">Planos flexíveis que crescem junto com a sua comunidade.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <div key={i} className={`p-8 rounded-3xl border shadow-xl transition-all hover:scale-[1.02] relative flex flex-col ${plan.id === currentSubscription.planId ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-white'}`}>
            {plan.nome === 'Profissional' && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">RECOMENDADO</span>
            )}
            <div className="mb-8">
              <h3 className="text-xl font-black text-slate-800">{plan.nome}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-black text-slate-900">R$ {Number(plan.preco).toFixed(2)}</span>
                <span className="ml-1 text-slate-400 font-bold">/mês</span>
              </div>
            </div>
            <ul className="space-y-4 flex-1 mb-10">
              <li className="flex items-start text-sm text-slate-600 font-medium font-bold">
                <svg className="w-5 h-5 text-indigo-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                Até {plan.limite_membros >= 9999 ? 'Ilimitados' : plan.limite_membros} membros
              </li>
              {Array.isArray(plan.recursos) && plan.recursos.map((feature: string, idx: number) => (
                <li key={idx} className="flex items-start text-sm text-slate-600 font-medium">
                  <svg className="w-5 h-5 text-indigo-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              disabled={plan.id === currentSubscription.planId}
              onClick={() => onUpdateSubscription({ planId: plan.id as any, status: 'ativa' })}
              className={`w-full py-4 rounded-2xl font-black transition-all shadow-md ${plan.id === currentSubscription.planId ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
            >
              {plan.id === currentSubscription.planId ? 'Plano Atual' : 'Migrar Plano'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Billing;
