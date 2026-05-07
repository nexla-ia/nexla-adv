# Product Marketing Context

*Last updated: 2026-05-07 · V3 — fonte de verdade: nexlaadv-v1.pdf (06/05/2026)*

> **Status:** Brand, tagline, pricing, ICP e escopo v1 fechados. Esta V3 incorpora 2 deltas pedidos depois do PDF: (1) abrir ICP da landing pra escritórios médios/grandes (Custom sob consulta exposto na landing), (2) destacar integração de agenda em **Microsoft Teams**, **Google Calendar** ou **agenda interna do NexlaAdv** como diferencial visível.

---

## Product Overview
**One-liner:** O escritório responde 24/7 — sem você responder.
**What it does:** Plataforma de atendimento e captação para escritórios de advocacia que unifica WhatsApp e Instagram numa só inbox, com Sofia (IA atendente própria) que conversa, qualifica por área do direito, agenda reunião com o advogado certo (no Teams, Google Calendar ou agenda interna) e chama humano só quando precisa. Mostra o funil completo do clique no anúncio até o contrato — sem afogar a operação quando o tráfego cresce.
**Product category:** Atendimento e captação inbound para escritórios de advocacia (vertical legal, generalista). Pré-contratação. Não é CRM jurídico (não compete com Astrea/ADVBOX, que cuidam de gestão DEPOIS do cliente fechado).
**Product type:** SaaS multi-tenant.
**Business model:** Assinatura mensal por escritório, 3 planos:
- **Solo — R$ 247/mês** · até 2 advogados, 3 usuários, 1 instância WhatsApp
- **Banca — R$ 597/mês ⭐ mais escolhido** · até 8 advogados, 15 usuários, Instagram unificado, distribuição round-robin, modo confidencial entre sócios, métricas por advogado/área
- **Custom — sob consulta** · escritórios médios/grandes (>8 advogados), redes ou casos especiais. **Exposto na landing como "Sob consulta — fale com a gente"** (delta 1)

Garantia 30 dias · sem cobrança por mensagem · cancela quando quiser.

**Brand wordmark:** **NexlaAdv** (sem espaço, definitivo).
**Tagline-âncora:** *"O escritório responde 24/7 — sem você responder."*
Variação para hero: *"Seu escritório merece responder 24/7 — sem você responder."*
Posicionamento estendido: *"Sua IA já economiza horas. Agora é hora de saber o quanto — e crescer com previsibilidade."*

---

## Target Audience
**Target companies:**
- **Primário (v1, atendido pelos planos Solo/Banca):** advogado solo + escritório pequeno societário (1 a 8 advogados), generalista, com sócios dividindo áreas (cível, trabalhista, família, etc.). Receita típica R$ 30k a R$ 250k/mês de honorários. Sem secretária dedicada ou com 1 administrativa. Já tem WhatsApp Business. Alguns testaram tráfego pago e travaram.
- **Secundário (v1, atendido pelo Custom):** escritório médio (10-30 advogados) ou redes/grupos, que querem o mesmo aparato mas precisam de SLA, integração custom, modelo on-premise no LLM ou setup multi-filial mais robusto. **Exposto na landing como "Sob consulta — fale com a gente"** (delta 1).

**Decision-makers:** advogado-sócio (compra + champion + financial buyer), administrador/gestor de escritório (operacionaliza), recepcionista/secretária jurídica (usuário diário).

**Primary use case:** Não perder lead que chegou pelo WhatsApp/Instagram + roteá-lo pro sócio da área certa + medir o funil de captação (clique no ad → mensagem → IA qualificou → reunião → contrato), sem afogar a operação quando o tráfego crescer.

**Jobs to be done:**
- Atender 24/7 quem chama no WhatsApp/Instagram sem precisar contratar mais secretária
- Triar lead por área do direito e rotear pro sócio especialista (sem mensagem dupla, sem ownership confuso)
- Marcar reunião de 1ª consulta automaticamente — no **Teams, Google Calendar ou agenda interna do NexlaAdv** (delta 2)
- Saber qual ad/origem trouxe contrato (atribuição de marketing — UTM + Meta)
- Liberar o(a) sócio(a) das perguntas repetitivas de cliente já contratado (status do caso, valor do honorário pendente)

**Use cases específicos:**
- Pré-triagem por IA fora do horário comercial (madrugada, fins de semana, recesso forense)
- Substituir secretária terceirizada (R$ 1.500-2.500/mês) por uma fração do custo
- Recepção de bancas com filiais/correspondentes ver conversas e agendamentos de qualquer unidade
- Cadastrar ficha completa do cliente (PF: CPF/RG/profissão; PJ: CNPJ/representante) — campos de procuração + alerta de conflito de interesse
- Disparar follow-up automatizado com cliente que sumiu antes de assinar contrato de honorários

---

## Personas

### Os 4 perfis de "Pra quem é" (PDF — usados na landing)
| # | Perfil | Síntese |
|---|---|---|
| 01 | **Solo sobrecarregado** | Trabalha sozinho ou com poucos sócios, sem secretária dedicada. Cobra R$300/h advogando — e gasta esse tempo respondendo "qual o valor da consulta?" no WhatsApp. |
| 02 | **Quer crescer mas teme afogar** | Pensou em tráfego pago, mas calculou: se vier 50 leads/dia, não dá conta. Trava no crescimento por falta de operação. |
| 03 | **Cliente ativo também consome tempo** | "Doutor, qual o status?", "Doutor, quanto eu devo?". Pergunta repetida × 30 clientes ativos. |
| 04 | **Quer controle, não só ferramenta** | Quer métrica de cada advogado, taxa de reunião realizada, atribuição de marketing. Decisão por dado. |

### Personas de compra (B2B)
| Persona | Cares about | Challenge | Value we promise |
|---|---|---|---|
| Advogado-sócio (Champion + DM + Financial Buyer) | ROI, profissionalização, ter mais tempo pra contencioso | "WhatsApp do escritório me suga 2-3h/dia. Quero crescer mas com medo de afogar." | Operação digital de alta performance — IA atende 24/7, agenda sem erro, mostra qual área dá mais retorno |
| Administrador / gestor de escritório (User + Champion) | Eficiência da equipe, controle de prazos, menos retrabalho | Excel duplicado entre secretárias, follow-up cai por terra, audiência marcada em conflito | Inbox unificada + agenda integrada + métricas; tudo num lugar |
| Recepcionista / secretária jurídica (User) | Não apanhar do WhatsApp, não esquecer cliente, não confundir advogado | Mil conversas paralelas; cliente esperando enquanto outro liga | IA filtra/encerra os simples, encaminha os complexos com contexto |

---

## Problems & Pain Points
**Core problem:** Lead chega pelo WhatsApp depois de ver Google/Instagram e cai num atendimento humano lento, com horário comercial restrito, sócio sobrecarregado — escritório perde a primeira consulta e nem registra que perdeu. Quem investe em tráfego pago não consegue dimensionar, porque o gargalo é a operação, não o anúncio.

**Why alternatives fall short:**
- WhatsApp Business puro: não tem agenda, não tem IA, não tem métrica nem visão de funil de captação
- CRM jurídico tradicional (Astrea, ADVBOX, ProJuris, Legal One, Aurum): foca em prazos/peticionamento/pasta processual. WhatsApp é plug malfeito. Cuidam do cliente DEPOIS, não da captação ANTES.
- Planilha + Google Calendar + Drive: depende de disciplina humana. Sem IA. Sem multi-unidade.
- Contratar mais secretária: R$ 1.500-2.500/mês cada, escala linearmente, e ainda dorme à noite.
- Chatbots genéricos (Take, Blip): não falam vocabulário forense, não classificam por área, não integram com agenda.

**What it costs them:** Leads perdidos (1ª consulta paga R$ 300-1.500; cada caso fechado vale milhares em honorários), tempo de sócio retrabalhando, decisões de marketing no escuro ("será que aquele ad valeu R$1.500 que paguei?").

**Emotional tension:** *"Eu produzo melhor advogando. Mas o WhatsApp do escritório me suga 2 a 3 horas por dia respondendo coisas que qualquer um responderia."* + *"Quando penso em investir em tráfego pra crescer, calculo que se vier o triplo de mensagens eu paro de produzir. Então fico travado."*

---

## Competitive Landscape

**Direct (atendimento + captação inbound):**
- **WhatsApp Business + Google Calendar + Excel** → custa zero mas escala mal, sem IA, sem visão financeira/funil
- **Chatbots verticais não-jurídicos (Take, Blip, ManyChat custom)** → respondem mas não falam vocabulário forense, não distribuem por área, não integram com agenda

**Secondary (CRM jurídico — operam DEPOIS do cliente fechado, não na captação):**
- **Astrea, ADVBOX, ProJuris, Legal One, Aurum, CPJ-3C** → falham em WhatsApp/IA. Não competem direto: gestão de processo é ortogonal à captação. NexlaAdv é o front-office que falta.

**Indirect:**
- **Contratar mais secretárias / call center jurídico** → resolve volume mas custa caro, depende de pessoa estar lá, não tem dado, não dorme

---

## Differentiation
**Key differentiators (versão landing-ready):**
1. **Sofia, IA com guardrails OAB** — atende 24/7, classifica por área do direito, marca reunião, **mas NUNCA dá parecer e NUNCA promete resultado** (Provimento 205/2021).
2. **Agenda nas 3 ferramentas que o escritório já usa: Microsoft Teams, Google Calendar OU agenda interna NexlaAdv** (delta 2 — destacar). Cada advogado escolhe o seu; a IA marca direto.
3. **Atribuição completa do funil** (UTM + Meta) — clique no ad → mensagem → IA qualificou → reunião → contrato. Quem investe em tráfego sabe o que voltou.
4. **Distribuição automática por área e round-robin entre sócios** — acabou ownership confuso e mensagem dupla.
5. **Alerta de conflito de interesse** — verifica se a parte contrária já é cliente (obrigação ética OAB).
6. **Modo confidencial entre sócios** — sigilo em casos sensíveis dentro do escritório (Estatuto art. 7º).
7. **Pasta do cliente** — agrega múltiplos casos do mesmo cliente.
8. **Validado em campo pela Nexla** — IA atendente da Nexla já roda em escritórios reais; NexlaAdv é a transformação dessa entrega sob medida em produto autosserviço, mensurável e gerenciável.

**How we do it differently:** Nasce centrada na captação (WhatsApp + IA + atribuição), com agenda nativa em 3 ferramentas. Concorrentes nasceram como gestão de processo (peticionamento/prazo) e empurraram WhatsApp como afterthought.

**Why that's better:** O gargalo de quase todo escritório pequeno é captação, não gestão de processo. Atacamos onde dói.

**Why customers choose us:** Substitui parcialmente uma secretária CLT por uma fração do custo, retornando o investimento em 30 dias com 1 caso fechado. Com SLA de garantia 30 dias.

---

## Objections
| Objection | Response |
|---|---|
| "Já uso Astrea/ADVBOX" | Astrea cuida da gestão DEPOIS que vira cliente. NexlaAdv cuida ANTES (captação, triagem, atendimento). Não competem — complementam. |
| "Tô com receio da OAB" (Provimento 205) | Sofia tem guardrails embutidos: nunca dá parecer, nunca promete resultado, sempre encaminha caso consultivo pro advogado. Sistema só inbound (sem captação ativa). Tudo logado e auditável. |
| "Meus sócios não vão usar" | Onboarding com vocês juntos. 30 dias de garantia. Setup em 24h. |
| "R$ 597 é caro" | Secretária terceirizada custa R$ 1.500-2.500/mês. NexlaAdv atende 24/7 a R$ 597 — fração do custo, atendimento contínuo. |
| "Sigilo profissional / vazamento de logs da IA" | API com `data_retention=0` (OpenAI) ou Azure OpenAI. No plano Custom, modelo on-premise. Documentado em contrato. |
| "Parece complicado migrar" | Setup guiado em 24h. Cadastrar advogados, áreas e tabela de honorários leva 1-2h. |

**Anti-persona:**
- Banca grande full-service com TI próprio que quer dev custom + integração com PJe/e-SAJ desde o dia 1 (vamos atender, mas é Custom)
- Advogado autônomo sem volume (não justifica nem o Solo)
- Escritório que recusa qualquer automação ("cliente quer ouvir voz humana")
- Contencioso de massa de banco/seguradora (volume errado, modelo de operação diferente — fase 3)

---

## Switching Dynamics
**Push:** Secretária pediu demissão / saiu de licença / sobrecarregou. Lead reclamando que demora pra responder. Mês fechou e sócio não sabe quanto faturou nem por qual área. Audiência marcada em cima de outra. Investiu em ad sem saber se trouxe contrato.

**Pull:** "Eu queria que a IA atendesse de noite quando vem lead da Meta Ads" + "queria saber qual ad gerou contrato" + "queria parar de errar valor de honorário e marcar audiência em recesso forense".

**Habit:** Excel da agenda + grupo de WhatsApp da equipe + planilha financeira do contador + caderninho de prazos.

**Anxiety:** "E se a IA disser preço errado de honorário?" + "vai ferir a OAB?" + "minha equipe vai resistir?" + "vou ficar refém do sistema?" + "log da IA vaza sigilo do cliente?"

---

## Customer Language

**How they describe the problem (verbatim):**
- "Tô perdendo lead no WhatsApp"
- "Minha secretária não dá conta"
- "Não sei quanto o escritório faturou"
- "Não sei qual área tá dando mais retorno"
- "Investi R$2k em ad e não sei se voltou"
- "Sócio A vê primeiro, esquece de passar pro sócio B"
- "Eu produzo melhor advogando — não respondendo WhatsApp"

**How they describe us:**
- "É tipo um WhatsApp que faz a agenda sozinho"
- "Substitui meia secretária"
- "Mostra qual ad trouxe contrato"
- "Centraliza tudo num lugar só"

**Words to use:** atendimento, captação inbound, ficha do cliente, honorários, recepção, advogado, área de atuação, sócio, lucro, cliente, audiência, reunião, primeira consulta, conflito de interesse, pasta do cliente, sigilo, atribuição.

**Words to avoid:**
- ❌ "Captação ativa" / "encontre clientes pra você" → infringe OAB
- ❌ "Ganhe mais causas" / "+R$X em honorários" → promessa de resultado / mercantilização
- ❌ "Melhor que [concorrente]" → comparação direta é problema na OAB
- ❌ "Lead" no produto/UI (no marketing pode aparecer com cuidado — preferir "cliente em prospecção")
- ❌ MRR/SaaS/churn (jargão de tech)
- ❌ CRM (denota frieza)

**Glossary:**
| Term | Meaning |
|------|---------|
| Sofia | Nome da IA atendente do NexlaAdv |
| Recepção | Aba de conversas que IA filtrou, aguardando humano |
| Triagem | Classificação por área do direito feita pela Sofia |
| Áreas | Conjunto de áreas de atuação do escritório (cível, trabalhista, etc.) |
| Pasta do cliente | Vista única com todos os casos de um cliente |
| Modo confidencial | Caso só visível pra sócios autorizados |
| Disclaimer | Texto obrigatório que a Sofia repete: "não substituo orientação jurídica" |
| Honorário (avulso/fixo/êxito/partido) | 4 modelos de cobrança suportados |
| Atribuição | Vínculo origem-do-lead → contrato fechado |
| Recesso forense | 20/12 a 06/01 (CNJ Resolução 244/2016) |

---

## Brand Voice
**Tone:** Direto, conversacional, sem jargão de tech. Sóbrio onde precisa (advogado é cliente conservador), divertido onde dá (no copy de landing). Cuidado com tom mercantilista — OAB reprime publicidade exagerada.

**Style:** Frase curta. Exemplo concreto. Número quando possível. Sem emoji em produto (só na landing/comunicação, com parcimônia). Substantivo concreto > adjetivo vago.

**Personality:** Confiável · eficiente · pragmático · ético · anti-corporativês.

---

## Proof Points

**Métricas honestas para landing (substituem números aspiracionais):**
| Número | Texto |
|---|---|
| **80%** | Mensagens respondidas pela IA |
| **<2 min** | Tempo médio de resposta |
| **24/7** | IA atendendo seus clientes |
| **+0** | Contratações novas mesmo crescendo |

**Customers / case zero:** *[PREENCHER — advogado da rede Nexla que vai virar case zero no onboarding (mês 1 do roadmap)]*
**Testimonials:** *[PREENCHER — após mês 2 do roadmap, com 3 primeiros clientes]*

**Value themes:**
| Theme | Proof |
|---|---|
| IA economiza horas | 80% das mensagens respondidas sem o sócio entrar; <2min de resposta média |
| ROI em <1 mês | Solo R$ 247 vs secretária R$ 1.500-2.500; 1 caso fechado paga o ano |
| Escala sem afogar | Tráfego dobra → IA absorve; nenhuma contratação extra na operação |
| Conformidade OAB embutida | Sofia tem guardrails: sem parecer, sem promessa, sem captação ativa |
| Atribuição completa | Clique no ad → mensagem → IA → reunião → contrato; tudo rastreado |
| Agenda onde você já está | Teams, Google Calendar ou interna — escolha do escritório |

---

## Goals

**Business goal (90 dias — Mai/Jun/Jul 2026):**
- Mês 1 (Mai): produto ajustado + landing no ar + advogado da rede como case zero
- Mês 2 (Jun): outbound suave (30 escritórios em RO/cidades vizinhas), 3 demos/semana, 3 primeiros clientes pagantes
- Mês 3 (Jul): conta @nexlaadv no Instagram, parcerias com agências de marketing jurídico, Meta Ads experimentais (R$ 50/dia, 2 criativos)
- **Marco final:** 5-8 escritórios ativos, R$ 3-5k MRR

**Conversion action:** Trial grátis (sem cartão) → ativação em 24h → conversão pra plano pago após 30 dias de garantia.

**Current metrics:** zero — produto pré-lançamento.

---

## Camada regulatória — OAB (resumo prático para copy/produto)

**Provimento 205/2021 — publicidade jurídica:**
- ✅ Permitido: descrever serviços, mostrar área de atuação, ter site/landing institucional
- ❌ Proibido: prometer resultado · captação ativa (outbound) · comparação direta com concorrente · mercantilização do exercício profissional

**Estatuto da Advocacia art. 7º — sigilo profissional:**
- API com `data_retention=0` (OpenAI) ou Azure OpenAI; modelo on-premise no plano Custom
- Modo confidencial entre sócios
- Cláusula contratual de tratamento de dados

**Disclaimer obrigatório que a Sofia DIZ:**
> *"Eu não posso te dar orientação jurídica — isso só o(a) Dr(a). pode fazer numa análise pessoal do seu caso. Posso te ajudar a marcar uma conversa?"*

**Bandeiras vermelhas que NUNCA podem aparecer na landing/copy:**
- ❌ "Ganhe mais causas"
- ❌ "Melhor que [concorrente]"
- ❌ "Encontre clientes pra você"
- ❌ "+R$X em honorários" (mercantilização explícita)

✅ OK: foco em **eficiência operacional, organização, atribuição de marketing**.

---

## Escopo do produto v1 — alinhado com PDF

### A. Mantém (arquitetura intacta vs MedicinaMKT)
| Feature | Observação |
|---|---|
| Inbox unificado WhatsApp + Instagram | Mesma stack: Evolution API + n8n |
| IA atendente 24/7 | Mesmo padrão; prompt adaptado pra Sofia |
| Setores e roteamento | Renomeado: Recepção / Triagem / Áreas |
| Trava automática (ownership) | Idêntico |
| Atribuição de origem (UTM + Meta) | Idêntico |
| LGPD compliance | Mantém + camada de sigilo profissional |
| Multi-instância (filiais) | Idêntico |
| Métricas (6 abas) | Renomear nomenclatura |
| Kanban de conversas | Idêntico |

### B. Renomear (vocabulário, sem mudança funcional)
| MedicinaMKT | NexlaAdv |
|---|---|
| Paciente | Cliente |
| Médico | Advogado |
| Consulta | Atendimento / Reunião |
| Procedimento | Tipo de causa / Serviço jurídico |
| Recepção / Triagem / Médicos | Recepção / Triagem / Áreas |
| Ficha do paciente | Ficha do cliente |
| Faturamento por médico | Honorários por advogado |
| No-show | Reunião não realizada |
| Convênio | (removido) |
| CRM/especialidade médica | OAB / área de atuação |

### C. Remover (saúde-específico)
- Convênio + carteirinha (`insurance_plans`, `procedure_prices`, `saved_contacts.insurance_plan_id`/`insurance_card`)
- Antropometria (peso, altura, IMC, tipo sanguíneo)
- Alergias / crônicas / medicamentos / clinical_notes
- IA analisa laudos médicos
- Lembrete de consulta médica HSM (substituído por lembrete de reunião)

### D. Entrar novo (essenciais no v1)
| Feature | Por quê | Status no banco |
|---|---|---|
| **Triagem por área do direito** | IA classifica em Cível/Trabalhista/Família/etc. e roteia pro sócio | ✅ tabelas `practice_areas` + `user_practice_areas` aplicadas |
| **Avaliação de viabilidade do caso** | Filtra caso bom/ruim antes de gastar reunião | em produto (lógica IA) |
| **Qualificação completa do cliente** | Campos de procuração: CPF/CNPJ, RG, estado civil, profissão, etc. | ✅ `saved_contacts` extension (PF/PJ + source + practice_area) |
| **Pasta do cliente** | Agrega múltiplos casos do mesmo cliente | ✅ tabela `cases` aplicada |
| **Alerta de conflito de interesse** | Verifica se a parte contrária já é cliente (obrigação ética OAB) | em produto (lógica) |
| **Modo confidencial** | Sigilo entre sócios em casos sensíveis | em produto (flag em `cases`) |
| **Disclaimer de não-consulta jurídica** | IA NUNCA dá parecer | em prompt |
| **Guardrails OAB no prompt** | Filtra promessa de resultado, copy mercantilista, captação ativa | em prompt + log em `ai_guardrails_events` |
| **Calendário forense** | Bloquear/avisar audiência em recesso/feriado forense | ✅ tabela `forensic_calendar` aplicada (federal 2026-2027) |
| **Honorários (4 modelos)** | avulso, fixo_mensal, êxito, partido | ✅ tabela `fee_models` aplicada |
| **Status do caso (Kanban)** | Lead frio · Lead quente · Em proposta · Contrato assinado · Em andamento · Encerrado · Perdido | ✅ `cases.status` |
| **🆕 Integração de agenda multi-target (delta 2)** | Cada advogado escolhe: Microsoft Teams / Google Calendar / agenda interna NexlaAdv | ⚠️ **a implementar** — adicionar `users.calendar_provider` + `users.calendar_external_id` em migration futura |

### E. Roadmap (em breve — fora do v1)
- Integração CNJ Datajud (andamento processual)
- Geração de procuração e contrato de honorários (PDF auto-preenchido)
- Cobrança recorrente (honorários parcelados)
- Integração com PJe / eproc
- IA de elaboração de minutas

> **Regra crítica de escopo:** v1 é **PRÉ-CONTRATAÇÃO** e relacionamento. Captação, triagem, atendimento, organização. Pós-contratação (gestão de processo) é fase 2 — senão competimos com Astrea/ADVBOX que têm 10 anos de produto.

---

## Sofia — IA atendente

**Identidade:** atendente virtual do escritório. Recebe clientes via WhatsApp/Instagram, entende a demanda, qualifica por área do direito, marca reunião com o advogado. **Não é advogada e nunca dá orientação jurídica.**

**Regras absolutas:**
- NUNCA dar parecer jurídico ("você tem direito a…")
- NUNCA prometer resultado ("vamos ganhar")
- SEMPRE redirecionar dúvida jurídica pro advogado
- NUNCA falar de prazo prescricional, valor de causa, estratégia processual

**Fluxo de atendimento:** acolhimento → entender demanda → triagem leve (3-5 perguntas factuais) → qualificação de origem → identificação básica → agendamento → encerramento.

**Quando escala pra humano:** urgência criminal · cliente em crise emocional · cliente exige falar com advogado antes da triagem · caso já é cliente do escritório.

---

## Schema do banco — estado atual (V3)

Banco novo (`bnyaypxlypmqozilldmx.supabase.co`) está com 29 tabelas. Aplicado: baseline + 7 migrations aditivas de pivô jurídico.

**Tabelas jurídicas já aplicadas (P1):**
- `practice_areas` (8 áreas + outros) · `user_practice_areas` (N:N)
- `cases` (status: lead_frio → encerrado/perdido)
- `fee_models` (avulso/fixo_mensal/exito/partido)
- `forensic_calendar` (seed federal 2026-2027)
- `ai_guardrails_events` (log de bloqueios da Sofia)
- `saved_contacts` extension: type (PF/PJ), source, primary_practice_area_id
- `users` extension: oab_number
- `procedures` extension: practice_area_id, default_fee_model_id
- `appointments` extension: event_type, court, process_number, case_id

**Pendente (próxima migration sugerida — relacionada ao delta 2):**
- `users` ADD `calendar_provider` ('teams'|'google'|'interna')
- `users` ADD `calendar_external_id` (token/ID na ferramenta externa)
- Tabela auxiliar `calendar_oauth_tokens` (refresh tokens encriptados, se for OAuth)

**Tabelas de saúde a dropar quando React parar de usar (drop_health migration final):**
- `insurance_plans`, `procedure_prices`
- Colunas de `saved_contacts`: `allergies`, `chronic_conditions`, `medications`, `clinical_notes`, `blood_type`, `weight`, `height`, `insurance_plan_id`, `insurance_card`, `guardian_name`, `guardian_phone`

---

## Pendências (V3 → V4)

**Bloqueia landing pública:**
- [ ] Reservar domínio `nexlaadv.com.br`
- [ ] Validar copy final com advogado consultivo (Provimento 205) antes de subir
- [ ] Confirmar se o nome **Sofia** está disponível ou se há conflito com outro produto Nexla
- [ ] Confirmar se logo do MedicinaMKT vai ser reaproveitada com swap de wordmark ou nova arte

**Bloqueia delta 2 (integração calendário):**
- [ ] Decidir prioridade entre Teams / Google Calendar / interna — qual sai primeiro
- [ ] Migration `users.calendar_provider` + `calendar_external_id` + (talvez) tabela de tokens OAuth
- [ ] Cadastro Microsoft Azure AD (Teams) + Google Cloud Console (Calendar) com client_id/secret
- [ ] UI de "Conectar minha agenda" no perfil do advogado

**Conteúdo (preencher quando tiver):**
- [ ] Case zero: dados do escritório piloto da rede Nexla
- [ ] 1-3 testimonials (pós-mês 2 do roadmap)
- [ ] Métricas reais (vs as do landing 80%/<2min/24/7) após primeiros 30 dias rodando
