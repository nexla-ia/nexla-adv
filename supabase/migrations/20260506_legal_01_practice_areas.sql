-- ════════════════════════════════════════════════════════════════════════════
-- Pivô jurídico — parte 1: Áreas de atuação
--
-- Cria as tabelas practice_areas + user_practice_areas (N:N entre advogados
-- e áreas) e popula com as 8 áreas generalistas + "outros".
-- Aditiva: não toca em nenhuma tabela existente.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.practice_areas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  color       text,
  ord         integer NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_practice_areas (
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  practice_area_id  uuid NOT NULL REFERENCES public.practice_areas(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, practice_area_id)
);
CREATE INDEX IF NOT EXISTS idx_user_practice_areas_practice_area
  ON public.user_practice_areas(practice_area_id);

-- Seed das áreas (idempotente via slug)
INSERT INTO public.practice_areas (slug, name, color, ord) VALUES
  ('civel',          'Cível',          '#3b82f6', 10),
  ('trabalhista',    'Trabalhista',    '#f59e0b', 20),
  ('criminal',       'Criminal',       '#ef4444', 30),
  ('familia',        'Família',        '#a855f7', 40),
  ('empresarial',    'Empresarial',    '#0ea5e9', 50),
  ('tributario',     'Tributário',     '#10b981', 60),
  ('previdenciario', 'Previdenciário', '#14b8a6', 70),
  ('consumidor',     'Consumidor',     '#8b5cf6', 80),
  ('outros',         'Outros',         '#6b7280', 99)
ON CONFLICT (slug) DO NOTHING;
