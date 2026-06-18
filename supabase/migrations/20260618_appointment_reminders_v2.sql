-- ────────────────────────────────────────────────────────────────────────────
-- Migration: lembretes mais flexíveis no appointments
--  - reminder_message: texto custom por evento (sobrescreve o padrao da agenda)
--  - reminder_recipients: jsonb [{ type: 'contact'|'group', id, name }]
--    permite mandar pra varios destinos (médico + secretaria + grupo)
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_message    text,
  ADD COLUMN IF NOT EXISTS reminder_recipients jsonb DEFAULT '[]'::jsonb;
