-- Metadados de etiquetas (cor escolhida pelo admin) — sobrescreve a cor
-- baseada em hash que o front-end usa por padrao quando nao tem registro.
CREATE TABLE IF NOT EXISTS public.tags_meta (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instancia  text NOT NULL,
  name       text NOT NULL,
  color      text NOT NULL DEFAULT '#2563EB',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instancia, name)
);
CREATE INDEX IF NOT EXISTS idx_tags_meta_instancia ON public.tags_meta(instancia);

ALTER TABLE public.tags_meta ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tags_meta_all ON public.tags_meta;
CREATE POLICY tags_meta_all ON public.tags_meta FOR ALL USING (true) WITH CHECK (true);
