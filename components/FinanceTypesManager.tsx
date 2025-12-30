
import React, { useState, useEffect } from 'react';
import { TransactionType } from '../types';

// Adicionado igrejaId para satisfazer a interface TransactionType
const DEFAULT_TYPES: TransactionType[] = [
  { id: '1', igrejaId: 'church-default', descricao: 'Dízimo', tipo: 'Entrada', status: 'Ativo' },
  { id: '2', igrejaId: 'church-default', descricao: 'Oferta', tipo: 'Entrada', status: 'Ativo' },
  { id: '3', igrejaId: 'church-default', descricao: 'Doação', tipo: 'Entrada', status: 'Ativo' },
  { id: '4', igrejaId: 'church-default', descricao: 'Aluguel', tipo: 'Saída', status: 'Ativo' },
  { id: '5', igrejaId: 'church-default', descricao: 'Energia', tipo: 'Saída', status: 'Ativo' },
  { id: '6', igrejaId: 'church-default', descricao: 'Água', tipo: 'Saída', status: 'Ativo' },
];

const FinanceTypesManager: React.FC = () => {
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<TransactionType>>({
    descricao: '',
    tipo: 'Entrada',
    status: 'Ativo'
  });

  useEffect(() => {
    const saved = localStorage.getItem('saas_finance_types');
    if (saved) {
      setTypes(JSON.parse(saved));
    } else {
      setTypes(DEFAULT_TYPES);
      localStorage.setItem('saas_finance_types', JSON.stringify(DEFAULT_TYPES));
    }
  }, []);

  const saveToStorage = (newTypes: TransactionType[]) => {
    setTypes(newTypes);
    localStorage.setItem('saas_finance_types', JSON.stringify(newTypes));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = types.map(t => t.id === editingId ? { ...t, ...formData as TransactionType } : t);
      saveToStorage(updated);
    } else {
      // Adicionado igrejaId ao criar novo tipo
      const newItem: TransactionType = {
        ...formData as TransactionType,
        id: Math.random().toString(36).substr(2, 9),
        igrejaId: 'church-default',
      };
      saveToStorage([...types, newItem]);
    }
    setIsModalOpen(false);
    setEditingId(null);
  };

  const toggleStatus = (id: string) => {
    const updated = types.map(t => t.id === id ? { ...t, status: t.status === 'Ativo' ? 'Inativo' : 'Ativo' } as TransactionType : t);
    saveToStorage(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir este tipo? Lançamentos existentes não serão afetados, mas este tipo não aparecerá mais em novos registros.')) {
      saveToStorage(types.filter(t => t.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tipos de Lançamento</h1>
          <p className="text-slate-500 text-sm">Configure as categorias de entradas e saídas do sistema</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setFormData({ descricao: '', tipo: 'Entrada', status: 'Ativo' }); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition-all"
        >
          Novo Tipo
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Descrição</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Fluxo</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {types.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-slate-800">{t.descricao}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${t.tipo === 'Entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {t.tipo}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => toggleStatus(t.id)}
                    className={`flex items-center gap-2 text-xs font-bold ${t.status === 'Ativo' ? 'text-green-600' : 'text-slate-400'}`}
                  >
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${t.status === 'Ativo' ? 'bg-green-500' : 'bg-slate-200'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${t.status === 'Ativo' ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                    </div>
                    {t.status}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => { setEditingId(t.id); setFormData(t); setIsModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 mr-4 font-bold text-sm">Editar</button>
                  <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-900 font-bold text-sm">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Tipo' : 'Novo Tipo'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Descrição</label>
                <input required type="text" className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900" value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} placeholder="Ex: Doação de Alimentos" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Fluxo de Caixa</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, tipo: 'Entrada'})}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.tipo === 'Entrada' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}
                  >Entrada</button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, tipo: 'Saída'})}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.tipo === 'Saída' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}
                  >Saída</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Status Inicial</label>
                <select className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})}>
                  <option value="Ativo" className="text-slate-900">Ativo</option>
                  <option value="Inativo" className="text-slate-900">Inativo</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl transition-all">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceTypesManager;
