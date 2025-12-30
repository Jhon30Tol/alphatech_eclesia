
export interface User {
  id: string;
  igrejaId?: string; // ID da igreja à qual o usuário pertence
  name: string;
  email: string;
  avatar: string;
  role: 'super_admin' | 'admin' | 'user' | 'lider' | 'secretaria' | 'admin_igreja';
  subscription?: Subscription;
  isWhitelist?: boolean;
}

export type SubscriptionStatus = 'ativa' | 'pendente' | 'cancelada' | 'expirada' | 'bloqueada';

export interface Subscription {
  id: string;
  igrejaId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  renewalDate: string;
}

export enum View {
  // Views das Igrejas
  DASHBOARD = 'dashboard',
  CHURCH_CONFIG = 'church_config',
  MEMBERS = 'members',
  FINANCES = 'finances',
  FINANCE_TYPES = 'finance_types',
  EVENTS = 'events',
  BILLING = 'billing',
  ANALYTICS = 'analytics',
  SETTINGS = 'settings',
  AI_ASSISTANT = 'ai_assistant',

  // Views do Super Admin
  SAAS_DASHBOARD = 'saas_dashboard',
  SAAS_CHURCHES = 'saas_churches',
  SAAS_PLANS = 'saas_plans',
  SAAS_UPGRADES = 'saas_upgrades',
  SAAS_SETTINGS = 'saas_settings'
}

// Interfaces para o Dono do SAAS
export interface ChurchClient {
  id: string;
  nome: string;
  emailAdmin: string;
  planoId: string;
  status: SubscriptionStatus;
  dataInicio: string;
  dataExpiracao: string;
  membrosAtuais: number;
}

export interface SaaSPlan {
  id: string;
  nome: string;
  preco: number;
  limiteMembros: number;
  recursos: string[];
  ativo: boolean;
}

export interface UpgradeRequest {
  id: string;
  churchId: string;
  churchNome: string;
  planoAtualId: string;
  planoSolicitadoId: string;
  dataSolicitacao: string;
  status: 'pendente' | 'aprovado' | 'recusado';
}

// Interfaces de Negócio (Operacional)
export interface TransactionType {
  id: string;
  igrejaId: string; // Garantindo multi-tenancy
  descricao: string;
  tipo: 'Entrada' | 'Saída';
  status: 'Ativo' | 'Inativo';
}

export interface Transaction {
  id: string;
  igrejaId: string; // Garantindo multi-tenancy
  descricao: string;
  valor: number;
  tipo: 'Entrada' | 'Saída';
  subTipo?: string;
  categoria: string;
  data: string;
  observacao?: string;
}

export interface CalendarEvent {
  id: string;
  igrejaId: string; // Garantindo multi-tenancy
  titulo: string;
  descricao: string;
  data: string;
  hora?: string;
  local?: string;
  cor: string;
}

export interface Member {
  id: string;
  igrejaId: string; // Garantindo multi-tenancy
  nome: string;
  telefone: string;
  email: string;
  ministerio: string;
  status: 'Ativo' | 'Inativo' | 'Pendente';
  dataNascimento: string;
}
