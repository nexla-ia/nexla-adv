-- ────────────────────────────────────────────────────────────────────────────
-- Migration: integração Kanban ↔ Conversas
-- Permite vincular um card do Kanban a uma conversa do WhatsApp.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.kanban_cards
  ADD COLUMN IF NOT EXISTS contact_session_id text,  -- ex: "5511...@s.whatsapp.net" ou "120363...@g.us"
  ADD COLUMN IF NOT EXISTS contact_phone      text,  -- snapshot p/ exibicao sem lookup
  ADD COLUMN IF NOT EXISTS contact_name       text;  -- snapshot do nome no momento

-- Index pra buscar cards por contato (ex: mostrar "ja esta no kanban" no chat)
CREATE INDEX IF NOT EXISTS idx_kanban_cards_contact
  ON public.kanban_cards(contact_session_id)
  WHERE contact_session_id IS NOT NULL;
