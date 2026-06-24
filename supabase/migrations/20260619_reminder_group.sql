-- Coluna opcional pra enviar copia do lembrete pra um grupo do WhatsApp
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS reminder_group_id text;
