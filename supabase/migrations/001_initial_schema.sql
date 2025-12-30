-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Tabela de PLANOS (SaaS)
create table public.planos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  preco numeric(10,2) not null,
  limite_membros integer,
  recursos jsonb,
  ativo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de IGREJAS (Tenants)
create table public.igrejas (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  email_principal text,
  telefone text,
  endereco text,
  status text check (status in ('ativa', 'suspensa')) default 'ativa',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de ASSINATURAS (Vincula Igreja -> Plano)
create table public.assinaturas (
  id uuid primary key default uuid_generate_v4(),
  igreja_id uuid references public.igrejas(id) not null,
  plano_id uuid references public.planos(id) not null,
  status text check (status in ('ativa', 'expirada', 'cancelada')) default 'ativa',
  data_inicio timestamp with time zone default now(),
  data_expiracao timestamp with time zone,
  renovacao_automatica boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de PERFIS DE USUÁRIO (Extensão do auth.users)
create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  igreja_id uuid references public.igrejas(id), -- Nullable se for Super Admin? Ou Super Admin tem igreja_id null?
  nome text,
  email text,
  role text check (role in ('super_admin', 'admin_igreja', 'lider', 'secretaria')) default 'admin_igreja',
  ativo boolean default true,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de MEMBROS
create table public.membros (
  id uuid primary key default uuid_generate_v4(),
  igreja_id uuid references public.igrejas(id) not null,
  nome text not null,
  telefone text,
  email text,
  ministerio text,
  status text check (status in ('ativo', 'inativo')) default 'ativo',
  data_nascimento date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de FINANCEIRO (Entradas)
create table public.financeiro_entradas (
  id uuid primary key default uuid_generate_v4(),
  igreja_id uuid references public.igrejas(id) not null,
  tipo text, -- Dízimo, Oferta, etc
  valor numeric(10,2) not null,
  data date default CURRENT_DATE,
  observacao text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de FINANCEIRO (Saídas)
create table public.financeiro_saidas (
  id uuid primary key default uuid_generate_v4(),
  igreja_id uuid references public.igrejas(id) not null,
  categoria text, -- Manutenção, Salários, etc
  valor numeric(10,2) not null,
  data date default CURRENT_DATE,
  observacao text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de EVENTOS
create table public.eventos (
  id uuid primary key default uuid_generate_v4(),
  igreja_id uuid references public.igrejas(id) not null,
  nome text not null,
  data date not null,
  horario time,
  local text,
  descricao text,
  cor text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de SOLICITAÇÕES DE UPGRADE
create table public.solicitacoes_upgrade (
  id uuid primary key default uuid_generate_v4(),
  igreja_id uuid references public.igrejas(id) not null,
  plano_atual_id uuid references public.planos(id),
  plano_solicitado_id uuid references public.planos(id) not null,
  status text check (status in ('pendente', 'aprovado', 'recusado')) default 'pendente',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS) --

alter table public.igrejas enable row level security;
alter table public.perfis enable row level security;
alter table public.membros enable row level security;
alter table public.financeiro_entradas enable row level security;
alter table public.financeiro_saidas enable row level security;
alter table public.eventos enable row level security;
alter table public.assinaturas enable row level security;

-- Policy helper function: Checa se o usuário pertence à igreja do registro
create or replace function public.pertence_a_igreja(resource_igreja_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from public.perfis
    where id = auth.uid()
      and igreja_id = resource_igreja_id
  );
end;
$$ language plpgsql security definer;

-- Policy helper function: Checa se o usuário é super admin
create or replace function public.is_super_admin()
returns boolean as $$
begin
  return exists (
    select 1
    from public.perfis
    where id = auth.uid()
      and role = 'super_admin'
  );
end;
$$ language plpgsql security definer;

-- Policies --

-- Perfil: Usuário vê seu próprio perfil
create policy "Usuários podem ver seu próprio perfil" on public.perfis
  for select using (auth.uid() = id);

create policy "Usuários podem atualizar seu próprio perfil" on public.perfis
  for update using (auth.uid() = id);

-- Membros: Apenas da mesma igreja
create policy "Ver membros da mesma igreja" on public.membros
  for select using (public.pertence_a_igreja(igreja_id));

create policy "Gerenciar membros da mesma igreja" on public.membros
  for all using (public.pertence_a_igreja(igreja_id));

-- Financeiro Entradas
create policy "Ver entradas da mesma igreja" on public.financeiro_entradas
  for select using (public.pertence_a_igreja(igreja_id));

create policy "Gerenciar entradas da mesma igreja" on public.financeiro_entradas
  for all using (public.pertence_a_igreja(igreja_id));

-- Financeiro Saídas
create policy "Ver saídas da mesma igreja" on public.financeiro_saidas
  for select using (public.pertence_a_igreja(igreja_id));

create policy "Gerenciar saídas da mesma igreja" on public.financeiro_saidas
  for all using (public.pertence_a_igreja(igreja_id));

-- Eventos
create policy "Ver eventos da mesma igreja" on public.eventos
  for select using (public.pertence_a_igreja(igreja_id));

create policy "Gerenciar eventos da mesma igreja" on public.eventos
  for all using (public.pertence_a_igreja(igreja_id));

-- TRIGGER: Criar perfil automaticamente ao criar usuário no Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfis (id, email, nome, role, igreja_id)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'nome', 
    coalesce(new.raw_user_meta_data->>'role', 'admin_igreja'), 
    (new.raw_user_meta_data->>'igreja_id')::uuid
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Dados Iniciais (Opcional - Seeds) --
-- insert into public.planos (nome, preco, limite_membros) values ('Básico', 99.00, 100);
-- insert into public.planos (nome, preco, limite_membros) values ('Profissional', 199.00, 500);
