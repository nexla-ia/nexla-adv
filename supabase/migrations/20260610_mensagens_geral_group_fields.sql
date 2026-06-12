-- ────────────────────────────────────────────────────────────────────────────
-- Migration: adicionar campos de grupo em mensagens_geral
-- Motivo: o fluxo n8n captura idgrupo (remoteJid @g.us) e nomegrupo (subject)
-- quando a mensagem vem de um grupo de WhatsApp. Esses dados ajudam a
-- diferenciar grupos sem precisar parsear o campo `numero`.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.mensagens_geral
  ADD COLUMN IF NOT EXISTS idgrupo   text,
  ADD COLUMN IF NOT EXISTS nomegrupo text;

-- Index pra filtrar mensagens por grupo (lookup rapido na tela de Grupos)
CREATE INDEX IF NOT EXISTS idx_mensagens_geral_idgrupo
  ON public.mensagens_geral(idgrupo)
  WHERE idgrupo IS NOT NULL;
