-- ────────────────────────────────────────────────────────────────────────────
-- Migration: adicionar tracking de anúncio + foto de perfil em clientes
-- Motivo: o fluxo n8n captura origem do lead (Facebook/Instagram Ads, etc.)
-- e foto de perfil do WhatsApp. Esses dados precisam ser persistidos pra
-- atribuição de leads e exibição na interface.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS ad_source_type    text,        -- ex: "ad", "organic"
  ADD COLUMN IF NOT EXISTS ad_source_url     text,        -- URL de origem do anúncio
  ADD COLUMN IF NOT EXISTS ad_entry_point    text,        -- ponto de entrada (FB Messenger, WA Click-to-chat)
  ADD COLUMN IF NOT EXISTS ad_source         text,        -- plataforma (Facebook, Instagram)
  ADD COLUMN IF NOT EXISTS ad_title          text,        -- título do anúncio
  ADD COLUMN IF NOT EXISTS ad_body           text,        -- copy do anúncio
  ADD COLUMN IF NOT EXISTS ad_thumbnail_url  text,        -- preview do criativo
  ADD COLUMN IF NOT EXISTS ad_media_url      text,        -- mídia completa do criativo
  ADD COLUMN IF NOT EXISTS ad_click_id       text,        -- ctwa_clid (WhatsApp click)
  ADD COLUMN IF NOT EXISTS ad_captured_at    timestamptz, -- quando o lead clicou no anúncio
  ADD COLUMN IF NOT EXISTS foto              text;        -- URL ou base64 da foto de perfil

-- Index pra agrupar leads por origem (relatórios de atribuição)
CREATE INDEX IF NOT EXISTS idx_clientes_ad_source ON public.clientes(ad_source)
  WHERE ad_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clientes_ad_click_id ON public.clientes(ad_click_id)
  WHERE ad_click_id IS NOT NULL;
