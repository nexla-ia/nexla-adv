-- ════════════════════════════════════════════════════════════════════════════
-- MÓDULO CRM — Funil de leads/clientes pra escritório de advocacia
--
-- Tabelas:
--   crm_funnels       — funis (ex: "Comercial", "Pós-venda")
--   crm_stages        — etapas dentro de cada funil (kanban columns)
--   crm_contacts      — leads/clientes no CRM
--   crm_interactions  — historico de tudo (notas, mudancas de etapa, etc.)
--   crm_lists         — listas dinamicas com filtros salvos
--
-- Bridge:
--   kanban_cards.crm_contact_id → permite vincular tarefas do kanban a um lead
--
-- Automacao:
--   trigger crm_advance_on_appointment → quando appointment eh criado, avanca
--   o lead pra etapa "Reuniao agendada" automaticamente (se existir).
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. crm_funnels ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_funnels (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instancia  text NOT NULL,
  nome       text NOT NULL,
  posicao    integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_funnels_instancia ON public.crm_funnels(instancia);

-- ─── 2. crm_stages ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_stages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instancia     text NOT NULL,
  funil_id      uuid NOT NULL REFERENCES public.crm_funnels(id) ON DELETE CASCADE,
  nome          text NOT NULL,
  cor           text DEFAULT '#94A3B8',
  posicao       integer NOT NULL DEFAULT 0,
  alerta_dias   integer DEFAULT 7,
  is_won        boolean NOT NULL DEFAULT false,
  is_lost       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_stages_funil     ON public.crm_stages(funil_id);
CREATE INDEX IF NOT EXISTS idx_crm_stages_instancia ON public.crm_stages(instancia);

-- ─── 3. crm_contacts ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instancia             text NOT NULL,
  funil_id              uuid NOT NULL REFERENCES public.crm_funnels(id) ON DELETE CASCADE,
  stage_id              uuid REFERENCES public.crm_stages(id) ON DELETE SET NULL,
  phone                 text,
  nome                  text,
  email                 text,
  origem                text,                   -- WhatsApp, Indicacao, Site, etc.
  temperatura           text DEFAULT 'morno' CHECK (temperatura IN ('frio', 'morno', 'quente')),
  tags                  text[] DEFAULT '{}',
  responsavel_id        uuid,                   -- ref opcional ao user
  responsavel_nome      text,
  -- Especificos juridicos
  processo_numero       text,                   -- numero CNJ (opcional)
  area_pratica          text,                   -- Trabalhista, Civil, Tributario, etc.
  valor_estimado        numeric(14,2),          -- estimativa de honorarios
  -- Estado/tracking
  data_entrada_etapa    timestamptz NOT NULL DEFAULT now(),
  observacoes           text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_instancia ON public.crm_contacts(instancia);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_funil     ON public.crm_contacts(funil_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_stage     ON public.crm_contacts(stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_phone     ON public.crm_contacts(phone) WHERE phone IS NOT NULL;

CREATE OR REPLACE FUNCTION public.crm_touch_updated() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_crm_contacts_updated ON public.crm_contacts;
CREATE TRIGGER trg_crm_contacts_updated BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated();

-- Quando stage_id muda, reseta data_entrada_etapa
CREATE OR REPLACE FUNCTION public.crm_reset_stage_entry() RETURNS trigger AS $$
BEGIN
  IF NEW.stage_id IS DISTINCT FROM OLD.stage_id THEN
    NEW.data_entrada_etapa := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_crm_contacts_stage_change ON public.crm_contacts;
CREATE TRIGGER trg_crm_contacts_stage_change BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.crm_reset_stage_entry();

-- ─── 4. crm_interactions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_interactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instancia   text NOT NULL,
  contact_id  uuid REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  phone       text,
  tipo        text NOT NULL CHECK (tipo IN ('nota', 'etapa', 'mensagem', 'agendamento', 'financeiro', 'tarefa', 'kanban', 'temperatura', 'responsavel', 'tag')),
  conteudo    text,
  autor_nome  text,
  autor_email text,
  metadata    jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_contact   ON public.crm_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_phone     ON public.crm_interactions(phone);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_instancia ON public.crm_interactions(instancia);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_created   ON public.crm_interactions(created_at DESC);

-- ─── 5. crm_lists ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_lists (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instancia  text NOT NULL,
  nome       text NOT NULL,
  filtros    jsonb NOT NULL DEFAULT '{}'::jsonb,
  cor        text DEFAULT '#2563EB',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_lists_instancia ON public.crm_lists(instancia);

-- ─── 6. Bridge com kanban_cards ────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kanban_cards') THEN
    ALTER TABLE public.kanban_cards
      ADD COLUMN IF NOT EXISTS crm_contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_kanban_cards_crm_contact ON public.kanban_cards(crm_contact_id) WHERE crm_contact_id IS NOT NULL;
  END IF;
END $$;

-- ─── 7. RLS (USING true — controle via aplicacao) ──────────────────────────
ALTER TABLE public.crm_funnels      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_stages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_lists        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_funnels_all      ON public.crm_funnels;
DROP POLICY IF EXISTS crm_stages_all       ON public.crm_stages;
DROP POLICY IF EXISTS crm_contacts_all     ON public.crm_contacts;
DROP POLICY IF EXISTS crm_interactions_all ON public.crm_interactions;
DROP POLICY IF EXISTS crm_lists_all        ON public.crm_lists;
CREATE POLICY crm_funnels_all      ON public.crm_funnels      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY crm_stages_all       ON public.crm_stages       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY crm_contacts_all     ON public.crm_contacts     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY crm_interactions_all ON public.crm_interactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY crm_lists_all        ON public.crm_lists        FOR ALL USING (true) WITH CHECK (true);

-- ─── 8. Trigger: avanca lead pra "Reuniao agendada" quando appointment cria ───
CREATE OR REPLACE FUNCTION public.crm_advance_on_appointment() RETURNS trigger AS $$
DECLARE
  v_phone   text;
  v_contact public.crm_contacts;
  v_target  public.crm_stages;
BEGIN
  v_phone := regexp_replace(COALESCE(NEW.contact_numero, ''), '\D', '', 'g');
  IF v_phone IS NULL OR v_phone = '' THEN RETURN NEW; END IF;

  -- Acha contato CRM pelo phone (so na mesma instancia)
  SELECT * INTO v_contact FROM public.crm_contacts
    WHERE instancia = NEW.instancia
      AND regexp_replace(COALESCE(phone, ''), '\D', '', 'g') = v_phone
    LIMIT 1;
  IF v_contact.id IS NULL THEN RETURN NEW; END IF;

  -- Acha etapa "agendou" / "reuniao agendada" (por nome) no funil do contato
  SELECT * INTO v_target FROM public.crm_stages
    WHERE funil_id = v_contact.funil_id
      AND (
        lower(nome) LIKE '%agendou%'
        OR lower(nome) LIKE '%reuni%agend%'
        OR lower(nome) LIKE '%reunião agendada%'
      )
    ORDER BY posicao ASC LIMIT 1;
  IF v_target.id IS NULL OR v_target.id = v_contact.stage_id THEN
    -- Mesmo sem avancar, registra a interacao
    INSERT INTO public.crm_interactions (instancia, contact_id, phone, tipo, conteudo, metadata)
    VALUES (NEW.instancia, v_contact.id, v_phone, 'agendamento',
            'Agendamento criado pra ' || to_char(NEW.starts_at, 'DD/MM/YYYY HH24:MI'),
            jsonb_build_object('appointment_id', NEW.id));
    RETURN NEW;
  END IF;

  -- Avanca
  UPDATE public.crm_contacts SET stage_id = v_target.id WHERE id = v_contact.id;
  INSERT INTO public.crm_interactions (instancia, contact_id, phone, tipo, conteudo, metadata)
  VALUES (NEW.instancia, v_contact.id, v_phone, 'agendamento',
          'Avancado automaticamente pra "' || v_target.nome || '" via novo agendamento',
          jsonb_build_object('appointment_id', NEW.id, 'auto_advance', true));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointments') THEN
    DROP TRIGGER IF EXISTS trg_crm_advance_on_appointment ON public.appointments;
    CREATE TRIGGER trg_crm_advance_on_appointment AFTER INSERT ON public.appointments
      FOR EACH ROW EXECUTE FUNCTION public.crm_advance_on_appointment();
  END IF;
END $$;

-- ─── 9. Helper: cria funil padrao com etapas pra advocacia ─────────────────
CREATE OR REPLACE FUNCTION public.crm_seed_default_funnel(p_instancia text)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_funil_id uuid;
BEGIN
  -- So cria se nao houver nenhum funil pra essa instancia
  IF EXISTS (SELECT 1 FROM public.crm_funnels WHERE instancia = p_instancia) THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.crm_funnels (instancia, nome, posicao)
    VALUES (p_instancia, 'Funil principal', 0)
    RETURNING id INTO v_funil_id;
  INSERT INTO public.crm_stages (instancia, funil_id, nome, cor, posicao, alerta_dias, is_won, is_lost) VALUES
    (p_instancia, v_funil_id, 'Novo Lead',         '#94A3B8', 0,  3, false, false),
    (p_instancia, v_funil_id, 'Primeiro Contato',  '#2563EB', 1,  5, false, false),
    (p_instancia, v_funil_id, 'Agendou',           '#7C3AED', 2,  7, false, false),
    (p_instancia, v_funil_id, 'Compareceu',        '#0891B2', 3, 14, false, false),
    (p_instancia, v_funil_id, 'Retorno',           '#D97706', 4, 30, true,  false);
  RETURN v_funil_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.crm_seed_default_funnel(text) TO anon, authenticated;
