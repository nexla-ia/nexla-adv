-- ════════════════════════════════════════════════════════════════════════════
-- META ADS CLICK-TO-WHATSAPP (CTWA) — rastreamento de campanhas
--
-- Quando um lead clica em anuncio Meta Ads e manda primeira msg, a Evolution
-- inclui contextInfo.externalAdReply no payload. O n8n captura na primeira
-- mensagem e popula essas colunas em clientes e saved_contacts.
--
-- O front-end ja le esses campos pra agrupar leads por campanha no /metricas.
-- ════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['clientes', 'saved_contacts']
  LOOP
    -- So adiciona se a tabela existe nesta instalacao
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS ad_platform       text', tbl);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS ad_source_type    text', tbl);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS ad_entry_point    text', tbl);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS ad_title          text', tbl);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS ad_body           text', tbl);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS ad_thumbnail_url  text', tbl);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS ad_media_url      text', tbl);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS ad_source_url     text', tbl);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS ad_click_id       text', tbl);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS ad_captured_at    timestamptz', tbl);

      -- Index pra agrupamento rapido por campanha
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_ad_title    ON public.%I(ad_title)    WHERE ad_title    IS NOT NULL', tbl, tbl);
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_ad_platform ON public.%I(ad_platform) WHERE ad_platform IS NOT NULL', tbl, tbl);
    END IF;
  END LOOP;
END $$;
