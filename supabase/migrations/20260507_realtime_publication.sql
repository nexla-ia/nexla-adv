-- ════════════════════════════════════════════════════════════════════════════
-- Habilita Supabase Realtime nas tabelas que o React assina via
-- supabase.channel(...).on('postgres_changes', ...).
--
-- Sem isso, INSERTs/UPDATEs/DELETEs no banco acontecem normalmente,
-- mas o frontend NÃO recebe o push em tempo real — então:
--   - mensagem nova chega mas ticket "Expirado" não reabre na UI
--   - alerta criado não aparece automaticamente
--   - kanban movido em outra aba não atualiza
--   - etc.
--
-- Cada ADD TABLE é envolto em DO/EXCEPTION pra ser idempotente
-- (ALTER PUBLICATION ADD TABLE falha se a tabela já está adicionada).
-- ════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  t text;
  target_tables text[] := ARRAY[
    'mensagens_geral',
    'conversations',
    'attendances',
    'alerts',
    'appointments',
    'saved_contacts',
    'kanban_columns',
    'kanban_cards'
  ];
BEGIN
  FOREACH t IN ARRAY target_tables LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      RAISE NOTICE 'realtime: added %', t;
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'realtime: % já estava na publicação', t;
    END;
  END LOOP;
END $$;
