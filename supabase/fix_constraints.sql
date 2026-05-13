-- ─────────────────────────────────────────────────────────────────────────────
-- NexlaADV — Constraints úteis pra prevenir bugs de duplicata
-- ─────────────────────────────────────────────────────────────────────────────

-- saved_contacts: evita duplicar contatos (mesmo numero + instancia)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'saved_contacts_numero_instancia_unique'
  ) THEN
    -- Remove duplicatas antes de criar o constraint
    DELETE FROM saved_contacts a
    USING saved_contacts b
    WHERE a.id > b.id
      AND a.numero = b.numero
      AND a.instancia = b.instancia;

    ALTER TABLE saved_contacts
      ADD CONSTRAINT saved_contacts_numero_instancia_unique
      UNIQUE (numero, instancia);
  END IF;
END $$;

-- attendances: evita duplicar atendimentos (mesmo numero + instancia)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'attendances_numero_instancia_unique'
  ) THEN
    DELETE FROM attendances a
    USING attendances b
    WHERE a.id > b.id
      AND a.numero = b.numero
      AND a.instancia = b.instancia;

    ALTER TABLE attendances
      ADD CONSTRAINT attendances_numero_instancia_unique
      UNIQUE (numero, instancia);
  END IF;
END $$;
