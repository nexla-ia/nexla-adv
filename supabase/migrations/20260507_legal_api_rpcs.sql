-- ════════════════════════════════════════════════════════════════════════════
-- API RPCs — versão jurídica (NexlaAdv)
--
-- Substitui as funções saúde da migration 20260430_api_rpc.sql:
--   - api_paciente_*   →  api_cliente_*           (renomeia + remove campos clínicos)
--   - api_insurance_plans_list  →  removida
--   - api_procedure_price       →  api_servico_honorario  (usa fee_models)
--   - api_procedures_list       →  api_servicos_list      (com practice_area_id)
--   - api_professionals_list    →  api_advogados_list     (com practice_area_id + OAB)
--
-- Endpoints novos do pivô jurídico:
--   - api_practice_areas_list
--   - api_fee_models_list
--   - api_cases_list / api_case_create / api_case_update_status / api_cases_by_client
--   - api_forensic_check
--
-- Endpoints estendidos:
--   - api_appointment_create  → suporta event_type, court, process_number, case_id
--   - api_paciente_by_phone   → mantida como alias compat para api_cliente_by_phone
--
-- Todas as funções são SECURITY DEFINER (bypassam RLS) e ficam acessíveis
-- para anon, authenticated. Search path travado em public.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── DROPS DAS FUNÇÕES SAÚDE ANTIGAS ────────────────────────────────────────
DROP FUNCTION IF EXISTS public.api_pacientes_list(text, text, int, int);
DROP FUNCTION IF EXISTS public.api_paciente_by_phone(text, text);
DROP FUNCTION IF EXISTS public.api_paciente_create(jsonb);
DROP FUNCTION IF EXISTS public.api_paciente_update(uuid, jsonb);
DROP FUNCTION IF EXISTS public.api_paciente_delete(uuid);
DROP FUNCTION IF EXISTS public.api_insurance_plans_list(text, boolean);
DROP FUNCTION IF EXISTS public.api_procedure_price(uuid, uuid);
DROP FUNCTION IF EXISTS public.api_procedures_list(text, boolean);
DROP FUNCTION IF EXISTS public.api_professionals_list(text, boolean);

-- ════════════════════════════════════════════════════════════════════════════
-- CLIENTES (saved_contacts é a tabela; clientes é o termo no jurídico)
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.api_clientes_list(
  p_instancia text,
  p_search    text DEFAULT NULL,
  p_area      uuid DEFAULT NULL,    -- filtra por practice_area_id
  p_type      text DEFAULT NULL,    -- 'PF' | 'PJ'
  p_limit     int  DEFAULT 100,
  p_offset    int  DEFAULT 0
)
RETURNS SETOF saved_contacts
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM saved_contacts
   WHERE instancia = p_instancia
     AND (p_search IS NULL
          OR nome   ILIKE '%' || p_search || '%'
          OR numero ILIKE '%' || p_search || '%'
          OR cpf    ILIKE '%' || p_search || '%'
          OR email  ILIKE '%' || p_search || '%')
     AND (p_area IS NULL OR primary_practice_area_id = p_area)
     AND (p_type IS NULL OR type = p_type)
   ORDER BY nome ASC
   LIMIT p_limit OFFSET p_offset;
$$;

CREATE OR REPLACE FUNCTION public.api_cliente_by_phone(
  p_instancia text,
  p_numero    text
)
RETURNS SETOF saved_contacts
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM saved_contacts
   WHERE instancia = p_instancia AND numero = p_numero
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.api_cliente_create(p_data jsonb)
RETURNS saved_contacts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row saved_contacts;
BEGIN
  INSERT INTO saved_contacts (
    instancia, nome, numero, type, source, primary_practice_area_id,
    birth_date, email, phone_secondary, address, cpf, rg,
    profession, nome_social, marital_status, photo, notes,
    emergency_contact, emergency_phone, referral_source, created_by_email
  ) VALUES (
    p_data->>'instancia',
    p_data->>'nome',
    p_data->>'numero',
    COALESCE(p_data->>'type', 'PF'),
    p_data->>'source',
    NULLIF(p_data->>'primary_practice_area_id', '')::uuid,
    NULLIF(p_data->>'birth_date', '')::date,
    p_data->>'email',
    p_data->>'phone_secondary',
    p_data->>'address',
    p_data->>'cpf',
    p_data->>'rg',
    p_data->>'profession',
    p_data->>'nome_social',
    p_data->>'marital_status',
    p_data->>'photo',
    p_data->>'notes',
    p_data->>'emergency_contact',
    p_data->>'emergency_phone',
    p_data->>'referral_source',
    p_data->>'created_by_email'
  )
  RETURNING * INTO v_row;
  RETURN v_row;
END $$;

CREATE OR REPLACE FUNCTION public.api_cliente_update(
  p_id   uuid,
  p_data jsonb
)
RETURNS saved_contacts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row saved_contacts;
BEGIN
  UPDATE saved_contacts SET
    nome                       = COALESCE(p_data->>'nome', nome),
    type                       = COALESCE(p_data->>'type', type),
    source                     = COALESCE(p_data->>'source', source),
    primary_practice_area_id   = COALESCE(NULLIF(p_data->>'primary_practice_area_id','')::uuid, primary_practice_area_id),
    birth_date                 = COALESCE(NULLIF(p_data->>'birth_date','')::date, birth_date),
    email                      = COALESCE(p_data->>'email', email),
    phone_secondary            = COALESCE(p_data->>'phone_secondary', phone_secondary),
    address                    = COALESCE(p_data->>'address', address),
    cpf                        = COALESCE(p_data->>'cpf', cpf),
    rg                         = COALESCE(p_data->>'rg', rg),
    profession                 = COALESCE(p_data->>'profession', profession),
    nome_social                = COALESCE(p_data->>'nome_social', nome_social),
    marital_status             = COALESCE(p_data->>'marital_status', marital_status),
    photo                      = COALESCE(p_data->>'photo', photo),
    notes                      = COALESCE(p_data->>'notes', notes),
    emergency_contact          = COALESCE(p_data->>'emergency_contact', emergency_contact),
    emergency_phone            = COALESCE(p_data->>'emergency_phone', emergency_phone),
    referral_source            = COALESCE(p_data->>'referral_source', referral_source),
    updated_at                 = now()
  WHERE id = p_id
  RETURNING * INTO v_row;
  RETURN v_row;
END $$;

CREATE OR REPLACE FUNCTION public.api_cliente_delete(p_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM saved_contacts WHERE id = p_id;
  SELECT TRUE;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- ÁREAS DE ATUAÇÃO
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.api_practice_areas_list(
  p_only_active boolean DEFAULT true
)
RETURNS SETOF practice_areas
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM practice_areas
   WHERE (NOT p_only_active OR active = true)
   ORDER BY ord ASC, name ASC;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- ADVOGADOS (professionals — mantida; alias jurídico)
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.api_advogados_list(
  p_instancia       text,
  p_only_active     boolean DEFAULT true,
  p_practice_area   uuid    DEFAULT NULL
)
RETURNS SETOF professionals
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT p.* FROM professionals p
   WHERE p.instancia = p_instancia
     AND (NOT p_only_active OR p.active = true)
     AND (p_practice_area IS NULL OR EXISTS (
          SELECT 1 FROM user_practice_areas upa
           WHERE upa.user_id = p.id
             AND upa.practice_area_id = p_practice_area
         ))
   ORDER BY p.name ASC;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- SERVIÇOS JURÍDICOS (procedures + practice_area_id + default_fee_model_id)
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.api_servicos_list(
  p_instancia       text,
  p_only_active     boolean DEFAULT true,
  p_practice_area   uuid    DEFAULT NULL
)
RETURNS SETOF procedures
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM procedures
   WHERE instancia = p_instancia
     AND (NOT p_only_active OR active = true)
     AND (p_practice_area IS NULL OR practice_area_id = p_practice_area)
   ORDER BY name ASC;
$$;

-- Calcula honorário base de um serviço (com fee_model opcional)
CREATE OR REPLACE FUNCTION public.api_servico_honorario(
  p_servico_id    uuid,
  p_fee_model_id  uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'servico_id', p_servico_id,
    'servico_nome', s.name,
    'price_particular', s.price_particular,
    'fee_model_id', COALESCE(p_fee_model_id, s.default_fee_model_id),
    'fee_model_kind', f.kind,
    'fee_model_default_value', f.default_value,
    'fee_model_default_percent', f.default_percent,
    'valor_sugerido', COALESCE(f.default_value, s.price_particular)
  )
  FROM procedures s
  LEFT JOIN fee_models f
    ON f.id = COALESCE(p_fee_model_id, s.default_fee_model_id)
  WHERE s.id = p_servico_id;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- MODELOS DE HONORÁRIO
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.api_fee_models_list(
  p_instancia    text,
  p_only_active  boolean DEFAULT true,
  p_kind         text    DEFAULT NULL  -- 'avulso'|'fixo_mensal'|'exito'|'partido'
)
RETURNS SETOF fee_models
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM fee_models
   WHERE instancia = p_instancia
     AND (NOT p_only_active OR active = true)
     AND (p_kind IS NULL OR kind = p_kind)
   ORDER BY kind ASC, name ASC;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- CASOS (cases)
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.api_cases_list(
  p_instancia       text,
  p_status          text DEFAULT NULL,
  p_practice_area   uuid DEFAULT NULL,
  p_lead_user_id    uuid DEFAULT NULL,
  p_limit           int  DEFAULT 100,
  p_offset          int  DEFAULT 0
)
RETURNS SETOF cases
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM cases
   WHERE instancia = p_instancia
     AND (p_status IS NULL OR status = p_status)
     AND (p_practice_area IS NULL OR practice_area_id = p_practice_area)
     AND (p_lead_user_id IS NULL OR lead_assigned_user_id = p_lead_user_id)
   ORDER BY created_at DESC
   LIMIT p_limit OFFSET p_offset;
$$;

CREATE OR REPLACE FUNCTION public.api_cases_by_client(
  p_client_id uuid
)
RETURNS SETOF cases
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM cases
   WHERE client_id = p_client_id
   ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.api_case_create(p_data jsonb)
RETURNS cases
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row cases;
BEGIN
  INSERT INTO cases (
    instancia, client_id, practice_area_id, lead_assigned_user_id,
    status, case_number, title, description, fee_model_id, fee_value
  ) VALUES (
    p_data->>'instancia',
    NULLIF(p_data->>'client_id','')::uuid,
    NULLIF(p_data->>'practice_area_id','')::uuid,
    NULLIF(p_data->>'lead_assigned_user_id','')::uuid,
    COALESCE(p_data->>'status', 'lead_frio'),
    p_data->>'case_number',
    p_data->>'title',
    p_data->>'description',
    NULLIF(p_data->>'fee_model_id','')::uuid,
    NULLIF(p_data->>'fee_value','')::numeric
  )
  RETURNING * INTO v_row;
  RETURN v_row;
END $$;

CREATE OR REPLACE FUNCTION public.api_case_update_status(
  p_id     uuid,
  p_status text,
  p_notes  text DEFAULT NULL
)
RETURNS cases
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row cases;
BEGIN
  UPDATE cases SET
    status      = p_status,
    description = COALESCE(p_notes, description),
    closed_at   = CASE
                    WHEN p_status IN ('encerrado','perdido') THEN now()
                    ELSE closed_at
                  END
  WHERE id = p_id
  RETURNING * INTO v_row;
  RETURN v_row;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- AGENDA — appointment_create estendido (event_type, court, process_number, case_id)
-- ════════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.api_appointment_create(jsonb);

CREATE OR REPLACE FUNCTION public.api_appointment_create(p_data jsonb)
RETURNS appointments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row appointments;
BEGIN
  INSERT INTO appointments (
    instancia, agenda_id, professional_id, procedure_id,
    contact_nome, contact_numero,
    starts_at, duration_minutes, status, payment_status, price, notes,
    event_type, court, process_number, case_id
  ) VALUES (
    p_data->>'instancia',
    NULLIF(p_data->>'agenda_id','')::uuid,
    NULLIF(p_data->>'professional_id','')::uuid,
    NULLIF(p_data->>'procedure_id','')::uuid,
    p_data->>'contact_nome',
    p_data->>'contact_numero',
    (p_data->>'starts_at')::timestamptz,
    COALESCE((p_data->>'duration_minutes')::int, 30),
    COALESCE(p_data->>'status', 'agendado'),
    COALESCE(p_data->>'payment_status', 'pendente'),
    NULLIF(p_data->>'price','')::numeric,
    p_data->>'notes',
    COALESCE(p_data->>'event_type', 'reuniao'),
    p_data->>'court',
    p_data->>'process_number',
    NULLIF(p_data->>'case_id','')::uuid
  )
  RETURNING * INTO v_row;
  RETURN v_row;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- CALENDÁRIO FORENSE — verifica se uma data tem expediente
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.api_forensic_check(
  p_date  date,
  p_scope text DEFAULT 'federal',
  p_uf    text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'date', p_date,
    'is_business_day', NOT EXISTS (
      SELECT 1 FROM forensic_calendar
       WHERE date = p_date
         AND (scope = p_scope OR scope = 'federal')
         AND (uf IS NULL OR uf = p_uf OR p_uf IS NULL)
    ),
    'entries', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('label', label, 'scope', scope, 'uf', uf))
         FROM forensic_calendar
        WHERE date = p_date
          AND (scope = p_scope OR scope = 'federal')
          AND (uf IS NULL OR uf = p_uf OR p_uf IS NULL)),
      '[]'::jsonb
    ),
    'is_weekend', EXTRACT(DOW FROM p_date) IN (0, 6)
  );
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- COMPAT — mantém nomes paciente como ALIAS pra cliente (n8n antigo)
-- Se quiser remover totalmente, basta dropar essas 5 linhas.
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.api_paciente_by_phone(p_instancia text, p_numero text)
RETURNS SETOF saved_contacts
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM api_cliente_by_phone(p_instancia, p_numero);
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- GRANTS
-- ════════════════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION
  public.api_clientes_list(text, text, uuid, text, int, int),
  public.api_cliente_by_phone(text, text),
  public.api_cliente_create(jsonb),
  public.api_cliente_update(uuid, jsonb),
  public.api_cliente_delete(uuid),
  public.api_practice_areas_list(boolean),
  public.api_advogados_list(text, boolean, uuid),
  public.api_servicos_list(text, boolean, uuid),
  public.api_servico_honorario(uuid, uuid),
  public.api_fee_models_list(text, boolean, text),
  public.api_cases_list(text, text, uuid, uuid, int, int),
  public.api_cases_by_client(uuid),
  public.api_case_create(jsonb),
  public.api_case_update_status(uuid, text, text),
  public.api_appointment_create(jsonb),
  public.api_forensic_check(date, text, text),
  public.api_paciente_by_phone(text, text)
TO anon, authenticated;
