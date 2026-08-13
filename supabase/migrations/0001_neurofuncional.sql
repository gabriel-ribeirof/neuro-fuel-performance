-- Nutrição Neurofuncional iEsports — schema de agendamento e contratos.
-- Rodar no Supabase (SQL Editor) após conectar o projeto via Lovable.

-- profiles estende auth.users com papel e dados do responsável.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'responsavel' check (role in ('responsavel', 'profissional', 'admin')),
  nome text not null default '',
  telefone text not null default '',
  -- só para profissionais: slug que identifica quem é (amanda/manuela/leticia/gabriel)
  profissional_slug text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "ve o proprio perfil" on public.profiles for select
  using (auth.uid() = id);
create policy "cria o proprio perfil" on public.profiles for insert
  with check (auth.uid() = id);
create policy "atualiza o proprio perfil" on public.profiles for update
  using (auth.uid() = id);

-- Atletas sob responsabilidade de uma conta (pais/responsável).
create table if not exists public.atletas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  sobrenome text not null,
  idade integer not null,
  clube text not null,
  email text,
  telefone text not null,
  created_at timestamptz not null default now()
);

alter table public.atletas enable row level security;

create policy "ve os proprios atletas" on public.atletas for select
  using (auth.uid() = user_id);
create policy "cria os proprios atletas" on public.atletas for insert
  with check (auth.uid() = user_id);
create policy "atualiza os proprios atletas" on public.atletas for update
  using (auth.uid() = user_id);

-- Contratos: pacote contratado por um responsável para um atleta.
create table if not exists public.contratos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  atleta_id uuid not null references public.atletas(id) on delete restrict,
  pacote_slug text not null,
  valor_centavos integer not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'cancelado')),
  mercado_pago_payment_id text,
  created_at timestamptz not null default now()
);

alter table public.contratos enable row level security;

create policy "ve os proprios contratos" on public.contratos for select
  using (auth.uid() = user_id);
create policy "cria os proprios contratos" on public.contratos for insert
  with check (auth.uid() = user_id);

create unique index contratos_mp_payment_id_key on public.contratos (mercado_pago_payment_id)
  where mercado_pago_payment_id is not null;

-- Agendamentos (sessões de um contrato/pacote).
create table if not exists public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  atleta_id uuid not null references public.atletas(id) on delete cascade,
  profissional_slug text not null check (profissional_slug in ('amanda', 'manuela', 'leticia', 'gabriel')),
  tipo_sessao text not null,
  data date not null,
  horario text not null,
  duracao_min integer not null default 60,
  status text not null default 'agendado' check (status in ('agendado', 'confirmado', 'cancelado', 'realizado')),
  created_at timestamptz not null default now()
);

alter table public.agendamentos enable row level security;

create policy "ve agendamentos dos proprios contratos" on public.agendamentos for select
  using (
    exists (
      select 1 from public.contratos c
      where c.id = agendamentos.contrato_id and c.user_id = auth.uid()
    )
  );
create policy "ve agendamentos do meu consultorio" on public.agendamentos for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('profissional', 'admin')
    )
  );

-- View de disponibilidade: expõe só data/horário/profissional/duração de
-- horários efetivamente ocupados (agendados/confirmados), sem identificar
-- quem é — qualquer cliente autenticado consulta pra não marcar em cima.
create or replace view public.horarios_ocupados as
  select data, horario, duracao_min, profissional_slug
  from public.agendamentos
  where status in ('agendado', 'confirmado');

grant select on public.horarios_ocupados to authenticated;