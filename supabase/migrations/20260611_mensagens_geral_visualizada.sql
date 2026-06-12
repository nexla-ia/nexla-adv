-- ────────────────────────────────────────────────────────────────────────────
-- Migration: campos de visualização em mensagens_geral
-- Motivo: registrar quando a mensagem do atendente foi lida pelo destinatário
-- (read receipt do WhatsApp). Permite exibir o "✓✓" azul no balão.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.mensagens_geral
  ADD COLUMN IF NOT EXISTS visualizada    boolean      DEFAULT false,
  ADD COLUMN IF NOT EXISTS visualizada_em timestamptz;

-- Index parcial pra busca rapida (poucas linhas onde true)
CREATE INDEX IF NOT EXISTS idx_mensagens_geral_visualizada
  ON public.mensagens_geral(visualizada)
  WHERE visualizada = true;
