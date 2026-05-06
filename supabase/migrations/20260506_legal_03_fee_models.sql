-- ════════════════════════════════════════════════════════════════════════════
-- Pivô jurídico — parte 3: Modelos de honorário
--
-- fee_models substitui o conceito de "convênio" do MedicinaMKT.
-- Tipos: avulso, fixo_mensal (consultivo), exito (% sobre valor da causa),
-- partido (cobrança fracionada).
--
-- procedures (que vai ser tratada como "serviços jurídicos" no UI) ganha:
--   - practice_area_id     → vincula serviço a uma área de atuação
--   - default_fee_model_id → modelo de cobrança padrão pra esse serviço
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.fee_models (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instancia        text NOT NULL,
  kind             text NOT NULL CHECK (kind IN ('avulso','fixo_mensal','exito','partido')),
  name             text NOT NULL,                   -- ex: "Êxito 20% — cível"
  description      text,
  default_value    numeric(10,2),                   -- valor base (R$) — opcional
  default_percent  numeric(5,2),                    -- % (pra exito) — opcional
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fee_models_instancia ON public.fee_models(instancia);

ALTER TABLE public.procedures
  ADD COLUMN IF NOT EXISTS practice_area_id      uuid REFERENCES public.practice_areas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS default_fee_model_id  uuid REFERENCES public.fee_models(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_procedures_practice_area ON public.procedures(practice_area_id);
