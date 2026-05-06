-- ════════════════════════════════════════════════════════════════════════════
-- Functions baseline — Functions/triggers do banco antigo MedicinaMKT que o
-- código React/n8n usa mas que não estavam em arquivos de migration do repo.
--
-- Functions que JÁ ESTÃO em outras migrations (não duplicadas aqui):
--   - delete_user             → 20260429_delete_user_rpc.sql
--   - mark_company_paid       → 20260429_billing.sql
--   - support_bump_ticket     → 20260430_support.sql (+ trigger)
--   - api_* (25 functions)    → 20260430_api_rpc.sql
--
-- Functions DESCARTADAS (órfãs/quebradas no banco antigo):
--   - insert_alert(p_instance,p_type,p_contact_name,p_phone,p_message)
--     → referencia colunas inexistentes em `alerts` (company_id, type,
--       contact_name, phone, message). Provavelmente erro antigo nunca corrigido.
--   - n8n_clear_mensagens
--     → trunca a tabela `public.mensagens` que excluímos da baseline (lixo).
-- ════════════════════════════════════════════════════════════════════════════

-- pgcrypto: crypt() / gen_salt() (auth bcrypt)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── reopen_session_on_new_message  (trigger function) ─────────────────────
-- Vem antes de ensure_table_setup porque é referenciada por ela.
-- Quando uma nova mensagem chega (em mensagens_geral ou em qualquer tabela
-- n8n_chat_histories_*), apaga a linha de "fechamento" da conversation
-- para reabrir a sessão.
CREATE OR REPLACE FUNCTION public.reopen_session_on_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
declare v_session_id text;
begin
  IF TG_TABLE_NAME = 'mensagens_geral' THEN
    v_session_id := NEW.numero;
  ELSE
    v_session_id := NEW.session_id;
  END IF;
  if v_session_id is not null then
    delete from public.conversations where session_id = v_session_id;
  end if;
  return NEW;
end;
$function$;

-- ─── login_user ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.login_user(p_email text, p_password text)
RETURNS TABLE(id uuid, name text, email text, role text, active boolean, company_id uuid)
LANGUAGE sql
SECURITY DEFINER
AS $function$
  select id, name, email, role, active, company_id
  from public.users
  where email = p_email
    and password_hash = crypt(p_password, password_hash)
    and active = true;
$function$;

-- ─── create_user ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_user(p_name text, p_email text, p_password text, p_role text, p_company_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
declare new_id uuid;
begin
  insert into public.users (name, email, password_hash, role, company_id)
  values (p_name, p_email, crypt(p_password, gen_salt('bf')), p_role, p_company_id)
  returning id into new_id;
  return new_id;
end;
$function$;

-- ─── update_user_password ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_user_password(p_user_id uuid, p_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
  update public.users
  set password_hash = crypt(p_password, gen_salt('bf'))
  where id = p_user_id;
end;
$function$;

-- ─── send_mensagem_geral ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.send_mensagem_geral(p_instancia text, p_numero text, p_mensagem text, p_type text, p_hora text, p_base64 text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.mensagens_geral
    (instancia, numero, mensagem, type, "horaLastMessage", base64, created_at)
  VALUES
    (p_instancia, p_numero, p_mensagem, p_type, p_hora, p_base64, now());
END;
$function$;

-- ─── insert_alert (versão funcional) ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.insert_alert(instancia text, mensagem text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
declare new_id uuid;
begin
  insert into public.alerts (instancia, mensagem)
  values (instancia, mensagem)
  returning id into new_id;
  return new_id;
end;
$function$;

-- ─── ensure_table_setup ────────────────────────────────────────────────────
-- Configura uma tabela n8n_chat_histories_* dinamicamente: ativa RLS,
-- cria policy de leitura, registra na publicação Realtime e instala
-- trigger reopen_session_on_new_message.
CREATE OR REPLACE FUNCTION public.ensure_table_setup(p_table text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
  -- Habilita RLS
  execute format('alter table public.%I enable row level security', p_table);

  -- Cria política de leitura (idempotente)
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = p_table and policyname = 'allow_read'
  ) then
    execute format(
      'create policy allow_read on public.%I for select using (true)', p_table
    );
  end if;

  -- Adiciona à publicação Realtime (ignora erro se já existir)
  begin
    execute format('alter publication supabase_realtime add table public.%I', p_table);
  exception when others then null;
  end;

  -- Cria trigger para reabrir sessão quando chegar nova mensagem
  if not exists (
    select 1 from pg_trigger
    where tgname = 'trg_reopen_session'
    and tgrelid = (quote_ident(p_table))::regclass
  ) then
    execute format(
      'create trigger trg_reopen_session after insert on public.%I
       for each row execute function reopen_session_on_new_message()', p_table
    );
  end if;
end;
$function$;

-- ─── auto_close_inactive_conversations  (job batch) ────────────────────────
-- Para cada empresa ativa com history_table configurada, fecha sessões
-- (insere linha em conversations) que ficaram >1h sem nova mensagem.
-- Provavelmente chamada por cron job ou n8n agendado.
CREATE OR REPLACE FUNCTION public.auto_close_inactive_conversations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
declare
  comp record;
  sess record;
  last_msg timestamptz;
begin
  for comp in
    select instance, history_table
    from public.companies
    where history_table is not null and active = true
  loop
    for sess in execute format(
      'select distinct session_id from public.%I
       where session_id not in (
         select session_id from public.conversations where instancia = $1
       )',
      comp.history_table
    ) using comp.instance
    loop
      execute format(
        'select max(data) from public.%I where session_id = $1',
        comp.history_table
      ) into last_msg using sess.session_id;

      if last_msg is not null and last_msg < now() - interval '1 hour' then
        insert into public.conversations (session_id, instancia, reason, closed_at)
        values (sess.session_id, comp.instance, 'encerrado_auto', now())
        on conflict do nothing;
      end if;
    end loop;
  end loop;
end;
$function$;

-- ─── grants ───────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.login_user(text, text)                                  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_user(text, text, text, text, uuid)               TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_password(uuid, text)                        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_mensagem_geral(text, text, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.insert_alert(text, text)                                TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_table_setup(text)                                TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_close_inactive_conversations()                     TO anon, authenticated;

-- Trigger global: instala reopen_session_on_new_message em mensagens_geral.
-- Para tabelas n8n_chat_histories_* o trigger é instalado dinamicamente via
-- ensure_table_setup quando a empresa é cadastrada.
DROP TRIGGER IF EXISTS trg_reopen_session_mensagens_geral ON public.mensagens_geral;
CREATE TRIGGER trg_reopen_session_mensagens_geral
  AFTER INSERT ON public.mensagens_geral
  FOR EACH ROW EXECUTE FUNCTION public.reopen_session_on_new_message();
