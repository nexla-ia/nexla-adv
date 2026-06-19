-- ════════════════════════════════════════════════════════════════════════════
-- MÓDULO FINANCEIRO — Schema v1
--
-- Tabelas:
--   financial_categories   — categorias por empresa (nome, tipo, cor)
--   financial_transactions — todos os lançamentos (receitas e despesas)
--
-- Convencao: categorias compartilhadas usam instancia = '_default_'.
-- Cada empresa pode adicionar suas próprias (instancia = sua instance).
-- A query no front filtra: instancia = X OR instancia = '_default_'.
-- ════════════════════════════════════════════════════════════════════════════

-- Limpa tabelas antigas se existirem (refatoracao)
DROP TABLE IF EXISTS public.fin_anexos          CASCADE;
DROP TABLE IF EXISTS public.fin_lancamentos     CASCADE;
DROP TABLE IF EXISTS public.fin_contatos        CASCADE;
DROP TABLE IF EXISTS public.fin_formas_pagamento CASCADE;
DROP TABLE IF EXISTS public.fin_contas_bancarias CASCADE;
DROP TABLE IF EXISTS public.fin_centros_custo   CASCADE;
DROP TABLE IF EXISTS public.fin_categorias      CASCADE;
DROP FUNCTION IF EXISTS public.fin_seed_defaults(text);
DROP FUNCTION IF EXISTS public.fin_lanc_touch_updated() CASCADE;

-- ─── 1. financial_categories ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.financial_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instancia  text NOT NULL,
  nome       text NOT NULL,
  tipo       text NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  cor        text,
  ativa      boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_finc_instancia ON public.financial_categories(instancia);
CREATE INDEX IF NOT EXISTS idx_finc_tipo      ON public.financial_categories(tipo);

-- ─── 2. financial_transactions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instancia           text NOT NULL,
  tipo                text NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  descricao           text NOT NULL,
  valor               numeric(14,2) NOT NULL,
  vencimento          date NOT NULL,
  pago_em             date,
  status              text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'pago', 'cancelado')),
  categoria_id        uuid REFERENCES public.financial_categories(id) ON DELETE SET NULL,
  contato_nome        text,                -- paciente/cliente livre (nao normalizado)
  centro_custo        text,                -- texto livre por enquanto
  processo_numero     text,                -- CNJ opcional
  -- v2: forma de pagamento + recorrencia
  forma_pagamento     text,                -- PIX, Dinheiro, Cartao Debito/Credito, Boleto, Convenio, Transferencia, Cheque
  recorrente          boolean NOT NULL DEFAULT false,
  recorrencia_tipo    text DEFAULT 'mensal',
  grupo_recorrencia   uuid,
  grupo_parcelas      uuid,
  parcela_num         integer,
  parcela_total       integer,
  observacoes         text,
  criado_por_email    text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fint_instancia       ON public.financial_transactions(instancia);
CREATE INDEX IF NOT EXISTS idx_fint_vencimento      ON public.financial_transactions(vencimento);
CREATE INDEX IF NOT EXISTS idx_fint_status          ON public.financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_fint_tipo            ON public.financial_transactions(tipo);
CREATE INDEX IF NOT EXISTS idx_fint_categoria       ON public.financial_transactions(categoria_id);
CREATE INDEX IF NOT EXISTS idx_fint_grupo_rec       ON public.financial_transactions(grupo_recorrencia)
  WHERE grupo_recorrencia IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fint_grupo_parc      ON public.financial_transactions(grupo_parcelas)
  WHERE grupo_parcelas IS NOT NULL;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.fint_touch_updated() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fint_updated ON public.financial_transactions;
CREATE TRIGGER trg_fint_updated
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.fint_touch_updated();

-- ─── 3. RLS (USING true — controle via aplicacao) ──────────────────────────
ALTER TABLE public.financial_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS finc_all ON public.financial_categories;
DROP POLICY IF EXISTS fint_all ON public.financial_transactions;
CREATE POLICY finc_all ON public.financial_categories   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY fint_all ON public.financial_transactions FOR ALL USING (true) WITH CHECK (true);

-- ─── 4. Categorias padrao em '_default_' (compartilhadas) ──────────────────
-- 13 categorias: 5 receitas + 8 despesas com visao escritorio juridico
INSERT INTO public.financial_categories (instancia, nome, tipo, cor) VALUES
  ('_default_', 'Honorários contratuais',  'receita', '#15803D'),
  ('_default_', 'Honorários de êxito',     'receita', '#16A34A'),
  ('_default_', 'Sucumbência',             'receita', '#22C55E'),
  ('_default_', 'Consultoria',             'receita', '#84CC16'),
  ('_default_', 'Outras receitas',         'receita', '#A3E635'),
  ('_default_', 'Aluguel',                 'despesa', '#B91C1C'),
  ('_default_', 'Salários e encargos',     'despesa', '#DC2626'),
  ('_default_', 'Pró-labore',              'despesa', '#F87171'),
  ('_default_', 'Custas processuais',      'despesa', '#EA580C'),
  ('_default_', 'Software e assinaturas',  'despesa', '#D97706'),
  ('_default_', 'OAB / Anuidades',         'despesa', '#92400E'),
  ('_default_', 'Marketing',               'despesa', '#9D174D'),
  ('_default_', 'Outras despesas',         'despesa', '#6B7280')
ON CONFLICT DO NOTHING;

-- ─── 5. Flag de modulo no companies (controle global do ADM) ───────────────
-- companies.modules jsonb: { financeiro: true/false, ... }
-- Default true se nao especificado.
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS modules jsonb NOT NULL DEFAULT '{}'::jsonb;
