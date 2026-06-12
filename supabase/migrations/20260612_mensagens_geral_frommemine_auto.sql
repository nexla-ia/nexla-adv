-- ────────────────────────────────────────────────────────────────────────────
-- Migration: auto-marca fromMe / "minha?" = true quando type = 'atendente'
-- Motivo: simplifica o front (sem UPDATE pos-INSERT). Qualquer linha inserida
-- com type = 'atendente' (mensagem enviada pelo painel) ja entra como
-- fromMe = true.
-- ────────────────────────────────────────────────────────────────────────────

-- Garante que a coluna fromMe existe (idempotente)
ALTER TABLE public.mensagens_geral
  ADD COLUMN IF NOT EXISTS "fromMe" boolean DEFAULT false;

-- Trigger BEFORE INSERT que ajusta fromMe/minha? automaticamente
CREATE OR REPLACE FUNCTION public.set_mensagens_geral_frommemine()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF lower(coalesce(NEW.type, '')) IN ('atendente', 'humano') THEN
    NEW."fromMe" := true;
    -- Tambem seta minha? se a coluna existir
    BEGIN
      NEW."minha?" := true;
    EXCEPTION WHEN undefined_column THEN
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mensagens_geral_set_frommemine ON public.mensagens_geral;
CREATE TRIGGER trg_mensagens_geral_set_frommemine
  BEFORE INSERT ON public.mensagens_geral
  FOR EACH ROW
  EXECUTE FUNCTION public.set_mensagens_geral_frommemine();
