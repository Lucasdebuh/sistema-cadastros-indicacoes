-- =================================================================
--  SISTEMA DE CADASTROS COM INDICAÇÕES
--  Script completo do banco de dados (Supabase / PostgreSQL)
--
--  COMO USAR:
--  1. Abra o painel do Supabase > SQL Editor > New query
--  2. Cole TODO este arquivo e clique em "Run"
--  3. Depois crie o usuário administrador (instruções no final)
--
--  Este script pode ser executado mais de uma vez com segurança.
-- =================================================================

-- -----------------------------------------------------------------
-- 1. EXTENSÕES
-- -----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------
-- 2. TABELA PRINCIPAL: registrations (pessoas cadastradas)
-- -----------------------------------------------------------------
create table if not exists public.registrations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  birth_date    date not null,
  phone         text not null,                 -- somente dígitos: 22999999999
  referral_code text not null,                 -- código exclusivo desta pessoa
  referred_by   uuid references public.registrations(id) on delete set null,
  consent       boolean not null default true, -- consentimento LGPD
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint registrations_phone_key         unique (phone),
  constraint registrations_referral_code_key unique (referral_code),
  constraint registrations_phone_format      check (phone ~ '^[0-9]{10,11}$'),
  constraint registrations_name_length       check (char_length(btrim(name)) between 3 and 120),
  constraint registrations_birth_range       check (birth_date > '1900-01-01' and birth_date <= current_date),
  constraint registrations_no_self_reference check (referred_by is null or referred_by <> id)
);

comment on table  public.registrations               is 'Pessoas cadastradas e suas indicações.';
comment on column public.registrations.phone         is 'Telefone somente com dígitos (DDD + número).';
comment on column public.registrations.referral_code is 'Código exclusivo usado no link ?ref=';
comment on column public.registrations.referred_by   is 'ID da pessoa que indicou este cadastro.';

-- Índices
create index if not exists registrations_referred_by_idx on public.registrations (referred_by);
create index if not exists registrations_created_at_idx  on public.registrations (created_at desc);
create index if not exists registrations_name_search_idx on public.registrations using gin (to_tsvector('portuguese', name));

-- Atualiza updated_at automaticamente
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.registrations;
create trigger set_updated_at
  before update on public.registrations
  for each row execute function public.tg_set_updated_at();

-- -----------------------------------------------------------------
-- 3. TABELA DE ADMINISTRADORES
--    Apenas usuários listados aqui enxergam os cadastros.
--    Criar conta no Supabase Auth NÃO dá acesso automático.
-- -----------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

comment on table public.admins is 'Usuários autorizados a acessar o painel administrativo.';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- -----------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
--    Visitantes anônimos NÃO têm nenhum acesso direto às tabelas.
--    O cadastro público acontece somente pela função public_register().
-- -----------------------------------------------------------------
alter table public.registrations enable row level security;
alter table public.admins        enable row level security;

drop policy if exists "admins_select_registrations" on public.registrations;
drop policy if exists "admins_insert_registrations" on public.registrations;
drop policy if exists "admins_update_registrations" on public.registrations;
drop policy if exists "admins_delete_registrations" on public.registrations;

create policy "admins_select_registrations" on public.registrations
  for select to authenticated using (public.is_admin());

create policy "admins_insert_registrations" on public.registrations
  for insert to authenticated with check (public.is_admin());

create policy "admins_update_registrations" on public.registrations
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admins_delete_registrations" on public.registrations
  for delete to authenticated using (public.is_admin());

drop policy if exists "admins_read_admins" on public.admins;
create policy "admins_read_admins" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- Nenhum privilégio direto para visitantes anônimos
revoke all on public.registrations from anon;
revoke all on public.admins        from anon;

-- -----------------------------------------------------------------
-- 5. GERADOR DE CÓDIGO DE INDICAÇÃO
--    Alfabeto sem caracteres ambíguos (sem O, 0, I, 1)
-- -----------------------------------------------------------------
create or replace function public.generate_referral_code()
returns text
language plpgsql
volatile
set search_path = public, pg_temp
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i int;
  attempt int := 0;
begin
  loop
    candidate := '';
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;

    exit when not exists (
      select 1 from public.registrations r where r.referral_code = candidate
    );

    attempt := attempt + 1;
    if attempt > 40 then
      raise exception 'Não foi possível gerar um código de indicação único';
    end if;
  end loop;

  return candidate;
end;
$$;

-- -----------------------------------------------------------------
-- 6. VALIDAÇÃO PÚBLICA DO CÓDIGO DE INDICAÇÃO
--    Retorna SOMENTE o primeiro nome de quem indicou.
--    Não expõe telefone, data de nascimento nem a lista de cadastros.
-- -----------------------------------------------------------------
create or replace function public.validate_ref(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text;
begin
  if p_code is null or btrim(p_code) = '' then
    return jsonb_build_object('valid', false);
  end if;

  select split_part(btrim(r.name), ' ', 1)
    into v_name
    from public.registrations r
   where r.referral_code = upper(btrim(p_code))
   limit 1;

  if v_name is null then
    return jsonb_build_object('valid', false);
  end if;

  return jsonb_build_object('valid', true, 'first_name', initcap(v_name));
end;
$$;

-- -----------------------------------------------------------------
-- 7. CADASTRO PÚBLICO
--    Única porta de entrada para visitantes anônimos.
--    Valida os dados, evita duplicidade e devolve apenas o código
--    de indicação da própria pessoa.
--
--    Códigos de retorno:
--      ok               -> cadastro criado
--      duplicate_phone  -> telefone já cadastrado
--      invalid_name     -> nome inválido
--      invalid_phone    -> telefone inválido
--      invalid_birth    -> data de nascimento inválida
--      no_consent       -> consentimento LGPD não marcado
-- -----------------------------------------------------------------
create or replace function public.public_register(
  p_name       text,
  p_birth_date date,
  p_phone      text,
  p_ref        text default null,
  p_consent    boolean default false
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  -- Idade mínima aceita no cadastro. Altere aqui se precisar.
  c_min_age  constant int := 16;
  c_max_age  constant int := 120;

  v_name        text;
  v_phone       text;
  v_code        text;
  v_referrer_id uuid;
  v_new_id      uuid;
  v_age         int;
begin
  -- Consentimento LGPD
  if p_consent is not true then
    return jsonb_build_object('ok', false, 'code', 'no_consent');
  end if;

  -- Nome: remove espaços repetidos
  v_name := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  if char_length(v_name) < 3 or char_length(v_name) > 120 or position(' ' in v_name) = 0 then
    return jsonb_build_object('ok', false, 'code', 'invalid_name');
  end if;

  -- Telefone: mantém apenas dígitos
  v_phone := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  if v_phone !~ '^[0-9]{10,11}$' then
    return jsonb_build_object('ok', false, 'code', 'invalid_phone');
  end if;
  -- DDD válido no Brasil
  if substr(v_phone, 1, 2)::int < 11 then
    return jsonb_build_object('ok', false, 'code', 'invalid_phone');
  end if;
  -- Celular de 11 dígitos precisa começar com 9 após o DDD
  if char_length(v_phone) = 11 and substr(v_phone, 3, 1) <> '9' then
    return jsonb_build_object('ok', false, 'code', 'invalid_phone');
  end if;

  -- Data de nascimento
  if p_birth_date is null or p_birth_date > current_date then
    return jsonb_build_object('ok', false, 'code', 'invalid_birth');
  end if;
  v_age := extract(year from age(current_date, p_birth_date))::int;
  if v_age < c_min_age or v_age > c_max_age then
    return jsonb_build_object('ok', false, 'code', 'invalid_birth');
  end if;

  -- Telefone já cadastrado?
  if exists (select 1 from public.registrations r where r.phone = v_phone) then
    return jsonb_build_object('ok', false, 'code', 'duplicate_phone');
  end if;

  -- Quem indicou (código inexistente é simplesmente ignorado)
  if p_ref is not null and btrim(p_ref) <> '' then
    select r.id into v_referrer_id
      from public.registrations r
     where r.referral_code = upper(btrim(p_ref))
     limit 1;
  end if;

  v_code := public.generate_referral_code();

  insert into public.registrations (name, birth_date, phone, referral_code, referred_by, consent)
  values (v_name, p_birth_date, v_phone, v_code, v_referrer_id, true)
  returning id into v_new_id;

  return jsonb_build_object(
    'ok', true,
    'code', 'ok',
    'referral_code', v_code,
    'name', v_name
  );

exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'duplicate_phone');
end;
$$;

-- -----------------------------------------------------------------
-- 8. PERMISSÕES DAS FUNÇÕES
--    Somente estas duas funções ficam abertas ao público.
-- -----------------------------------------------------------------
revoke all on function public.public_register(text, date, text, text, boolean) from public;
revoke all on function public.validate_ref(text)                               from public;
revoke all on function public.generate_referral_code()                         from public;

grant execute on function public.public_register(text, date, text, text, boolean) to anon, authenticated;
grant execute on function public.validate_ref(text)                              to anon, authenticated;

-- -----------------------------------------------------------------
-- 9. VISÃO PARA O PAINEL ADMINISTRATIVO
--    security_invoker = on  =>  a RLS acima continua valendo.
-- -----------------------------------------------------------------
drop view if exists public.registrations_view;
create view public.registrations_view
with (security_invoker = on) as
select
  r.id,
  r.name,
  r.birth_date,
  r.phone,
  r.referral_code,
  r.referred_by,
  p.name          as referrer_name,
  p.referral_code as referrer_code,
  r.created_at,
  r.updated_at,
  (select count(*) from public.registrations c where c.referred_by = r.id) as referral_count
from public.registrations r
left join public.registrations p on p.id = r.referred_by;

revoke all on public.registrations_view from anon;
grant select on public.registrations_view to authenticated;

-- -----------------------------------------------------------------
-- 10. FUNÇÃO AUXILIAR PARA PROMOVER UM ADMINISTRADOR
-- -----------------------------------------------------------------
create or replace function public.grant_admin(p_email text)
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp, auth
as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(btrim(p_email)) limit 1;

  if v_id is null then
    return 'Usuário não encontrado. Crie primeiro em Authentication > Users.';
  end if;

  insert into public.admins (user_id, email)
  values (v_id, lower(btrim(p_email)))
  on conflict (user_id) do update set email = excluded.email;

  return 'Administrador liberado: ' || p_email;
end;
$$;

revoke all on function public.grant_admin(text) from public, anon, authenticated;

-- =================================================================
--  PASSO FINAL - CRIAR O ADMINISTRADOR
--
--  1) Painel do Supabase > Authentication > Users > "Add user"
--     Marque "Auto Confirm User". Anote o e-mail e a senha.
--
--  2) Volte ao SQL Editor e rode (trocando pelo seu e-mail):
--
--       select public.grant_admin('seu-email@exemplo.com');
--
--  3) Recomendado: Authentication > Sign In / Providers >
--     desative "Allow new users to sign up".
-- =================================================================
