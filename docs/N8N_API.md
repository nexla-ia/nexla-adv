# API NexlaADV — Guia completo para n8n

Documentação para integrar n8n com a API REST do Supabase do NexlaADV.
Foco: bots de WhatsApp, automações e integrações que consultam, criam ou atualizam dados (agendamentos, contatos, mensagens).

---

## Sumário
1. [O que é essa API](#1-o-que-é-essa-api)
2. [Conceitos básicos](#2-conceitos-básicos)
3. [Como o n8n se comunica com a API](#3-como-o-n8n-se-comunica-com-a-api)
4. [Variáveis e referências entre nodes](#4-variáveis-e-referências-entre-nodes)
5. [Sintaxe de queries (PostgREST)](#5-sintaxe-de-queries-postgrest)
6. [Tabelas principais](#6-tabelas-principais)
7. [Receitas prontas](#7-receitas-prontas)
8. [Fluxo completo: bot WhatsApp agendando](#8-fluxo-completo-bot-whatsapp-agendando)
9. [Datas, fusos e formatos](#9-datas-fusos-e-formatos)
10. [Erros comuns e como resolver](#10-erros-comuns-e-como-resolver)
11. [Materiais para estudar](#11-materiais-para-estudar)

---

## 1. O que é essa API

O Supabase expõe **automaticamente** uma API REST pra cada tabela do banco. Não precisa criar endpoints — basta saber:

- **Qual tabela** você quer (vira parte da URL)
- **Que ação** (GET/POST/PATCH/DELETE — vira o método HTTP)
- **Filtros e campos** (vão na query string ou no body)

Tudo passa pela mesma URL base do projeto:
```
https://bnyaypxlypmqozilldmx.supabase.co/rest/v1/<tabela>
```

> **Por que usar essa API direto em vez de criar um backend?**
> Pra automações simples (CRUD), é mais rápido. O Supabase já cuida de auth (via headers), validação de tipos, e a sintaxe de filtro do PostgREST é poderosa. Pra lógica complexa, melhor uma Edge Function.

---

## 2. Conceitos básicos

### 2.1 URL base
```
https://bnyaypxlypmqozilldmx.supabase.co/rest/v1
```

### 2.2 Headers obrigatórios em TODA requisição
```
apikey:        <SUPABASE_ANON_KEY>
Authorization: Bearer <SUPABASE_ANON_KEY>
Content-Type:  application/json
```

> **Onde achar a SUPABASE_ANON_KEY?**
> Painel Supabase → Settings → API → `anon public`. Use **sempre essa**, nunca a `service_role` em automações que rodam fora de servidor confiável.

### 2.3 Header opcional (mas quase sempre necessário)
```
Prefer: return=representation
```
Sem esse header, POST e PATCH retornam **body vazio**. Com ele, retornam o registro criado/atualizado completo — você normalmente precisa do `id` gerado.

### 2.4 Multi-tenant — o campo `instancia`
**Toda tabela do NexlaADV tem uma coluna `instancia` (text).** É o que separa os dados de cada empresa cliente.

- A tabela `companies` tem a coluna chamada `instance` (sem o "a" final).
- Todas as outras tabelas (`appointments`, `contacts`, `agendas`, etc.) usam `instancia`.

⚠️ **Sempre filtre por `instancia` em GETs e sempre envie `instancia` em POSTs**. Se esquecer:
- GET sem `instancia` → vai vir dado de TODAS as empresas (vazamento entre clientes).
- POST sem `instancia` → vai falhar (campo NOT NULL) ou criar lixo órfão.

---

## 3. Como o n8n se comunica com a API

O node usado é o **HTTP Request** (ícone de globo). Vou destrinchar cada campo:

### 3.1 Method
GET (ler), POST (criar), PATCH (atualizar), DELETE (apagar).

### 3.2 URL
A URL completa, **incluindo filtros como query string**.

Exemplo:
```
https://bnyaypxlypmqozilldmx.supabase.co/rest/v1/appointments?instancia=eq.akira&select=*
```

> Você pode escrever a URL fixa ou com **expressões n8n** dentro de `{{ }}` pra inserir valores dinâmicos:
> ```
> https://...supabase.co/rest/v1/appointments?instancia=eq.{{ $json.instancia }}
> ```

### 3.3 Authentication
Sempre **None**. A autenticação é feita pelos headers `apikey` + `Authorization`.

### 3.4 Send Query Parameters
**Deixe OFF** — já estamos colocando os filtros direto na URL. Se ligar e duplicar os filtros aqui, vai dar conflito.

### 3.5 Send Headers
**ON sempre.** Em **Specify Headers** você tem 2 opções:

**Opção A — "Using Fields Below"** (mais visual)
Cria 3 ou 4 campos de Name/Value:

| Name | Value |
|---|---|
| apikey | `eyJhbGciOi...` |
| Authorization | `Bearer eyJhbGciOi...` |
| Content-Type | `application/json` |
| Prefer | `return=representation` (só em POST/PATCH) |

**Opção B — "Using JSON"** (mais rápido de copiar)
```json
{
  "apikey": "eyJhbGciOi...",
  "Authorization": "Bearer eyJhbGciOi...",
  "Content-Type": "application/json",
  "Prefer": "return=representation"
}
```

### 3.6 Send Body
- **GET/DELETE:** OFF
- **POST/PATCH:** ON → Body Content Type: **JSON** → Specify Body: **Using JSON** → cola o objeto JSON

---

## 4. Variáveis e referências entre nodes

Esta é a parte mais importante e onde mais dá erro. n8n usa **expressões** dentro de `{{ }}` pra inserir valores dinâmicos. Toda expressão é JavaScript.

### 4.1 As variáveis principais

| Variável | O que é | Quando usar |
|---|---|---|
| `$json` | Os dados do **item atual** que está sendo processado | Quando você quer um campo do node imediatamente anterior |
| `$json[0]` | O primeiro item se a resposta for array | Quando o node anterior retornou `[{...}, {...}]` |
| `$('NomeDoNode').item.json` | Item atual de um node específico (pelo nome) | Quando precisa pular nodes intermediários |
| `$('NomeDoNode').first().json` | Primeiro item de um node específico | Quando o node retornou array e quer o primeiro |
| `$('NomeDoNode').all()` | Todos os itens de um node | Pra iterar |
| `$now` | Data/hora atual (objeto Luxon) | Cálculos com datas |
| `$today` | Data de hoje 00:00 | Comparação por dia |
| `$workflow.id` | ID do workflow atual | Logs |
| `$execution.id` | ID dessa execução | Logs |
| `$env.NOME_VAR` | Variável de ambiente | Chaves de API |

### 4.2 Quando usar `$json` vs `$('NomeNode')`

- **`$json`** → o n8n pega automaticamente do **node imediatamente anterior** ligado ao input.
- **`$('NomeNode')`** → você está dizendo explicitamente "quero pegar do node X". Mais seguro quando há vários nodes ou caminhos paralelos.

### 4.3 Estrutura de resposta da API Supabase

A API REST do Supabase **sempre retorna array**, mesmo quando é 1 item:
```json
[
  { "id": "uuid", "contact_nome": "João", "starts_at": "..." }
]
```

Por isso você precisa do `[0]` ou de `.first()` pra acessar o primeiro elemento:
```
{{ $json[0].id }}
{{ $('puxarAgenda').first().json.id }}
```

### 4.4 Exemplos passo a passo

#### Exemplo A: pegar instância de uma empresa
**Node 1 — `puxarEmpresa` (GET):**
```
URL: https://...supabase.co/rest/v1/companies?name=ilike.*akira*&select=instance&limit=1
```
**Resposta:** `[{ "instance": "akira" }]`

**Node 2 — usa essa instância:**
```
URL: https://...supabase.co/rest/v1/agendas?instancia=eq.{{ $json[0].instance }}&select=*
```
ou (mais explícito):
```
URL: https://...supabase.co/rest/v1/agendas?instancia=eq.{{ $('puxarEmpresa').first().json.instance }}&select=*
```

#### Exemplo B: usar dados do webhook (mensagem do WhatsApp)
**Node 1 — Webhook** recebe:
```json
{
  "telefone": "5511999999999",
  "mensagem": "quero marcar dia 20/05 às 14h",
  "nome_cliente": "João"
}
```

**Node 2 — POST appointment** usa:
```json
{
  "instancia": "akira",
  "contact_nome": "{{ $('Webhook').item.json.nome_cliente }}",
  "contact_numero": "{{ $('Webhook').item.json.telefone }}",
  "starts_at": "2026-05-20T14:00:00"
}
```

#### Exemplo C: combinando dados de 2 nodes
**Node `puxarAgenda`** retornou: `[{ "id": "abc-123", "name": "Dr. João" }]`
**Node `Webhook`** trouxe: `{ "telefone": "5511..." }`

**Node `criarAgendamento` (POST):**
```json
{
  "agenda_id": "{{ $('puxarAgenda').first().json.id }}",
  "instancia": "akira",
  "contact_numero": "{{ $('Webhook').item.json.telefone }}",
  "contact_nome": "{{ $('Webhook').item.json.nome }}",
  "starts_at": "{{ $('Webhook').item.json.data_iso }}"
}
```

### 4.5 Como saber qual é o caminho da variável

1. Execute o node anterior → veja o **output** dele.
2. Se o output for `[{...}]` (array), o primeiro item é `$json[0]`.
3. Se for `{...}` (objeto), é `$json`.
4. Cada chave do JSON vira `.nomeDaChave`.

**Truque do n8n:** clica direto no campo do JSON do output e ele copia a expressão pronta no clipboard. Cola no campo do próximo node.

### 4.6 Modo Fixed vs Expression

Cada campo no node tem um botão `Fixed | Expression` no canto superior direito.
- **Fixed** = texto literal. `{{ $json.campo }}` aparece como string crua.
- **Expression** = avalia `{{ }}`. **Sempre use Expression quando tiver `{{ }}`.**

n8n geralmente detecta automaticamente, mas se você ver `{{ $json.x }}` no output em vez do valor, é porque está em modo Fixed.

---

## 5. Sintaxe de queries (PostgREST)

A engine do Supabase é o PostgREST. Os filtros vão **na query string** da URL.

### 5.1 Operadores de comparação

| Sintaxe | Significado | Exemplo |
|---|---|---|
| `coluna=eq.valor` | igual | `instancia=eq.akira` |
| `coluna=neq.valor` | diferente | `status=neq.cancelado` |
| `coluna=gt.valor` | maior que | `price=gt.100` |
| `coluna=gte.valor` | maior ou igual | `starts_at=gte.2026-05-15` |
| `coluna=lt.valor` | menor que | `price=lt.500` |
| `coluna=lte.valor` | menor ou igual | `starts_at=lte.2026-05-30` |
| `coluna=like.*texto*` | LIKE (case-sensitive) | `name=like.*João*` |
| `coluna=ilike.*texto*` | ILIKE (case-insensitive) | `name=ilike.*joão*` |
| `coluna=in.(a,b,c)` | dentro de lista | `status=in.(agendado,confirmado)` |
| `coluna=is.null` | é nulo | `paid_at=is.null` |
| `coluna=not.is.null` | NÃO nulo | `paid_at=not.is.null` |

> **Importante:** o `*` no `ilike` é o curinga (equivale ao `%` do SQL).

### 5.2 Combinando filtros (AND implícito)
Basta concatenar com `&`:
```
?instancia=eq.akira&status=eq.agendado&starts_at=gte.2026-05-15
```
Isso é: `instancia = 'akira' AND status = 'agendado' AND starts_at >= '2026-05-15'`.

### 5.3 OR explícito
```
?or=(status.eq.agendado,status.eq.confirmado)
```

### 5.4 Outros parâmetros

| Parâmetro | Função | Exemplo |
|---|---|---|
| `select=col1,col2` | só essas colunas | `select=id,contact_nome` |
| `select=*` | todas | `select=*` |
| `order=coluna.asc` | ordenar crescente | `order=starts_at.asc` |
| `order=coluna.desc` | ordenar decrescente | `order=created_at.desc` |
| `limit=N` | limitar resultados | `limit=10` |
| `offset=N` | paginação | `offset=20&limit=10` |

### 5.5 Exemplo completo
```
/appointments?instancia=eq.akira&status=in.(agendado,confirmado)&starts_at=gte.2026-05-15T00:00:00&select=id,contact_nome,starts_at,status&order=starts_at.asc&limit=20
```
Traduz pra: "20 próximos agendamentos da `akira`, agendados ou confirmados, a partir de 15/05/2026, ordenados por data, retornando só esses 4 campos."

---

## 6. Tabelas principais

### 6.1 `companies` — Empresas (uma por cliente do SaaS)

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| name | text | Nome visível |
| instance | text | **Identificador único** — é esse valor que vira `instancia` nas outras tabelas |
| email | text | |
| phone | text | |

**Buscar instância pelo nome:**
```
GET /companies?name=ilike.*akira*&select=instance&limit=1
```

### 6.2 `agendas` — Configurações de horário

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK — referenciado por `appointments.agenda_id` |
| instancia | text | Multi-tenant |
| name | text | Nome (ex: "Dr. João") |
| working_days | int[] | `[1,2,3,4,5]` = seg-sex (0=domingo, 6=sábado) |
| start_time | time | `07:00:00` |
| end_time | time | `18:00:00` |
| slot_minutes | int | Duração do slot (default 30) |
| active | bool | |
| professional_id | uuid | FK → professionals |

**Listar agendas ativas:**
```
GET /agendas?instancia=eq.akira&active=eq.true&select=*
```

### 6.3 `appointments` — Agendamentos

| Coluna | Tipo | Obrigatório | Notas |
|---|---|---|---|
| id | uuid | auto | PK |
| agenda_id | uuid | não | FK → agendas |
| instancia | text | **sim** | |
| contact_nome | text | **sim** | |
| contact_numero | text | não | Formato: `5511999999999` (com DDI) |
| starts_at | timestamptz | **sim** | ISO: `2026-05-20T14:00:00` |
| duration_minutes | int | não | Default 30 |
| status | text | não | Default `agendado` |
| event_type | text | não | `reuniao`, `audiencia`, `prazo`, etc |
| notes | text | não | |
| price | numeric(10,2) | não | |
| payment_status | text | não | Default `pendente` |
| paid_at | timestamptz | não | |
| court | text | não | Tribunal |
| process_number | text | não | Nº processo |
| case_id | uuid | não | FK → cases |
| professional_id | uuid | não | FK → professionals |
| created_by_email | text | não | Quem criou |

**Status possíveis:** `agendado`, `confirmado`, `realizado`, `cancelado`, `faltou`.

### 6.4 `contacts` — Contatos do WhatsApp

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| instancia | text | |
| numero | text | Telefone |
| nome | text | Nome salvo |
| created_at | timestamptz | |

### 6.5 `messages` — Mensagens trocadas

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| instancia | text | |
| numero | text | Telefone do contato |
| mensagem | text | Conteúdo |
| origem | text | `cliente` ou `atendente` |
| id_mensagem | text | ID interno do WhatsApp (pra editar/deletar) |
| created_at | timestamptz | |

---

## 7. Receitas prontas

### 7.1 Buscar instância pelo nome
```
GET /companies?name=ilike.*<nome>*&select=instance&limit=1
```
Resposta: `[{ "instance": "akira" }]`

### 7.2 Pegar agenda ativa de uma instância
```
GET /agendas?instancia=eq.akira&active=eq.true&select=id,name,working_days,start_time,end_time,slot_minutes&limit=1
```

### 7.3 Listar agendamentos futuros
```
GET /appointments?instancia=eq.akira&starts_at=gte.{{ $now.toISO() }}&status=eq.agendado&select=*&order=starts_at.asc
```

### 7.4 Verificar se um horário está livre
```
GET /appointments?instancia=eq.akira&agenda_id=eq.<uuid>&starts_at=eq.2026-05-20T14:00:00&select=id
```
- `[]` → livre
- `[{...}]` → ocupado

### 7.5 Criar agendamento
**POST** `/appointments` com header `Prefer: return=representation`:
```json
{
  "agenda_id": "{{ $('puxarAgenda').first().json.id }}",
  "instancia": "akira",
  "contact_nome": "{{ $('Webhook').item.json.nome }}",
  "contact_numero": "{{ $('Webhook').item.json.telefone }}",
  "starts_at": "{{ $('Webhook').item.json.data_iso }}",
  "duration_minutes": 30,
  "status": "agendado",
  "event_type": "reuniao",
  "notes": "Agendado via WhatsApp"
}
```

### 7.6 Confirmar/cancelar agendamento
**PATCH** `/appointments?id=eq.<uuid>`:
```json
{ "status": "confirmado" }
```
ou
```json
{ "status": "cancelado", "notes": "Cliente desmarcou via WhatsApp" }
```

### 7.7 Buscar histórico de um cliente
```
GET /appointments?instancia=eq.akira&contact_numero=eq.5511999999999&order=starts_at.desc&limit=5
```

### 7.8 Salvar mensagem recebida
**POST** `/messages`:
```json
{
  "instancia": "akira",
  "numero": "{{ $json.from }}",
  "mensagem": "{{ $json.body }}",
  "origem": "cliente",
  "id_mensagem": "{{ $json.message_id }}"
}
```

---

## 8. Fluxo completo: bot WhatsApp agendando

Esse é o esqueleto de um fluxo de ponta a ponta.

```
[1. Webhook]
   recebe { telefone, mensagem, nome }
        ↓
[2. IA / parser]
   extrai data/hora desejada → { data_iso: "2026-05-20T14:00:00" }
        ↓
[3. puxarEmpresa] GET /companies?name=...&select=instance
        ↓ retorna [{ instance: "akira" }]
[4. puxarAgenda] GET /agendas?instancia=eq.{{ $('puxarEmpresa').first().json.instance }}&active=eq.true
        ↓ retorna [{ id: "agenda-uuid", working_days: [...], ... }]
[5. verificarHorario] GET /appointments?...&starts_at=eq.{{ $('IA').first().json.data_iso }}
        ↓ retorna []
[6. IF — array vazio?]
   ├── SIM → [criarAgendamento] POST /appointments
   │           ↓
   │        [responderSucesso] envia "Agendado com sucesso!"
   │
   └── NÃO → [responderOcupado] envia "Esse horário já está ocupado"
```

### Body do POST do node [6]:
```json
{
  "agenda_id": "{{ $('puxarAgenda').first().json.id }}",
  "instancia": "{{ $('puxarEmpresa').first().json.instance }}",
  "contact_nome": "{{ $('Webhook').item.json.nome }}",
  "contact_numero": "{{ $('Webhook').item.json.telefone }}",
  "starts_at": "{{ $('IA').first().json.data_iso }}",
  "status": "agendado",
  "event_type": "reuniao",
  "notes": "Agendado via WhatsApp pelo bot"
}
```

---

## 9. Datas, fusos e formatos

### 9.1 Formato aceito pela API
A coluna `starts_at` é `timestamptz` (com fuso horário). Aceita:
```
2026-05-20T14:00:00              (assume UTC)
2026-05-20T14:00:00-03:00        (com fuso explícito - melhor)
2026-05-20T17:00:00Z             (Z = UTC)
```

> **Recomendação:** sempre envie com fuso explícito `-03:00` (horário de Brasília) pra evitar confusão.

### 9.2 Manipulando datas no n8n

n8n usa **Luxon** (lib JS de datas). Disponível como `$now`, `$today`, `DateTime`.

**Hoje + 1 dia às 14h, em ISO:**
```
{{ $now.plus({ days: 1 }).set({ hour: 14, minute: 0, second: 0 }).toISO() }}
```

**Início do dia de hoje:**
```
{{ $today.toISO() }}
```

**Fim do dia (23:59:59):**
```
{{ $today.endOf('day').toISO() }}
```

**Parsear "20/05/2026 14:00":**
```
{{ DateTime.fromFormat('20/05/2026 14:00', 'dd/MM/yyyy HH:mm', { zone: 'America/Sao_Paulo' }).toISO() }}
```

**Formatar pro usuário ler ("20/05 às 14h"):**
```
{{ DateTime.fromISO($json.starts_at).setZone('America/Sao_Paulo').toFormat('dd/MM \'às\' HH\'h\'') }}
```

### 9.3 Filtrando por intervalo de dia
"Agendamentos de hoje":
```
?starts_at=gte.{{ $today.toISO() }}&starts_at=lt.{{ $today.plus({ days: 1 }).toISO() }}
```

---

## 10. Erros comuns e como resolver

| Erro | Causa | Solução |
|---|---|---|
| `invalid input syntax for type uuid: ""` | Campo uuid recebeu string vazia | Sua expressão `{{ ... }}` retornou vazio. Verifica o output do node anterior e corrige o caminho. |
| `invalid input syntax for type timestamp with time zone: ""` | `starts_at` vazio ou em formato inválido | Garante que a expressão retorna ISO 8601. Testa com valor fixo primeiro. |
| `null value in column "X" violates not-null constraint` | Faltou campo obrigatório no body | Adiciona o campo. Ver tabela na seção 6 pra saber quais são NOT NULL. |
| `JWT expired` ou `Invalid JWT` | Anon key errada/expirada | Pega a key atual no painel Supabase → Settings → API. |
| `permission denied for table X` | RLS bloqueou | Verifica a policy da tabela no Supabase. |
| Body vazio no POST/PATCH | Esqueceu `Prefer: return=representation` | Adiciona esse header. |
| GET retorna `[]` mas tem dado no banco | Filtro `instancia` errado/faltando | Confere o valor exato (case-sensitive). |
| Output mostra `{{ $json.x }}` literal | Campo está em modo "Fixed" | Clica no botão "Expression" no canto do campo. |
| `Bad request - Send Body is on but body is empty` | Tem body ligado mas sem JSON | Ou desliga o Send Body (em GET) ou preenche o JSON. |
| Webhook recebe mas n8n não vê os dados | Estrutura do JSON do webhook diferente do esperado | Olha o output do node Webhook e ajusta o caminho da expressão. |

### Debug rápido
1. **Sempre teste com valor fixo primeiro.** Se funcionar com valor fixo e quebrar com expressão, o problema é a expressão.
2. **Use o output de cada node como referência.** Clica direto no campo no JSON pra copiar a expressão correta.
3. **Postman é seu amigo.** Antes de configurar no n8n, testa a chamada no Postman com a collection em `docs/NexlaAdv.postman_collection.json`.

---

## 11. Materiais para estudar

### PostgREST (engine de REST do Supabase)
- Docs: https://postgrest.org/en/stable/
- Operadores: https://postgrest.org/en/stable/api.html#operators
- Embedding (joins): https://postgrest.org/en/stable/api.html#resource-embedding

### Supabase REST
- Docs: https://supabase.com/docs/reference/api/introduction
- **API auto-gerada do projeto:** painel Supabase → API Docs (mostra exemplo pronto pra cada tabela)

### n8n
- HTTP Request node: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/
- Expressions: https://docs.n8n.io/code/expressions/
- Variáveis embutidas: https://docs.n8n.io/code/builtin/overview/
- Luxon (datas): https://moment.github.io/luxon/

### Postman collection
`docs/NexlaAdv.postman_collection.json` — importa no Postman pra testar tudo antes de configurar no n8n.

### Ordem sugerida pra estudar
1. Seção 2 e 3 deste guia (conceitos + node HTTP).
2. Brincar com Postman fazendo GET nas tabelas.
3. Seção 4 (variáveis) — releia até dominar.
4. Seção 5 (sintaxe de query).
5. Replicar o fluxo da seção 8 num workflow novo no n8n.
6. Quando travar, seção 10.
