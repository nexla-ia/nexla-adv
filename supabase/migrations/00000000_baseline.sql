-- ════════════════════════════════════════════════════════════════════════════
-- Migration baseline — Nexla Adv
--
-- Reconstitui o estado-base do banco antigo MedicinaMKT
-- (`pllvpbzskmargpdpvumg`) que foi capturado via Dashboard em 2026-05-06.
--
-- Tabelas EXCLUÍDAS desta baseline (lixo legado / outros produtos):
--   - messages, mensagens (rascunhos antigos de outra modelagem)
--   - b2b-controleCliente, pagou_NexlaDaily (outros produtos da Nexla)
--   - nexla_historico (log interno)
--   - n8n_chat_histories_* (integrações n8n específicas, recriadas via RPC
--     ensure_table_setup quando necessário)
--
-- Tabelas MANTIDAS mesmo sem uso direto pelo React (populadas por integrações
-- externas — n8n, webhooks, automações):
--   - clientes  (registro bruto de contatos com classificação de lead)
--   - contacts  (lista de contatos por company_id, com status/unread)
--
-- Esta migration cria APENAS tabelas + índices + FKs.
-- As RPCs/functions vêm em arquivos separados (00000001_baseline_functions.sql
-- + as migrations 20260429_*, 20260430_* já existentes no repo).
--
-- RLS: deixada desabilitada (compat. com o modelo de auth custom via
-- `users.password_hash` + RPC `login_user`). Pode ser ativada depois.
-- ════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ─── clientes (registro bruto de contatos populado por integrações n8n) ───
-- Nota: id é int8 (não uuid) por compatibilidade com a base antiga.
CREATE TABLE IF NOT EXISTS public.clientes (
  id                    bigserial PRIMARY KEY,
  nome                  text,
  numero                text,
  instancia             text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  primeiro_contato      text,
  ultima_mensagem       text,
  "data_ultimaMensagem" text,
  classificacao_lead    text,
  origem                text,
  session_id            text
);
CREATE INDEX IF NOT EXISTS idx_clientes_instancia       ON public.clientes(instancia);
CREATE INDEX IF NOT EXISTS idx_clientes_session_id      ON public.clientes(session_id);

-- ─── companies ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.companies (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text NOT NULL,
  slug                    text UNIQUE,
  plan                    text NOT NULL,
  active                  boolean NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),
  contacts_table          text,
  history_table           text,
  instance                text UNIQUE,
  api_instancia           text,
  max_users               integer,
  digisac_url             text,
  ai_enabled              boolean,
  evolution_url           text,
  extra_users             integer,
  max_professionals       integer,
  max_agendas             integer,
  billing_day             integer,
  next_due_date           date,
  billing_amount          numeric(10,2),
  billing_grace_days      integer DEFAULT 1,
  billing_reminder_days   integer DEFAULT 3,
  billing_blocked         boolean DEFAULT false,
  instagram_enabled       boolean NOT NULL DEFAULT false,
  instagram_webhook_path  text
);

-- ─── users ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  email           text NOT NULL UNIQUE,
  password_hash   text NOT NULL,
  role            text NOT NULL,
  active          boolean NOT NULL DEFAULT true,
  company_id      uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);

-- ─── contacts (lista de contatos por company_id, alternativa ao saved_contacts) ──
CREATE TABLE IF NOT EXISTS public.contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  phone       text NOT NULL,
  status      text NOT NULL DEFAULT 'ativo',
  last_msg    text,
  unread      integer NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone      ON public.contacts(phone);

-- ─── invoices ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  amount          numeric(10,2) NOT NULL,
  due_date        date NOT NULL,
  paid_at         timestamptz,
  payment_method  text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON public.invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date   ON public.invoices(due_date);

-- ─── sectors / sector_members ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sectors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  instancia   text NOT NULL,
  color       text,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sectors_instancia ON public.sectors(instancia);

CREATE TABLE IF NOT EXISTS public.sector_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id  uuid NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE
);

-- ─── professionals ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.professionals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instancia      text NOT NULL,
  name           text NOT NULL,
  specialty      text,
  registration   text,
  color          text,
  active         boolean DEFAULT true,
  created_at     timestamptz DEFAULT now(),
  working_days   integer[],
  start_time     time,
  end_time       time,
  break_start    time,
  break_end      time
);
CREATE INDEX IF NOT EXISTS idx_professionals_instancia ON public.professionals(instancia);

-- ─── agendas ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agendas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instancia        text NOT NULL,
  name             text NOT NULL,
  color            text,
  working_days     integer[],
  start_time       time,
  end_time         time,
  slot_minutes     integer,
  active           boolean DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  professional_id  uuid REFERENCES public.professionals(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_agendas_instancia ON public.agendas(instancia);

-- ─── insurance_plans  (saúde — DROPADA na migration de pivô jurídico) ──────
CREATE TABLE IF NOT EXISTS public.insurance_plans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instancia   text NOT NULL,
  name        text NOT NULL,
  active      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_insurance_plans_instancia ON public.insurance_plans(instancia);

-- ─── procedures  (vira "services" jurídicos depois) ────────────────────────
CREATE TABLE IF NOT EXISTS public.procedures (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instancia         text NOT NULL,
  name              text NOT NULL,
  type              text,
  duration_minutes  integer,
  price_particular  numeric(10,2),
  professional_id   uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  active            boolean DEFAULT true,
  created_at        timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_procedures_instancia ON public.procedures(instancia);

-- ─── procedure_prices  (saúde — DROPADA na migration de pivô jurídico) ─────
CREATE TABLE IF NOT EXISTS public.procedure_prices (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id        uuid REFERENCES public.procedures(id) ON DELETE CASCADE,
  insurance_plan_id   uuid REFERENCES public.insurance_plans(id) ON DELETE CASCADE,
  price               numeric(10,2) NOT NULL,
  instancia           text
);

-- ─── saved_contacts  (vira "clients" no copy/UI; tabela mantém nome) ───────
-- Colunas clínicas (allergies, medications, blood_type etc.) serão DROPADAS
-- na migration de pivô jurídico.
CREATE TABLE IF NOT EXISTS public.saved_contacts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero               text NOT NULL,
  instancia            text NOT NULL,
  nome                 text NOT NULL,
  notes                text,
  created_by_email     text,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now(),
  birth_date           date,
  cpf                  text,
  email                text,
  address              text,
  insurance_plan_id    uuid REFERENCES public.insurance_plans(id) ON DELETE SET NULL,
  insurance_card       text,
  photo                text,
  phone_secondary      text,
  gender               text,
  profession           text,
  rg                   text,
  emergency_contact    text,
  emergency_phone      text,
  allergies            text,
  chronic_conditions   text,
  medications          text,
  clinical_notes       text,
  nome_social          text,
  marital_status       text,
  blood_type           text,
  weight               numeric(5,2),
  height               numeric(5,2),
  referral_source      text,
  guardian_name        text,
  guardian_phone       text
);
CREATE INDEX IF NOT EXISTS idx_saved_contacts_instancia ON public.saved_contacts(instancia);
CREATE INDEX IF NOT EXISTS idx_saved_contacts_numero    ON public.saved_contacts(numero);

-- ─── appointments ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id           uuid REFERENCES public.agendas(id) ON DELETE SET NULL,
  instancia           text NOT NULL,
  contact_numero      text,
  contact_nome        text NOT NULL,
  starts_at           timestamptz NOT NULL,
  duration_minutes    integer DEFAULT 30,
  status              text DEFAULT 'agendado',
  notes               text,
  created_by_email    text,
  created_at          timestamptz DEFAULT now(),
  professional_id     uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  procedure_id        uuid REFERENCES public.procedures(id) ON DELETE SET NULL,
  insurance_plan_id   uuid REFERENCES public.insurance_plans(id) ON DELETE SET NULL,
  price               numeric(10,2),
  payment_status      text DEFAULT 'pendente',
  paid_at             timestamptz
);
CREATE INDEX IF NOT EXISTS idx_appointments_instancia       ON public.appointments(instancia);
CREATE INDEX IF NOT EXISTS idx_appointments_starts_at       ON public.appointments(starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON public.appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_contact_numero  ON public.appointments(contact_numero);

-- ─── attendances ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendances (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero          text NOT NULL,
  instancia       text NOT NULL,
  sector_id       uuid REFERENCES public.sectors(id) ON DELETE SET NULL,
  sector_name     text,
  sector_color    text,
  attendant_name  text,
  attendant_email text,
  assumed_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attendances_numero_instancia ON public.attendances(numero, instancia);

-- ─── conversations ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  text NOT NULL,
  instancia   text NOT NULL,
  reason      text,
  closed_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conversations_session_instancia ON public.conversations(session_id, instancia);

-- ─── mensagens_geral ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mensagens_geral (
  id                  bigserial PRIMARY KEY,
  nome                text,
  instancia           text,
  numero              text,
  mensagem            text,
  "horaLastMessage"   text,
  base64              text,
  type                text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  id_mensagem         text,
  aplicativo          text,
  recipient_id        text
);
CREATE INDEX IF NOT EXISTS idx_mensagens_geral_instancia_numero ON public.mensagens_geral(instancia, numero);
CREATE INDEX IF NOT EXISTS idx_mensagens_geral_created_at       ON public.mensagens_geral(created_at);

-- ─── alerts ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alerts (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instancia              text NOT NULL,
  mensagem               text NOT NULL,
  resolved               boolean NOT NULL DEFAULT false,
  created_at             timestamptz NOT NULL DEFAULT now(),
  numero                 text,
  forwarded_to_user_id   uuid REFERENCES public.users(id) ON DELETE SET NULL,
  forwarded_to_name      text,
  forwarded_by_name      text
);
CREATE INDEX IF NOT EXISTS idx_alerts_instancia_resolved ON public.alerts(instancia, resolved);

-- ─── kanban_columns / kanban_cards ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kanban_columns (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instancia   text NOT NULL,
  name        text NOT NULL,
  color       text,
  position    double precision DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kanban_columns_instancia ON public.kanban_columns(instancia);

CREATE TABLE IF NOT EXISTS public.kanban_cards (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id            uuid REFERENCES public.kanban_columns(id) ON DELETE CASCADE,
  instancia            text NOT NULL,
  title                text NOT NULL,
  description          text,
  assigned_user_id     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_user_name   text,
  due_date             date,
  priority             text DEFAULT 'normal',
  position             double precision DEFAULT 0,
  created_by_email     text,
  created_at           timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_instancia ON public.kanban_cards(instancia);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_column_id ON public.kanban_cards(column_id);

-- ─── support_tickets / support_messages ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  subject              text NOT NULL,
  status               text NOT NULL DEFAULT 'aberto',
  created_by_user_id   uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_by_name      text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  last_message_at      timestamptz NOT NULL DEFAULT now(),
  last_sender          text
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_company_id ON public.support_tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status     ON public.support_tickets(status);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id         uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type       text NOT NULL,
  sender_user_id    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  sender_name       text,
  message           text,
  image             text,
  read_by_company   boolean DEFAULT false,
  read_by_adm       boolean DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON public.support_messages(ticket_id);
