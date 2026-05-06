-- ════════════════════════════════════════════════════════════════════════════
-- Pivô jurídico — parte 4: Casos
--
-- Um caso é uma demanda de um cliente em uma área específica, com sócio
-- responsável e ciclo de vida (lead → contrato → andamento → encerrado).
-- É o equivalente jurídico do "agendamento de pacote" do MedicinaMKT.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.cases (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instancia              text NOT NULL,
  client_id              uuid REFERENCES public.saved_contacts(id) ON DELETE SET NULL,
  practice_area_id       uuid REFERENCES public.practice_areas(id) ON DELETE SET NULL,
  lead_assigned_user_id  uuid REFERENCES public.users(id)          ON DELETE SET NULL,
  status                 text NOT NULL DEFAULT 'lead_frio'
    CHECK (status IN ('lead_frio','lead_quente','em_proposta','contrato_assinado','em_andamento','encerrado','perdido')),
  case_number            text,                          -- número CNJ (opcional)
  title                  text NOT NULL,
  description            text,
  fee_model_id           uuid REFERENCES public.fee_models(id) ON DELETE SET NULL,
  fee_value              numeric(10,2),                 -- valor combinado
  created_at             timestamptz NOT NULL DEFAULT now(),
  closed_at              timestamptz
);
CREATE INDEX IF NOT EXISTS idx_cases_instancia        ON public.cases(instancia);
CREATE INDEX IF NOT EXISTS idx_cases_client_id        ON public.cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_practice_area_id ON public.cases(practice_area_id);
CREATE INDEX IF NOT EXISTS idx_cases_status           ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_lead_user        ON public.cases(lead_assigned_user_id);
