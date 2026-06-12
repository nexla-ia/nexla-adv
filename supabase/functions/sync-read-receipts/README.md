# sync-read-receipts

Edge Function que sincroniza **read receipts** (visto azul) do WhatsApp via
Evolution API e marca `mensagens_geral.visualizada = true` no banco.

## Como funciona

```
[pg_cron a cada 60s]
        ↓
[Edge Function sync-read-receipts]
        ↓
1) SELECT companies WHERE active=true AND api_instancia NOT NULL
2) Pra cada empresa em paralelo (até 8 simultâneas):
   a) SELECT id, id_mensagem FROM mensagens_geral
      WHERE instancia=X AND type='atendente' AND visualizada=false
      LIMIT 50
   b) POST evolutionapi/chat/findMessages/<instance>
      body: { where: { key: { id: { $in: [...] } } } }
   c) UPDATE visualizada=true onde status='READ'
3) Devolve JSON com totais (conferidas, atualizadas, erros)
```

## Deploy

```bash
# 1) Gerar a sync key
SYNC_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 2) Setar secrets
supabase secrets set SYNC_API_KEY=$SYNC_KEY \
  EVOLUTION_BASE_URL=https://evolutionapi.nexladesenvolvimento.com.br \
  --project-ref bnyaypxlypmqozilldmx

# 3) Deploy
supabase functions deploy sync-read-receipts --project-ref bnyaypxlypmqozilldmx
```

> ⚠️ Não fazer sem "pode subir" explícito do dono.

## Setup do cron (depois do deploy)

Roda no SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'sync-read-receipts',
  '* * * * *',  -- a cada minuto
  $$
  SELECT net.http_post(
    url := 'https://bnyaypxlypmqozilldmx.supabase.co/functions/v1/sync-read-receipts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-key', 'COLA-AQUI-O-SYNC_API_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## Teste manual

```bash
curl -X POST https://bnyaypxlypmqozilldmx.supabase.co/functions/v1/sync-read-receipts \
  -H "x-sync-key: <SYNC_API_KEY>"
```

Resposta esperada:
```json
{
  "ok": true,
  "instancias": 3,
  "totais": { "conferidas": 42, "atualizadas": 17, "erros": 0 },
  "resultados": [
    { "instance": "akira", "ok": true, "conferidas": 12, "atualizadas": 5 }
  ]
}
```

## Env vars

| Variável | Necessária | Descrição |
|---|---|---|
| `SUPABASE_URL` | auto | URL do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | auto | Service role (bypass RLS) |
| `SYNC_API_KEY` | sim | Token que o cron usa pra autenticar |
| `EVOLUTION_BASE_URL` | não | Default: `https://evolutionapi.nexladesenvolvimento.com.br` |
| `SYNC_BATCH_SIZE` | não | Default 50 — mensagens por empresa por execução |

## Monitorar

```sql
-- Ultimas execucoes do cron
SELECT * FROM cron.job_run_details
WHERE jobname = 'sync-read-receipts'
ORDER BY end_time DESC LIMIT 20;

-- Quantas mensagens ainda nao visualizadas
SELECT instancia, COUNT(*) as pendentes
FROM mensagens_geral
WHERE type='atendente' AND visualizada=false
GROUP BY instancia;
```

## Desativar

```sql
SELECT cron.unschedule('sync-read-receipts');
```
