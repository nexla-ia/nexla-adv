# Product Marketing Context

*Last updated: 2026-05-06 · V2 — pivô para área jurídica confirmado*

> **Pivô em curso:** Este repositório (`nexla-adv`) era a base MedicinaMKT (saúde). Agora é o produto **jurídico** da Nexla, **generalista** (atende todas as áreas: cível, trabalhista, criminal, família, empresarial, tributário, previdenciário, consumidor). O core de centralização de mensagens, IA 24/7, agenda, multi-tenant e métricas permanece. Funcionalidades atreladas a saúde (convênios, procedimentos médicos, ficha clínica/prontuário, validação procedimento×convênio) saem ou são reformuladas para o vocabulário jurídico. **Banco novo do zero** (sem migrar dados da base saúde).

## Product Overview
**One-liner:** A central de atendimento, agenda e gestão que seu escritório de advocacia precisa.
**What it does:** Unifica WhatsApp, Instagram e Digisac numa caixa única, atende clientes com IA 24/7, agenda audiências, reuniões e consultas com validação automática de conflitos, e mostra cada real que entra. Tudo num painel só, sem precisar planilha paralela.
**Product category:** Plataforma de atendimento e gestão para escritórios de advocacia (vertical legal, generalista).
**Product type:** SaaS multi-tenant.
**Business model:** Assinatura mensal por escritório, 3 planos (Starter / Pro / Business sob medida). Sem cobrança por mensagem. Cancela quando quiser. **Valores definidos no plano comercial — não exibir preço fixo na landing nem em copy público até decisão de pricing.**
**Brand wordmark:** **Nexla Adv** (provisório — produto da Nexla, nome final será definido depois).
**Tagline candidates** (escolher 1 — todas mantêm o paralelo "negócio + ética" do MedicinaMKT, em tom sóbrio compatível com o Provimento 205 da OAB):
1. *"Ética e eficiência não brigam."*
2. *"Atenda como advogado. Escale como empresa."*
3. *"A advocacia merece um atendimento à altura."*
4. *"Seu escritório no WhatsApp, com a sobriedade da banca."*
5. *"Operação digital pra advocacia que não abre mão da ética."*

## Target Audience
**Target companies:** Escritórios de advocacia (do advogado solo até bancas com 50+ profissionais), com volume relevante de atendimento via WhatsApp e que dependem de secretária/recepção pra triar contatos e agendar consultas. Inclui escritórios com filiais/correspondentes regionais.
**Decision-makers:** Advogado-sócio (compra), administrador/gestor de escritório (operacionaliza), secretária jurídica / recepção (usuário diário).
**Primary use case:** Não perder lead que chega pelo WhatsApp + organizar agenda de audiências/reuniões sem planilha + ter visão financeira do escritório (honorários, distribuição por área).
**Jobs to be done:**
- Atender 24/7 quem chama no WhatsApp/Instagram sem precisar contratar mais secretária
- Agendar consulta/reunião com cálculo automático de valor (tipo de serviço × forma de honorário) sem erro
- Saber quanto o escritório faturou, qual área mais lucrou, quais sócios mais receberam casos — sem montar planilha

**Use cases:**
- Pré-triagem por IA fora do horário comercial (madrugada, feriados, recesso forense) — capturar lead que veio de Google/Instagram à noite
- Substituir 1 secretária CLT (~R$3.500/mês) ou liberá-la para tarefas estratégicas (acompanhar prazo, organizar pasta processual)
- Recepção de bancas com filiais/correspondentes ver conversas e agendamentos de qualquer unidade num lugar só
- Cadastrar ficha leve do cliente (dados, áreas de interesse, status do caso) sem precisar comprar software de gestão jurídica caro
- Disparar follow-up automatizado pra cliente que sumiu antes de assinar contrato de honorários

## Personas
| Persona | Cares about | Challenge | Value we promise |
|---------|-------------|-----------|------------------|
| Advogado-sócio (Champion + Decision Maker + Financial Buyer) | ROI, profissionalização do escritório, ter mais tempo livre pro contencioso | "Minha secretária vive sobrecarregada, lead reclama de demora pra responder, não sei quanto o escritório faturou mês passado nem qual área mais lucrou" | Operação digital de alta performance — atende 24/7, agenda sem erro, mostra o número certo |
| Administrador / gestor de escritório (User + Champion) | Eficiência da equipe, menos retrabalho, controle de prazos | Excel tem versões diferentes em cada secretária, follow-up de cliente cai por terra, audiência marcada em conflito | Quadro Kanban + agenda integrada + ficha de cliente: tudo num lugar |
| Secretária jurídica / recepção (User) | Não apanhar do WhatsApp, não esquecer cliente, não confundir advogado nas marcações | Mil conversas paralelas, cliente esperando enquanto outro liga, advogado pedindo informação no meio do dia | Caixa unificada + IA filtrando, encerrando os simples e passando os complexos |

## Problems & Pain Points
**Core problem:** Lead chega pelo WhatsApp depois de ver Google/Instagram e cai num atendimento humano lento, com horário comercial restrito, secretária sobrecarregada — escritório perde a primeira consulta e nem registra que perdeu.
**Why alternatives fall short:**
- WhatsApp Business puro: não tem agenda, não tem IA, não tem métrica nem visão de funil de captação
- Software jurídico tradicional (ProJuris, Astrea, ADVBOX, Legal One, Aurum): foca em prazos/peticionamento/pasta processual, mas WhatsApp é plug malfeito e IA quase inexistente
- Planilha + Google Calendar + Drive: depende de disciplina humana, sem cálculo de honorário, sem IA, sem multi-unidade
- Contratar mais secretária: R$3.500+/mês cada, escala linearmente, ainda dorme à noite

**What it costs them:** Leads perdidos (cada primeira consulta paga R$300-1.500 dependendo da área; cada caso fechado vale milhares em honorários), tempo de secretária retrabalhando, decisões financeiras no escuro.
**Emotional tension:** "Estou pagando secretária pra ela ficar copiando recado de WhatsApp pra Excel" + "Não sei quanto o escritório realmente fatura nem qual é minha área mais lucrativa".

## Competitive Landscape
**Direct:** ProJuris, Astrea, ADVBOX, Legal One, Aurum, CPJ-3C — São software de gestão jurídica que tentou virar atendimento. WhatsApp é plug mal feito e IA quase inexistente.
**Secondary:** WhatsApp Business + Google Calendar + Excel + Drive — Custa zero mas escala mal, sem IA, sem visão financeira, sem multi-unidade.
**Indirect:** Contratar mais secretárias / call center jurídico — Resolve volume mas custa caro, não tem dado, depende de pessoa estar lá. Chatbots genéricos (Take, Blip) — não falam o vocabulário forense, não calculam honorário, não integram com a agenda.

## Differentiation
**Key differentiators:**
- IA de atendimento 24/7 que realmente fecha agendamento de consulta (não só responde "vou verificar")
- Agenda com cálculo automático tipo de serviço × forma de honorário (consulta avulsa, contrato fixo, êxito) — sem secretária errar valor
- Multi-tenant pensado pra escritórios com filiais e correspondentes (super-admin Nexla, instâncias separadas)
- Ficha de cliente leve com áreas de interesse, status do caso, timeline — sem ser sistema de gestão jurídica caro
- Painel super-admin "Command Center" pra grupos/redes de escritórios com espelho de conversa e operação consolidada
- Métricas em 6 abas (Visão geral, Atendimento, Equipe, Agenda, Financeiro, Leads/Captação)

**How we do it differently:** Nasce centrado no atendimento e captação (WhatsApp+IA primeiro), agenda e ficha vieram depois. Concorrentes nasceram como gestão de processo/peticionamento e empurraram WhatsApp como afterthought.
**Why that's better:** Onde o cliente realmente entra (WhatsApp) é onde a plataforma funciona melhor. Captação é o gargalo de quase todo escritório, não a gestão de processo (que já tem ProJuris/Astrea).
**Why customers choose us:** Substitui parcialmente secretária CLT (~R$3.500/mês) por uma fração do custo, retornando o investimento em 30 dias com 1 caso fechado. *(valor exato definido no plano comercial)*

## Objections
| Objection | Response |
|-----------|----------|
| "IA vai responder besteira pro meu cliente" e ferir o Provimento 205 da OAB / código de ética | IA é treinada com sua tabela de serviços/honorários e tem guardrails: nunca dá parecer jurídico, nunca promete resultado, sempre encaminha caso consultivo pra advogado humano. Tudo logado e auditável. |
| "Já tenho ProJuris/Astrea/Aurum" | Não substitui — complementa. A gente é o front-end de captação e atendimento; o software jurídico continua cuidando de prazo e peticionamento. Integramos depois. |
| "Não posso captar cliente por WhatsApp por causa da OAB (publicidade ativa)" | A plataforma não capta — atende quem JÁ buscou seu escritório. É atendimento passivo, dentro das regras de publicidade jurídica. **[CONFIRMAR juridicamente — vale revisar com OAB consultiva antes de virar copy oficial]** |
| "Parece complicado migrar" | Setup guiado em 24h. Cadastrar advogados, áreas e tabela de honorários leva 1-2h. |

**Anti-persona:** Banca grande full-service com TI próprio (vão querer dev custom e integração com PJe/e-SAJ), advogado autônomo sem volume (não justifica nem o Starter), escritório que recusa qualquer automação ("cliente quer ouvir voz humana"), contencioso de massa de banco/seguradora (volume errado, modelo de operação diferente).

## Switching Dynamics
**Push:** Secretária pediu demissão / saiu de licença / sobrecarregou. Lead reclamando que demora pra responder. Mês fechou e sócio não sabe quanto faturou. Audiência marcada em cima de outra.
**Pull:** "Eu queria que a IA atendesse de noite quando vem lead da Meta Ads" + "queria saber quem mais agenda" + "queria parar de errar valor de honorário".
**Habit:** Excel da agenda + grupo de WhatsApp da equipe + planilha financeira do contador + caderninho de prazos.
**Anxiety:** "E se a IA disser preço errado de honorário?" + "vai ferir o código de ética da OAB?" + "minha equipe vai resistir a mudar?" + "vou ficar refém do sistema?"

## Customer Language
**How they describe the problem:**
- "Tô perdendo lead no WhatsApp"
- "Minha secretária não dá conta"
- "Não sei quanto o escritório fatura"
- "A gente vive na planilha"
- "Não sei qual área tá dando mais retorno"

**How they describe us:**
- "É tipo um WhatsApp que faz a agenda sozinho"
- "Substitui meia secretária"
- "Centraliza tudo num lugar só"

**Words to use:** atendimento, agenda, ficha do cliente, honorários, recepção, agendamento, advogado, área de atuação, sócio, lucro, cliente, captação, audiência, reunião, primeira consulta.
**Words to avoid:** lead (depende — marketing usa, mas no produto preferir "cliente em prospecção"), MRR/SaaS/churn (jargão de tech), funil (parece vendas agressivas), CRM (denota frieza). Use "cliente" sempre, evitar "consumidor". Cuidado com termos de captação ativa (proibida pela OAB) — preferir "atendimento" e "recepção".
**Glossary:**
| Term | Meaning |
|------|---------|
| Recepção | Aba de conversas que IA filtrou, aguardando humano |
| Meu Setor | Conversas atribuídas ao operador logado |
| Ticket | Uma conversa aberta com cliente |
| Instância | Conexão WhatsApp do escritório (Evolution API) |
| Espião (interno) | Painel super-admin pra Nexla espelhar conversa de qualquer escritório |
| Honorário | Valor cobrado pelo serviço (avulso, fixo mensal, êxito) |
| Área de atuação | Especialidade do advogado (cível, trabalhista, criminal, família, etc.) |

## Brand Voice
**Tone:** Direto, conversacional, sem jargão de tech. "Vocês podem", "demos pra vocês", "acabou aquela história de planilha". Tom de quem entende a dor do advogado-sócio (sem ser bajulador nem jurisdiquês).
**Style:** Frase curta, exemplo concreto, número quando possível. Não usa emoji em produto (só na landing/comunicação). Cuidado com tom mercantilista — advocacia tem código de ética que reprime publicidade exagerada.
**Personality:** Confiável, eficiente, irônico-com-graça, pragmático, anti-corporativês. Sóbrio onde precisa ser (advogado é cliente conservador), divertido onde dá (no copy de landing).

## Proof Points
**Metrics:** **[CONFIRMAR — métricas do MedicinaMKT (3.2x agendamentos, 68% redução tempo) não se aplicam diretamente; precisa medir com piloto jurídico antes de virar copy oficial]**
**Customers:** **[PREENCHER — quais escritórios reais já usam ou estão no piloto? Hoje o README ainda lista mocks de saúde/imobiliária/pet shop — substituir por escritórios jurídicos reais]**
**Testimonials:** **[PREENCHER — pegar 1-3 quotes reais de escritórios piloto]**
**Value themes:**
| Theme | Proof |
|-------|-------|
| Substitui secretária CLT | Fração do custo de uma CLT (R$3.500/mês) — ROI em <1 mês com 1 caso fechado |
| IA não-besta e em conformidade com OAB | Atende 24/7, fecha agendamento, nunca dá parecer jurídico — tudo auditável |
| Tudo num lugar | WhatsApp + Instagram + agenda + ficha + financeiro + métricas |

## Goals
**Business goal:** **[CONFIRMAR — meta de escritórios pagantes / MRR até quando?]**
**Conversion action:** Trial grátis (sem cartão) → ativação em 24h → conversão pra plano pago.
**Current metrics:** **[PREENCHER — quantos escritórios no piloto? MRR atual? Plano mais vendido?]**

---

## Escopo do produto jurídico — rascunho de features

Premissa do recorte: a plataforma **continua sendo de centralização de atendimento + agenda + gestão leve**. Não vira software de gestão jurídica (não compete com ProJuris/Astrea no peticionamento, prazo processual sério, integração com PJe/e-SAJ etc.). Foco é o "front-office" do escritório.

### A. Fica como está (sem mudança funcional, só verificar copy)
- Caixa unificada WhatsApp/Instagram/Digisac
- IA de atendimento 24/7 (com guardrails novos — ver seção D)
- Recepção / Meu Setor / Tickets / Kanban de conversas
- Multi-tenant (super-admin Nexla, espião, instâncias)
- Alertas (paciente em espera → cliente em espera)
- Métricas (6 abas — adaptar nomenclatura)
- Tutorial / Suporte / Notícias internas
- Billing / Limites de plano / Bloqueio de conta
- Segurança da conta (2FA, sessões, senha)
- Landing pública

### B. Sai (saúde-específico — remover do banco e da UI)
- Tabela de **convênios** (Unimed, Bradesco Saúde etc.) — não há equivalente direto em advocacia
- **Procedimentos médicos** com cálculo procedimento × convênio
- **Prontuário básico / ficha clínica** com campos médicos (medicação, alergias, diagnóstico, exames)
- **Catálogo de procedimentos** no formato atual (substituído por "Tabela de serviços jurídicos" — ver C)
- Página `CompanyPatientDetail` no formato saúde (vira `CompanyClientDetail`)
- Mocks de empresas (Saúde Total, Pet Shop) — substituídos por escritórios reais

### C. Renomeia / reformula (mesma mecânica, vocabulário jurídico)
| MedicinaMKT (antes) | Nexla Adv (depois) |
|---|---|
| Paciente | Cliente (com distinção PF/PJ) |
| Consulta | Atendimento (1ª consulta, reunião, audiência) |
| Procedimento | Serviço jurídico |
| Convênio | Forma de honorário (avulso, fixo mensal, êxito, partido) |
| Ficha do paciente | Ficha do cliente |
| Prontuário | Histórico de atendimentos (sem dado clínico) |
| CRM / especialidade médica | OAB / área de atuação |
| Tabela de procedimentos × convênios | Tabela de serviços × forma de honorário |
| Catálogo (CompanyCatalog) | Catálogo de serviços jurídicos |
| Métricas: "procedimento mais vendido" | Métricas: "área que mais retornou" |

### D. Entra novo (advocacia-específico)
Priorizado — **P1** = MVP, **P2** = pós-MVP, **P3** = quando houver demanda.

| Prioridade | Feature | Por quê |
|---|---|---|
| **P1** | **Áreas de atuação** como entidade (cível, trabalhista, criminal, família, empresarial, tributário, previdenciário, consumidor, outros) — vinculadas ao advogado e ao caso/cliente | Triagem da IA, distribuição automática, métricas por área |
| **P1** | **Tabela de serviços jurídicos** — primeira consulta, parecer, contrato, peticionamento, audiência, contrato de êxito, consultoria | Substitui catálogo médico, alimenta cálculo de honorário na agenda |
| **P1** | **Ficha do cliente PF/PJ** — toggle no cadastro: PF (CPF, RG, profissão) vs PJ (CNPJ, razão social, representante legal) | Escritório atende ambos; saúde só PF |
| **P1** | **Status do caso** no Kanban — Lead frio · Lead quente · Em proposta · Contrato assinado · Em andamento · Encerrado · Perdido | Substitui "agendado/atendido" do MedicinaMKT |
| **P1** | **Distribuição por área pela IA** — IA identifica área na conversa ("quero processar empregador" → trabalhista) e roteia pro advogado certo | Equivale a "IA identificar urgência médica"; aqui é roteamento por especialidade |
| **P1** | **Guardrails da IA conformes OAB** — bloquear: emitir parecer jurídico, prometer resultado, citar artigos como conselho, captar ativamente. Permitir: confirmar dados, marcar atendimento, repassar tabela de honorários, encaminhar humano | Provimento 205 / Código de Ética da OAB |
| **P1** | **Calendário forense embutido na agenda** — feriados forenses, recesso (20/12 a 20/01), suspensão de prazos | Evitar marcar audiência em dia sem expediente forense |
| **P2** | **Tipos de evento na agenda** — 1ª consulta · reunião com cliente · audiência (com vara/juízo/processo) · prazo administrativo | Hoje é só "consulta" — agenda jurídica é mais rica |
| **P2** | **Modelo de proposta de honorários** — IA monta proposta por mensagem com base na tabela; cliente aceita pelo WhatsApp | Substitui "envio de orçamento de procedimento" |
| **P2** | **Documentos do cliente** — upload leve (procuração, RG, contrato de honorários assinado) na ficha | Não vira gestão documental, mas precisa do mínimo |
| **P3** | **Alerta simples de prazo** — sócio anota prazo manualmente, plataforma avisa X dias antes | Não substitui controle de prazo do ProJuris; é um "nudge" leve |
| **P3** | **Consulta CNJ/Datajud** — cole o número do processo, plataforma busca dados públicos básicos | Útil pra ficha do caso; opcional |
| **P3** | **Geração de contrato de honorários (PDF)** com dados da ficha | Reduz fricção; assinatura digital fica pra parceiro |

### E. Métricas — adaptação das 6 abas
| Aba | MedicinaMKT | Nexla Adv |
|---|---|---|
| Visão geral | Faturamento, agendamentos, IA atende | Honorários recebidos, atendimentos agendados, IA atende |
| Atendimento | Tempo médio resposta, % IA, % humano | (igual) |
| Equipe | Secretária mais produtiva, médico mais agendado | Recepcionista mais produtiva, sócio que mais recebeu casos |
| Agenda | Ocupação por médico, cancelamentos | Ocupação por sócio, audiências marcadas, cancelamentos |
| Financeiro | Faturamento por procedimento × convênio | Honorários por área de atuação × forma de honorário |
| Leads | Origem do paciente, conversão | Origem do cliente, conversão por área |

---

## Schema sugerido — banco novo (Supabase)

Modelo enxuto pra MVP P1. Multi-tenant via `company_id` em quase tudo (mantém padrão atual). Marcado como **NEW** o que não existe no schema MedicinaMKT, **KEEP** o que vem igual, **RENAME** o que muda nome/colunas.

```
companies                          KEEP  (escritórios — antes "clínicas")
  id, name, plan, status, created_at, ...

users                              KEEP  (advogados/secretárias — adicionar campo OAB)
  id, company_id, name, email, role (admin/operator/viewer), oab_number NEW, ...

practice_areas                     NEW   (cível, trabalhista, criminal, ...)
  id, name, slug, color

user_practice_areas                NEW   (advogado X área — N:N)
  user_id, practice_area_id

clients                            RENAME  (era "patients")
  id, company_id, type ('PF'|'PJ') NEW, name, document (CPF|CNPJ),
  phone, email, status, source NEW (Google/Instagram/indicação/outro),
  primary_practice_area_id NEW, notes, created_at

client_documents                   NEW
  id, client_id, kind (procuração/RG/contrato/...), file_url, uploaded_at

cases                              NEW   (caso/processo de um cliente)
  id, client_id, practice_area_id, lead_assigned_user_id,
  status (lead_frio/lead_quente/proposta/contrato/em_andamento/encerrado/perdido),
  case_number NEW (CNJ — opcional), title, description,
  created_at, closed_at

services                           RENAME  (era "procedures" — agora "serviços jurídicos")
  id, company_id, name, default_fee_type (avulso/fixo/êxito/partido),
  base_value, practice_area_id NEW

fee_models                         NEW   (substitui "convênios")
  id, company_id, kind (avulso/fixo_mensal/exito/partido),
  description, default_percent (pra êxito)

case_fees                          NEW   (honorários combinados em um caso)
  id, case_id, service_id, fee_model_id, value, status

appointments                       KEEP+EXTEND  (renomear se preferir "events")
  id, company_id, client_id, case_id NEW, user_id (advogado),
  type NEW (primeira_consulta/reuniao/audiencia/prazo),
  court NEW (vara/juízo — só pra audiência), process_number NEW,
  starts_at, ends_at, status

forensic_calendar                  NEW   (feriados/recessos forenses pré-carregados)
  id, date, label, applies_to (federal/estadual/municipal)

conversations / messages / instances / tickets    KEEP  (centralização — sem mudança)

ai_guardrails_events               NEW   (log de quando IA bloqueou ação contra OAB)
  id, company_id, conversation_id, blocked_action, reason, at
```

> Observação: pode-se manter as tabelas core de mensagens/IA (`conversations`, `messages`, `instances`, `tickets`) idênticas ao MedicinaMKT — elas são genéricas. O ganho do banco novo é começar limpo, sem `procedures` médicos, `convenios` etc.

---

## Pendências (o que falta confirmar/preencher)

### Para fechar V2 do contexto
- [ ] **Tagline definitiva** — escolher 1 das 5 opções acima (ou pedir variações)
- [ ] **Validação OAB / Provimento 205** — copy passar por advogado consultivo antes de subir landing (palavras como "captação" são sensíveis)

### Para fechar escopo de features
- [ ] Confirmar lista P1/P2/P3 acima — tirar/adicionar features
- [ ] Confirmar entidades do schema novo (clients, cases, practice_areas, services, fee_models)

### Conteúdo (pode preencher depois)
- [ ] **Escritórios piloto** — substituir mocks (Saúde Total, Novolar, Pet Shop) por escritórios jurídicos reais
- [ ] **Testimonials reais** — 1-3 frases de sócios piloto
- [ ] **Métricas atuais** — quantos escritórios pagantes, MRR, distribuição por plano
- [ ] **Meta de negócio** — número-alvo nos próximos 6 meses
- [ ] **Stats da landing (3.2x, 68%, etc)** — re-medir no piloto jurídico ou suavizar copy
