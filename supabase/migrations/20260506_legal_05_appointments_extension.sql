-- ════════════════════════════════════════════════════════════════════════════
-- Pivô jurídico — parte 5: Extensão da agenda
--
-- appointments ganha quatro colunas pra modelar agenda jurídica:
--   - event_type     → primeira_consulta | reuniao | audiencia | prazo
--   - court          → vara/juízo (preenchido só em audiência)
--   - process_number → número do processo (preenchido só em audiência)
--   - case_id        → vínculo com o caso (cases.id)
--
-- Não é renomeada nenhuma coluna existente — `procedure_id` continua válido
-- até o React parar de usá-lo (vira "service_id" semanticamente).
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS event_type     text DEFAULT 'reuniao'
    CHECK (event_type IN ('primeira_consulta','reuniao','audiencia','prazo')),
  ADD COLUMN IF NOT EXISTS court          text,
  ADD COLUMN IF NOT EXISTS process_number text,
  ADD COLUMN IF NOT EXISTS case_id        uuid REFERENCES public.cases(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_case_id    ON public.appointments(case_id);
CREATE INDEX IF NOT EXISTS idx_appointments_event_type ON public.appointments(event_type);
