
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';

interface FinanceManagerProps {
  isPremium: boolean;
  onUpgrade: () => void;
}

// Adicionado igrejaId para satisfazer a interface Transaction
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', igrejaId: 'church-default', descricao: 'Dízimo João', valor: 500, tipo: 'Entrada', subTipo: 'Dízimo', categoria: 'Membros', data: '2024-10-01', observacao: 'Fiel mantenedor' },
  { id: '2', igrejaId: 'church-default', descricao: 'Aluguel Outubro', valor: 1200, tipo: 'Saída', categoria: 'Aluguel', data: '2024-10-05', observacao: 'Pago via PIX' },
];

const FinanceManager: React.FC<FinanceManagerProps> = ({ isPremium, onUpgrade }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [financeTypes, setFinanceTypes] = useState<TransactionType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);

  const [formData, setFormData] = useState<Partial<Transaction>>({
    descricao: '',
    valor: 0,
    tipo: 'Entrada',
    subTipo: '',
    categoria: '',
    data: new Date().toISOString().split('T')[0],
    observacao: ''
  });

  useEffect(() => {
    const savedTypes = localStorage.getItem('saas_finance_types');
    if (savedTypes) {
      setFinanceTypes(JSON.parse(savedTypes));
    }
  }, [isModalOpen]);

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-xl border border-slate-100 text-center space-y-6">
        <div className="bg-amber-100 p-4 rounded-full">
          <svg className="w-12 h-12 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Módulo Financeiro Bloqueado</h2>
        <p className="text-slate-600 max-w-md">O controle financeiro completo e detalhado está disponível apenas nos planos Profissional e Enterprise.</p>
        <button 
          onClick={onUpgrade}
          className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
        >
          Fazer Upgrade Agora
        </button>
      </div>
    );
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.data.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, curr) => {
      if (curr.tipo === 'Entrada') acc.entradas += curr.valor;
      else acc.saidas += curr.valor;
      acc.saldo = acc.entradas - acc.saidas;
      return acc;
    }, { entradas: 0, saidas: 0, saldo: 0 });
  }, { entradas: 0, saidas: 0, saldo: 0 });

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir este lançamento?')) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setTransactions(transactions.map(t => t.id === editingId ? { ...t, ...formData as Transaction } : t));
    } else {
      // Adicionado igrejaId ao criar novo lançamento
      setTransactions([...transactions, { ...formData as Transaction, id: Math.random().toString(36).substr(2, 9), igrejaId: 'church-default' }]);
    }
    setIsModalOpen(false);
    setEditingId(null);
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const activeTypes = useMemo(() => {
    return financeTypes.filter(t => t.status === 'Ativo' && t.tipo === formData.tipo);
  }, [financeTypes, formData.tipo]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fluxo de Caixa</h1>
          <p className="text-slate-500 text-sm">Controle detalhado de entradas e saídas</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setFormData({ tipo: 'Entrada', valor: 0, data: new Date().toISOString().split('T')[0], subTipo: '', categoria: '', descricao: '' }); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition-all"
        >
          Novo Lançamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Período</label>
          <input type="month" className="w-full mt-1 bg-slate-50 border-none rounded-lg text-sm font-semibold p-2 text-slate-900" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <label className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Total Entradas</label>
          <p className="text-xl font-bold text-slate-800 mt-1">{formatCurrency(totals.entradas)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <label className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Total Saídas</label>
          <p className="text-xl font-bold text-slate-800 mt-1">{formatCurrency(totals.saidas)}</p>
        </div>
        <div className={`p-4 rounded-2xl shadow-sm border ${totals.saldo >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-red-50 border-red-100'}`}>
          <label className={`text-[10px] font-bold uppercase tracking-wider ${totals.saldo >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>Saldo Líquido</label>
          <p className={`text-xl font-bold mt-1 ${totals.saldo >= 0 ? 'text-indigo-900' : 'text-red-900'}`}>{formatCurrency(totals.saldo)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Data</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Descrição</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Tipo/Categoria</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Valor</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredTransactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                    {new Date(t.data).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-900">{t.descricao}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg uppercase">
                      {t.tipo === 'Entrada' ? (t.subTipo || 'Entrada') : (t.categoria || 'Saída')}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-black ${t.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.tipo === 'Entrada' ? '+' : '-'} {formatCurrency(t.valor)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button onClick={() => { setEditingId(t.id); setFormData(t); setIsModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors">Editar</button>
                    <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-900 transition-colors">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, tipo: 'Entrada', subTipo: '', categoria: ''})}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.tipo === 'Entrada' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}
                >Entrada</button>
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, tipo: 'Saída', subTipo: '', categoria: ''})}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.tipo === 'Saída' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}
                >Saída</button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Descrição</label>
                <input required type="text" className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900" value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} placeholder="Ex: Pagamento Mensalidade" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Valor (R$)</label>
                  <input required type="number" step="0.01" className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900" value={formData.valor} onChange={(e) => setFormData({...formData, valor: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Data</label>
                  <input required type="date" className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tipo de Lançamento</label>
                {activeTypes.length > 0 ? (
                  <select 
                    required 
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900" 
                    value={formData.tipo === 'Entrada' ? formData.subTipo : formData.categoria} 
                    onChange={(e) => {
                      if (formData.tipo === 'Entrada') setFormData({...formData, subTipo: e.target.value});
                      else setFormData({...formData, categoria: e.target.value});
                    }}
                  >
                    <option value="" className="text-slate-900">Selecione um tipo...</option>
                    {activeTypes.map(t => (
                      <option key={t.id} value={t.descricao} className="text-slate-900">{t.descricao}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-amber-50 text-amber-700 text-xs rounded-xl border border-amber-100 font-bold text-slate-900">
                    Nenhum tipo de {formData.tipo.toLowerCase()} ativo encontrado. Cadastre em "Tipos de Lançamento".
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Observação (Opcional)</label>
                <textarea className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 resize-none" rows={2} value={formData.observacao} onChange={(e) => setFormData({...formData, observacao: e.target.value})} />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all">Cancelar</button>
                <button type="submit" disabled={activeTypes.length === 0} className={`flex-1 py-4 text-white rounded-2xl font-bold shadow-xl transition-all ${activeTypes.length === 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManager;
