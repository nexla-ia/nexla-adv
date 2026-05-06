-- ════════════════════════════════════════════════════════════════════════════
-- Pivô jurídico — parte 7: Log de guardrails da IA
--
-- Toda vez que a IA detectar e bloquear uma ação proibida pela OAB
-- (emitir parecer jurídico, prometer resultado, captação ativa, citar
-- artigos como conselho), grava aqui pra auditoria/compliance.
--
-- O bloqueio em si é feito no prompt/lógica da IA (n8n + LLM); este log é
-- só o registro pro super-admin auditar.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ai_guardrails_events (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instancia                text NOT NULL,
  conversation_session_id  text,
  blocked_action           text NOT NULL,
    -- Valores esperados: 'parecer_juridico', 'promessa_resultado',
    -- 'captacao_ativa', 'consulta_artigo', 'fora_de_escopo', 'outro'
  reason                   text,
  message_excerpt          text,                    -- trecho da mensagem do cliente
  ai_response_excerpt      text,                    -- o que a IA ia responder antes do bloqueio
  created_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_guardrails_instancia_created
  ON public.ai_guardrails_events(instancia, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_guardrails_action
  ON public.ai_guardrails_events(blocked_action);
