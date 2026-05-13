-- ─────────────────────────────────────────────────────────────────────────────
-- NexlaADV — Habilita RLS em todas as tabelas
--
-- O app usa um sistema de auth customizado (tabela `users` + RPC `login_user`)
-- e não autentica via auth.uid() do Supabase. Por isso as policies abaixo são
-- permissivas (USING true / WITH CHECK true) para anon + authenticated.
--
-- Isso silencia os warnings "RLS Disabled in Public" sem quebrar o app.
--
-- ⚠️ ATENÇÃO: Para segurança REAL multi-tenant você deve migrar para Supabase
-- Auth e criar policies baseadas em `instancia` ou `company_id` matched contra
-- auth.uid() / auth.jwt(). Este script é um patch de curto prazo.
-- ─────────────────────────────────────────────────────────────────────────────

-- Lista de tabelas
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'users',
    'companies',
    'agendas',
    'alerts',
    'appointments',
    'attendances',
    'conversations',
    'insurance_plans',
    'invoices',
    'kanban_cards',
    'kanban_columns',
    'mensagens_geral',
    'procedure_prices',
    'procedures',
    'professionals',
    'saved_contacts',
    'sector_members',
    'sectors',
    'support_messages',
    'support_tickets',
    -- Tabelas extras detectadas pelo Supabase
    'cases',
    'contacts',
    'practice_areas',
    'user_practice_areas',
    'fee_models',
    'forensic_calendar',
    'ai_guardrails_events',
    'n8n_chat_histories_adv_nexla'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- Só processa se a tabela existe
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      -- Habilita RLS
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);

      -- Remove policies antigas (se existirem)
      EXECUTE format('DROP POLICY IF EXISTS "nx_anon_all" ON public.%I;', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "nx_auth_all" ON public.%I;', tbl);

      -- Cria policies permissivas
      EXECUTE format(
        'CREATE POLICY "nx_anon_all" ON public.%I
         FOR ALL TO anon
         USING (true) WITH CHECK (true);', tbl);
      EXECUTE format(
        'CREATE POLICY "nx_auth_all" ON public.%I
         FOR ALL TO authenticated
         USING (true) WITH CHECK (true);', tbl);

      RAISE NOTICE 'RLS habilitado: %', tbl;
    ELSE
      RAISE NOTICE 'Tabela não existe (pulada): %', tbl;
    END IF;
  END LOOP;
END $$;

-- Verifica resultado
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
