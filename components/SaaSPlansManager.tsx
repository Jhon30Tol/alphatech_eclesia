import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SaaSPlan {
  id?: string;
  nome: string;
  preco: number;
  limite_membros: number;
  recursos: string[]; // No schema é jsonb, mas usamos array de strings no front
  ativo: boolean;
}

const SaaSPlansManager: React.FC = () => {
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SaaSPlan | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .order('preco');
      if (error) throw error;
      if (data) setPlans(data);
    } catch (err) {
      console.error('Erro ao buscar planos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: SaaSPlan) => {
    setEditingPlan({ ...plan });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingPlan({
      nome: '',
      preco: 0,
      limite_membros: 100,
      recursos: [],
      ativo: true
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      if (editingPlan.id) {
        // UPDATE
        const { error } = await supabase
          .from('planos')
          .update({
            nome: editingPlan.nome,
            preco: editingPlan.preco,
            limite_membros: editingPlan.limite_membros,
            recursos: editingPlan.recursos,
            ativo: editingPlan.ativo,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPlan.id);
        if (error) throw error;
      } else {
        // INSERT
        const { error } = await supabase
          .from('planos')
          .insert([editingPlan]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchPlans();
      alert('Plano salvo com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar plano: ' + err.message);
    }
  };

  const handleToggleRecurso = (recurso: string) => {
    if (!editingPlan) return;
    const current = editingPlan.recursos || [];
    if (current.includes(recurso)) {
      setEditingPlan({ ...editingPlan, recursos: current.filter(r => r !== recurso) });
    } else {
      setEditingPlan({ ...editingPlan, recursos: [...current, recurso] });
    }
  };

  const AVAILABLE_FEATURES = [
    'Calendário de Eventos',
    'Cadastro da Igreja',
    'Suporte por E-mail',
    'Fluxo Financeiro Completo',
    'IA Business Insights',
    'Relatórios Avançados',
    'Suporte Prioritário',
    'Dashboard Customizado',
    'API de Integração',
    'Treinamento VIP',
    'Gerente de Contas'
  ];

  if (loading) return <div className="text-center p-10 text-stone-500 animate-pulse">Carregando planos...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Planos & Preços</h1>
          <p className="text-slate-500 text-sm">Configure os produtos disponíveis no mercado</p>
        </div>
        <button
          onClick={handleAddNew}
          className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
        >
          Novo Plano
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 ${plan.ativo ? 'text-emerald-500' : 'text-slate-300'}`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>

            <h3 className="text-xl font-black text-slate-800">{plan.nome}</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-black text-slate-900">R$ {Number(plan.preco).toFixed(2)}</span>
              <span className="ml-1 text-slate-400 font-bold">/mês</span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Capacidade</div>
              <div className="text-sm font-bold text-slate-700">{plan.limite_membros >= 9999 ? 'Ilimitado' : `${plan.limite_membros} Membros`}</div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50 space-y-2">
              {Array.isArray(plan.recursos) && plan.recursos.map((r: string, idx: number) => (
                <div key={idx} className="flex items-center text-xs font-semibold text-slate-500">
                  <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  {r}
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all transform md:translate-y-2 group-hover:translate-y-0">
              <button
                onClick={() => handleEdit(plan)}
                className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all hover:bg-slate-800 shadow-xl"
              >
                Editar Plano
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-[40px] p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-800">{editingPlan.id ? 'Editar Plano' : 'Criar Novo Plano'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome Comercial</label>
                  <input
                    required
                    value={editingPlan.nome}
                    placeholder="Ex: Profissional, Black Friday..."
                    onChange={e => setEditingPlan({ ...editingPlan, nome: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Preço (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={editingPlan.preco}
                    onChange={e => setEditingPlan({ ...editingPlan, preco: parseFloat(e.target.value) })}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Limite de Membros</label>
                  <input
                    required
                    type="number"
                    placeholder="9999 para ilimitado"
                    value={editingPlan.limite_membros}
                    onChange={e => setEditingPlan({ ...editingPlan, limite_membros: parseInt(e.target.value) })}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Recursos Inclusos</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVAILABLE_FEATURES.map(recurso => (
                    <button
                      key={recurso}
                      type="button"
                      onClick={() => handleToggleRecurso(recurso)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left text-xs font-bold transition-all ${editingPlan.recursos?.includes(recurso)
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                        }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${editingPlan.recursos?.includes(recurso) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                        }`}>
                        {editingPlan.recursos?.includes(recurso) && <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      {recurso}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={editingPlan.ativo}
                  onChange={e => setEditingPlan({ ...editingPlan, ativo: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-200 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="ativo" className="text-sm font-bold text-slate-700">Plano Ativo (Disponível para assinatura)</label>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95">
                  {editingPlan.id ? 'Salvar Alterações' : 'Criar Plano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaaSPlansManager;
