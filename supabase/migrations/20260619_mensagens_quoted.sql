-- ────────────────────────────────────────────────────────────────────────────
-- Resposta citada (reply quote) em mensagens_geral
--   quoted_id_mensagem: id_mensagem da msg original (WhatsApp id),
--   usado no front pra renderizar o bloco "respondendo a..." sobre a bolha.
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.mensagens_geral
  ADD COLUMN IF NOT EXISTS quoted_id_mensagem text;

CREATE INDEX IF NOT EXISTS idx_mensagens_quoted_id ON public.mensagens_geral(quoted_id_mensagem)
  WHERE quoted_id_mensagem IS NOT NULL;
