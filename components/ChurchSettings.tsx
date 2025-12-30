import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface ChurchSettingsProps {
  currentUser?: User;
  onChurchCreated?: () => Promise<void>;
}

const ChurchSettings: React.FC<ChurchSettingsProps> = ({ currentUser, onChurchCreated }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    razao_social: '',
    cnpj: '',
    email_institucional: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    pastor_responsavel: ''
  });

  useEffect(() => {
    if (currentUser?.igrejaId) {
      fetchChurchData();
      setIsCreating(false);
    } else if (currentUser) {
      setLoading(false);
      setIsCreating(false);
    }
  }, [currentUser]);

  const fetchChurchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('igrejas')
        .select('*')
        .eq('id', currentUser?.igrejaId)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          nome: data.nome || '',
          razao_social: data.razao_social || '',
          cnpj: data.cnpj || '',
          email_institucional: data.email_institucional || data.email_principal || '',
          telefone: data.telefone || '',
          endereco: data.endereco || '',
          cidade: data.cidade || '',
          estado: data.estado || '',
          pastor_responsavel: data.pastor_responsavel || ''
        });
      }
    } catch (err) {
      console.error('Erro ao carregar dados da igreja:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setSaving(true);

      if (currentUser.igrejaId) {
        // MODO EDIÇÃO
        const { error } = await supabase
          .from('igrejas')
          .update({
            nome: formData.nome,
            razao_social: formData.razao_social,
            cnpj: formData.cnpj,
            email_institucional: formData.email_institucional,
            telefone: formData.telefone,
            endereco: formData.endereco,
            cidade: formData.cidade,
            estado: formData.estado,
            pastor_responsavel: formData.pastor_responsavel,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentUser.igrejaId);

        if (error) throw error;
        alert('Cadastro da Igreja atualizado com sucesso!');
      } else {
        // MODO CRIAÇÃO NOVO TENANT
        // 1. Criar a igreja
        const { data: newChurch, error: churchError } = await supabase
          .from('igrejas')
          .insert([{
            nome: formData.nome,
            razao_social: formData.razao_social,
            cnpj: formData.cnpj,
            email_institucional: formData.email_institucional,
            telefone: formData.telefone,
            endereco: formData.endereco,
            cidade: formData.cidade,
            estado: formData.estado,
            pastor_responsavel: formData.pastor_responsavel
          }])
          .select()
          .single();

        if (churchError) throw churchError;

        // 2. Vincular ao perfil do usuário
        const { error: profileError } = await supabase
          .from('perfis')
          .update({ igreja_id: newChurch.id })
          .eq('id', currentUser.id);

        if (profileError) throw profileError;

        alert('Instituição cadastrada e vinculada com sucesso!');
        if (onChurchCreated) await onChurchCreated();
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar dados da instituição.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Se não tem igreja e não está no modo de criação, mostra o aviso + botão
  if (!currentUser?.igrejaId && !isCreating) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 shadow-sm">
        <div className="bg-amber-50 rounded-3xl border border-amber-200 p-10 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-amber-900">Instituição não encontrada</h3>
            <p className="text-amber-800 max-w-sm mx-auto">
              Percebemos que seu perfil ainda não está vinculado a uma igreja. Para começar a gerenciar seus membros e finanças, você precisa cadastrar sua instituição.
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="px-8 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 shadow-lg shadow-amber-600/20 transition-all active:scale-95"
          >
            Cadastrar Minha Instituição
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-display text-stone-900">
              {currentUser?.igrejaId ? 'Configurações da Igreja' : 'Cadastrar Nova Instituição'}
            </h1>
            <p className="text-stone-500 mt-1">
              {currentUser?.igrejaId
                ? 'Gerencie as informações institucionais da sua organização.'
                : 'Preencha os dados abaixo para criar o perfil oficial da sua igreja.'}
            </p>
          </div>
          {isCreating && !currentUser?.igrejaId && (
            <button
              onClick={() => setIsCreating(false)}
              className="text-stone-400 hover:text-stone-600 font-medium text-sm"
            >
              Cancelar
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Nome da Igreja (Fantasia)</label>
            <input
              required
              type="text"
              placeholder="Ex: Igreja Batista Renovada"
              className="w-full px-5 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-stone-300"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Razão Social</label>
            <input
              type="text"
              placeholder="Nome jurídico oficial"
              className="w-full px-5 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.razao_social}
              onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">CNPJ</label>
            <input
              type="text"
              placeholder="00.000.000/0001-00"
              className="w-full px-5 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">E-mail Institucional</label>
            <input
              type="email"
              placeholder="contato@igreja.org"
              className="w-full px-5 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.email_institucional}
              onChange={(e) => setFormData({ ...formData, email_institucional: e.target.value })}
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Telefone</label>
            <input
              type="text"
              placeholder="(00) 0000-0000"
              className="w-full px-5 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Endereço Completo</label>
            <input
              type="text"
              placeholder="Rua, número, bairro..."
              className="w-full px-5 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Cidade</label>
            <input
              type="text"
              placeholder="Cidade"
              className="w-full px-5 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.cidade}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Estado (UF)</label>
            <input
              type="text"
              placeholder="UF"
              maxLength={2}
              className="w-full px-5 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all uppercase"
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Pastor Responsável / Presidente</label>
            <input
              type="text"
              placeholder="Nome do responsável"
              className="w-full px-5 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.pastor_responsavel}
              onChange={(e) => setFormData({ ...formData, pastor_responsavel: e.target.value })}
            />
          </div>

          <div className="col-span-2 pt-6 flex justify-end">
            <button
              disabled={saving}
              type="submit"
              className={`px-10 py-4 rounded-2xl font-bold shadow-xl transition-all transform active:scale-95 disabled:opacity-50 ${currentUser?.igrejaId
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
            >
              {saving ? 'Processando...' : currentUser?.igrejaId ? 'Salvar Alterações' : 'Concluir Cadastro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChurchSettings;
