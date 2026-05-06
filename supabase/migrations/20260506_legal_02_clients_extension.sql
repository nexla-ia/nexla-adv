-- ════════════════════════════════════════════════════════════════════════════
-- Pivô jurídico — parte 2: Extensão da ficha do cliente e do usuário
--
-- saved_contacts ganha 3 colunas jurídicas (PF/PJ, fonte do lead, área de
-- interesse principal). Colunas clínicas (allergies, medications etc.) NÃO
-- são removidas aqui — esperam o React parar de usá-las antes do drop_health.
--
-- users ganha o campo OAB (advogados; demais funções deixam null).
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.saved_contacts
  ADD COLUMN IF NOT EXISTS type                      text DEFAULT 'PF' CHECK (type IN ('PF','PJ')),
  ADD COLUMN IF NOT EXISTS source                    text,                         -- google/instagram/indicacao/outro
  ADD COLUMN IF NOT EXISTS primary_practice_area_id  uuid REFERENCES public.practice_areas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_saved_contacts_practice_area
  ON public.saved_contacts(primary_practice_area_id);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS oab_number text;
