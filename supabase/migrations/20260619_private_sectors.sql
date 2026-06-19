-- ────────────────────────────────────────────────────────────────────────────
-- Setor privado: conversas atribuidas a um setor privado so aparecem
-- pra membros do setor (+ admin/gestor). Outros usuarios nao veem na Recepcao.
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.sectors
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;
