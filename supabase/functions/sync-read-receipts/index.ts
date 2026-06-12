// ────────────────────────────────────────────────────────────────────────────
// Edge Function: sync-read-receipts
//
// Roda em background (acionada por cron). Pra cada empresa ativa:
//   1) Pega mensagens enviadas pelo atendente que ainda nao foram marcadas
//      como visualizadas (visualizada = false) e tem id_mensagem preenchido.
//   2) Consulta a Evolution API: POST /chat/findMessages/<instance>
//      body { where: { key: { id: <id_mensagem> } } }
//   3) Se a resposta indicar status READ, atualiza visualizada=true no banco.
//
// Disparo manual (teste):
//   curl -X POST https://<proj>.supabase.co/functions/v1/sync-read-receipts \
//        -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
//        -H "x-sync-key: <SYNC_API_KEY>"
//
// Cron sugerido (pg_cron, a cada 60s) — ver bloco SQL no final do arquivo.
// ────────────────────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SYNC_API_KEY = Deno.env.get("SYNC_API_KEY")!;          // chave compartilhada com o cron
const EVOLUTION_BASE_URL = Deno.env.get("EVOLUTION_BASE_URL") ?? "https://evolutionapi.nexladesenvolvimento.com.br";
const BATCH_SIZE = Number(Deno.env.get("SYNC_BATCH_SIZE") ?? 50);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-sync-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Consulta a Evolution sobre um conjunto de id_mensagem e devolve os que
// estao marcados como READ.
// ────────────────────────────────────────────────────────────────────────────
async function fetchReadIds(
  instance: string,
  apikey: string,
  ids: string[],
): Promise<Set<string>> {
  if (!ids.length) return new Set();

  // Evolution aceita where com $in pra varios ids
  const body = {
    where: { key: { id: { $in: ids } } },
    limit: ids.length,
  };

  const url = `${EVOLUTION_BASE_URL}/chat/findMessages/${encodeURIComponent(instance)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": apikey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Evolution ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data = await res.json().catch(() => null);
  // Resposta pode vir como array ou objeto { messages: [...] }
  const rows: Array<{ key?: { id?: string }; status?: string }> = Array.isArray(data)
    ? data
    : (data?.messages || data?.records || []);

  const readIds = new Set<string>();
  for (const r of rows) {
    const id = r?.key?.id;
    const status = (r?.status || "").toUpperCase();
    // Evolution / Baileys usam: PENDING / SERVER_ACK / DELIVERY_ACK / READ / PLAYED
    if (id && (status === "READ" || status === "PLAYED")) {
      readIds.add(id);
    }
  }
  return readIds;
}

// ────────────────────────────────────────────────────────────────────────────
// Processa 1 empresa: pega pendentes, consulta Evolution, marca como visualizadas.
// ────────────────────────────────────────────────────────────────────────────
async function syncCompany(company: { instance: string; api_instancia: string }) {
  const { instance, api_instancia } = company;

  if (!instance || !api_instancia) {
    return { instance, ok: false, erro: "instancia ou api_instancia ausente" };
  }

  // Pega mensagens pendentes de visualizacao (atendente + visualizada=false + id_mensagem nao nulo)
  const { data: pendentes, error: selErr } = await supabase
    .from("mensagens_geral")
    .select("id, id_mensagem")
    .eq("instancia", instance)
    .eq("type", "atendente")
    .eq("visualizada", false)
    .not("id_mensagem", "is", null)
    .order("id", { ascending: false })
    .limit(BATCH_SIZE);

  if (selErr) return { instance, ok: false, erro: `select: ${selErr.message}` };
  if (!pendentes?.length) return { instance, ok: true, conferidas: 0, atualizadas: 0 };

  const ids = pendentes.map((r) => r.id_mensagem!).filter(Boolean);

  let readIds: Set<string>;
  try {
    readIds = await fetchReadIds(instance, api_instancia, ids);
  } catch (e) {
    return { instance, ok: false, erro: String((e as Error).message ?? e), conferidas: ids.length };
  }

  if (!readIds.size) return { instance, ok: true, conferidas: ids.length, atualizadas: 0 };

  const idsParaUpdate = pendentes
    .filter((r) => r.id_mensagem && readIds.has(r.id_mensagem))
    .map((r) => r.id);

  const { error: updErr } = await supabase
    .from("mensagens_geral")
    .update({ visualizada: true, visualizada_em: new Date().toISOString() })
    .in("id", idsParaUpdate);

  if (updErr) return { instance, ok: false, erro: `update: ${updErr.message}`, conferidas: ids.length };

  return { instance, ok: true, conferidas: ids.length, atualizadas: idsParaUpdate.length };
}

// ────────────────────────────────────────────────────────────────────────────
// Handler HTTP
// ────────────────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // Auth: aceita Service Role JWT OU header x-sync-key
  const auth = req.headers.get("authorization") ?? "";
  const syncKey = req.headers.get("x-sync-key") ?? "";
  const ok =
    auth.startsWith("Bearer ") && auth.endsWith(SERVICE_ROLE) ||
    (SYNC_API_KEY && syncKey === SYNC_API_KEY);
  if (!ok) return json({ ok: false, erro: "nao_autorizado" }, 401);

  // Lista empresas ativas (com api_instancia preenchida)
  const { data: companies, error } = await supabase
    .from("companies")
    .select("instance, api_instancia")
    .eq("active", true)
    .not("api_instancia", "is", null);

  if (error) return json({ ok: false, erro: `companies: ${error.message}` }, 500);
  if (!companies?.length) return json({ ok: true, mensagem: "nenhuma empresa ativa", instancias: 0 });

  // Processa todas em paralelo (max 8 simultaneas pra nao estourar Evolution)
  const CONCURRENCY = 8;
  const resultados: Array<unknown> = [];
  for (let i = 0; i < companies.length; i += CONCURRENCY) {
    const batch = companies.slice(i, i + CONCURRENCY);
    const r = await Promise.all(batch.map((c) => syncCompany(c as any)));
    resultados.push(...r);
  }

  const totais = resultados.reduce(
    (acc: any, r: any) => {
      acc.conferidas += r.conferidas ?? 0;
      acc.atualizadas += r.atualizadas ?? 0;
      if (!r.ok) acc.erros++;
      return acc;
    },
    { conferidas: 0, atualizadas: 0, erros: 0 },
  );

  return json({ ok: true, instancias: companies.length, totais, resultados });
});

/*
═══════════════════════════════════════════════════════════════════════════════
CRON — agenda no Postgres pra rodar a cada 60s
───────────────────────────────────────────────────────────────────────────────
Roda 1 vez no SQL Editor do Supabase (depois que a function estiver deployada):

  -- Ativa extensões necessárias
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  CREATE EXTENSION IF NOT EXISTS pg_net;

  -- Setup das credenciais (troca os valores)
  SELECT cron.schedule(
    'sync-read-receipts',
    '* * * * *',   -- a cada minuto
    $$
    SELECT net.http_post(
      url := 'https://<PROJ>.supabase.co/functions/v1/sync-read-receipts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-sync-key', '<SYNC_API_KEY_VALUE>'
      ),
      body := '{}'::jsonb
    );
    $$
  );

Pra desativar:
  SELECT cron.unschedule('sync-read-receipts');

Pra ver execuções:
  SELECT * FROM cron.job_run_details ORDER BY end_time DESC LIMIT 20;

═══════════════════════════════════════════════════════════════════════════════
DEPLOY (precisa de "pode subir")
───────────────────────────────────────────────────────────────────────────────
  supabase secrets set SYNC_API_KEY=<gerar-uuid> \
                       EVOLUTION_BASE_URL=https://evolutionapi.nexladesenvolvimento.com.br
  supabase functions deploy sync-read-receipts --project-ref bnyaypxlypmqozilldmx
═══════════════════════════════════════════════════════════════════════════════
*/
