import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthProps {
  onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [churchName, setChurchName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // O onAuthStateChange no App.tsx vai cuidar do redirecionamento
      } else {
        // 1. Criar Usuário no Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              nome: name,
              role: 'admin_igreja',
            }
          }
        });
        if (authError) throw authError;

        if (authData.user) {
          // 2. Se login automático ocorreu (sem confirmação de email), criamos a estrutura
          // Nota: Em produção, isso deveria ser feito via Trigger ou Edge Function para segurança total

          // A. Criar Igreja
          const createdChurchName = churchName.trim() || `Igreja de ${name.split(' ')[0]}`;
          const { data: churchData, error: churchError } = await supabase
            .from('igrejas')
            .insert([{ nome: createdChurchName }])
            .select()
            .single();

          if (churchError && churchError.code !== '42501') { // Ignora erro de permissão se RLS bloquear insert direto (assumindo que user não pode criar)
            console.error('Erro ao criar igreja:', churchError);
            // Tentar continuar ou falhar? Vamos alertar.
          }

          if (churchData) {
            // B. Atualizar Perfil com ID da Igreja
            const { error: profileError } = await supabase
              .from('perfis')
              .update({ igreja_id: churchData.id })
              .eq('id', authData.user.id);

            // C. Buscar Plano Enterprise para Trial
            const { data: enterprisePlan } = await supabase
              .from('planos')
              .select('id')
              .eq('nome', 'Enterprise')
              .single();

            // D. Criar Assinatura Trial (14 Dias)
            // Se não achar Enterprise, usa um genérico ou cria sem plano
            if (enterprisePlan) {
              const trialDays = 14;
              const expirationDate = new Date();
              expirationDate.setDate(expirationDate.getDate() + trialDays);

              await supabase.from('assinaturas').insert([{
                igreja_id: churchData.id,
                plano_id: enterprisePlan.id,
                status: 'ativa',
                data_expiracao: expirationDate.toISOString(),
                renovacao_automatica: false
              }]);
            }
          }
        }

        alert('Cadastro realizado! Aproveite seus 14 dias de teste grátis.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
      {/* Left: Visual Side */}
      <div className="hidden md:flex md:w-1/2 bg-stone-950 relative overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1548625361-195fe01c27b4?auto=format&fit=crop&q=80&w=2000"
            alt="Abstract architecture"
            className="w-full h-full object-cover grayscale"
          />
        </div>
        <div className="relative z-10 text-center space-y-8">
          <h1 className="text-7xl font-display text-white italic leading-tight">
            Gestão com <br /><span className="text-amber-500">propósito.</span>
          </h1>
          <p className="text-stone-400 text-xl font-light max-w-md mx-auto leading-relaxed">
            Organize sua comunidade com a elegância e a clareza que sua missão merece.
          </p>
        </div>
      </div>

      {/* Right: Form Side */}
      <div className="flex-1 flex flex-col justify-center py-12 px-8 sm:px-12 lg:px-24">
        <div className="max-w-md w-full mx-auto space-y-12">
          <div className="space-y-4">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-[0.4em]">ARXTech Gestão</span>
            <h2 className="text-4xl font-display text-stone-900 leading-tight">
              {isLogin ? 'Bem-vindo de volta.' : 'Comece sua jornada.'}
            </h2>
          </div>

          <form className="space-y-6" onSubmit={handleAuth}>
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            {!isLogin && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-6 py-4 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-stone-300"
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Nome da Igreja (Opcional)</label>
                  <input
                    type="text"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    className="w-full px-6 py-4 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-stone-300"
                    placeholder="Nome da Congregação"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-stone-300"
                placeholder="exemplo@igreja.org"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Senha</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-stone-300"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-stone-900 text-stone-50 rounded-2xl font-bold cinematic-shadow hover:bg-stone-800 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Processando...' : (isLogin ? 'Acessar Painel' : 'Criar Conta')}
            </button>
          </form>

          <div className="pt-8 text-center border-t border-stone-100">
            <p className="text-sm text-stone-500">
              {isLogin ? 'Ainda não possui uma conta?' : 'Já possui cadastro?'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 font-bold text-amber-600 hover:text-amber-700 transition-colors"
              >
                {isLogin ? 'Solicitar Acesso' : 'Fazer Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;