-- ════════════════════════════════════════════════════════════════════════════
-- Lembretes automáticos de agendamentos via pg_cron + pg_net
--
-- Fluxo:
--   pg_cron (*/5 min)
--     → process_appointment_reminders()
--       → INSERT mensagens_geral (log no painel)
--       → UPDATE appointments.reminder_sent_at (idempotência)
--       → net.http_post → n8n → Evolution API → WhatsApp do cliente
--
-- Config por empresa (companies):
--   reminder_enabled           → liga/desliga
--   reminder_offset_minutes    → antecedência (30, 60, 120, 1440, 2880, 10080)
--   timezone                   → fuso horário para formatar data/hora na mensagem
--
-- Config por agendamento (appointments):
--   reminder_sent_at           → timestamp do envio; NULL = ainda não enviado
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Colunas em companies ──────────────────────────────────────────────
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS reminder_enabled         boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_offset_minutes  integer     NOT NULL DEFAULT 1440,
  ADD COLUMN IF NOT EXISTS timezone                 text        NOT NULL DEFAULT 'America/Sao_Paulo';

-- ─── 2. Coluna em appointments ────────────────────────────────────────────
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_at  timestamptz;

CREATE INDEX IF NOT EXISTS idx_appointments_reminder
  ON public.appointments(instancia, reminder_sent_at, starts_at)
  WHERE reminder_sent_at IS NULL;

-- ─── 3. Função principal ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.process_appointment_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r          RECORD;
  msg_text   text;
  date_str   text;
  time_str   text;
  session_id text;
  tz         text;
BEGIN
  FOR r IN
    SELECT
      a.id,
      a.contact_nome,
      a.contact_numero,
      a.starts_at,
      a.instancia,
      c.api_instancia,
      c.reminder_offset_minutes,
      COALESCE(c.timezone, 'America/Sao_Paulo') AS tz
    FROM public.appointments a
    JOIN public.companies c ON c.instance = a.instancia
    WHERE c.reminder_enabled = true
      AND a.reminder_sent_at IS NULL
      AND a.status IN ('agendado', 'confirmado')
      AND a.contact_numero IS NOT NULL
      AND a.starts_at > NOW()
      AND a.starts_at - (c.reminder_offset_minutes || ' minutes')::interval <= NOW()
    FOR UPDATE OF a SKIP LOCKED
  LOOP
    tz := r.tz;

    -- Formata data/hora no fuso da empresa
    date_str := to_char(r.starts_at AT TIME ZONE tz, 'DD/MM/YYYY');
    time_str := to_char(r.starts_at AT TIME ZONE tz, 'HH24:MI');

    msg_text := format(
      E'Olá%s! 📅 Lembrando do seu compromisso marcado para *%s* às *%s*.\nQualquer dúvida, é só chamar. Até lá!',
      CASE WHEN r.contact_nome IS NOT NULL AND trim(r.contact_nome) != ''
           THEN ', ' || split_part(trim(r.contact_nome), ' ', 1)
           ELSE '' END,
      date_str,
      time_str
    );

    session_id := regexp_replace(r.contact_numero, '\D', '', 'g') || '@s.whatsapp.net';

    -- Marca ANTES do webhook para garantir idempotência mesmo se pg_net falhar
    UPDATE public.appointments
    SET reminder_sent_at = NOW()
    WHERE id = r.id;

    -- Log no painel de Conversas
    INSERT INTO public.mensagens_geral (instancia, numero, mensagem, type, horaLastMessage)
    VALUES (r.instancia, session_id, 'IA: ' || msg_text, 'bot', NOW()::text);

    -- Dispara webhook via pg_net (async, não bloqueia a função)
    PERFORM net.http_post(
      url     := 'https://n8n.nexladesenvolvimento.com.br/webhook/envioNexla',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body    := jsonb_build_object(
        'message',      msg_text,
        'session_id',   session_id,
        'phone',        regexp_replace(r.contact_numero, '\D', '', 'g'),
        'instancia',    r.instancia,
        'api_instancia', r.api_instancia,
        'ai_enabled',   false,
        'is_reminder',  true
      )
    );

  END LOOP;
END;
$$;

-- ─── 4. pg_cron: agenda a cada 5 minutos ─────────────────────────────────
-- REQUISITO: habilitar extensão pg_cron em
--   Supabase Dashboard → Database → Extensions → pg_cron → Enable
--
-- Este bloco é seguro: não falha se pg_cron não estiver instalado.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Remove job anterior se existir
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'appointment-reminders';

    PERFORM cron.schedule(
      'appointment-reminders',
      '*/5 * * * *',
      'SELECT public.process_appointment_reminders()'
    );

    RAISE NOTICE 'pg_cron: job appointment-reminders agendado com sucesso.';
  ELSE
    RAISE NOTICE 'pg_cron NÃO instalado — ative em Dashboard → Database → Extensions → pg_cron e re-execute este bloco.';
  END IF;
END $$;
