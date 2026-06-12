-- ────────────────────────────────────────────────────────────────────────────
-- Migration: adicionar campo "minha?" em mensagens_geral
-- Motivo: indica se a mensagem foi enviada pelo proprio atendente (em grupos
-- de WhatsApp principalmente). Permite identificar mensagens proprias sem
-- depender de match de nome.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.mensagens_geral
  ADD COLUMN IF NOT EXISTS "minha?" boolean DEFAULT false;

-- Index parcial pra busca rapida de mensagens proprias (poucas linhas)
CREATE INDEX IF NOT EXISTS idx_mensagens_geral_minha
  ON public.mensagens_geral("minha?")
  WHERE "minha?" = true;
