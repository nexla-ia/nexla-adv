-- ─── Limite de 2 sessões simultâneas por conta ──────────────────────────────
-- Cada login ativo vira uma linha em user_sessions com um token único.
-- Ao logar, register_session mantém apenas as 2 sessões mais recentes (por
-- created_at) e apaga as mais antigas — o acesso logado há mais tempo cai.
-- Cada cliente chama session_heartbeat a cada ~15s; se o token não existir
-- mais, ele se desloga sozinho.

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token       uuid NOT NULL UNIQUE,
  device      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  last_seen   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);

-- Quantas sessões simultâneas são permitidas por conta
-- (mude aqui se um dia quiser 3, etc.)
-- Usado como LIMIT dentro de register_session.

-- ─── register_session ───────────────────────────────────────────────────────
-- Insere a nova sessão e mantém só as 2 mais recentes da conta.
CREATE OR REPLACE FUNCTION public.register_session(p_user_id uuid, p_token uuid, p_device text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
  insert into public.user_sessions (user_id, token, device, last_seen)
  values (p_user_id, p_token, p_device, now())
  on conflict (token) do update set last_seen = now();

  -- Mantém apenas as 2 sessões mais recentes; remove as mais antigas.
  delete from public.user_sessions
  where user_id = p_user_id
    and id not in (
      select id
      from public.user_sessions
      where user_id = p_user_id
      order by created_at desc
      limit 2
    );
end;
$function$;

-- ─── session_heartbeat ──────────────────────────────────────────────────────
-- Atualiza last_seen e retorna se a sessão ainda é válida (true) ou foi
-- revogada por outro login (false).
CREATE OR REPLACE FUNCTION public.session_heartbeat(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
declare v_exists boolean;
begin
  update public.user_sessions set last_seen = now() where token = p_token;
  select exists(select 1 from public.user_sessions where token = p_token) into v_exists;
  return v_exists;
end;
$function$;

-- ─── end_session ────────────────────────────────────────────────────────────
-- Logout explícito: remove a sessão.
CREATE OR REPLACE FUNCTION public.end_session(p_token uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
  delete from public.user_sessions where token = p_token;
end;
$function$;

GRANT EXECUTE ON FUNCTION public.register_session(uuid, uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.session_heartbeat(uuid)            TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.end_session(uuid)                  TO anon, authenticated;

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_sessions_all ON public.user_sessions;
CREATE POLICY user_sessions_all ON public.user_sessions
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
