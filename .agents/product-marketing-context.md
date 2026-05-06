# Product Marketing Context

*Last updated: 2026-05-06 · V1 auto-rascunhado para área jurídica (deriva do MedicinaMKT)*

> **Pivô em curso:** Este repositório (`nexla-adv`) era a base MedicinaMKT (saúde). Agora foi recortado para o público jurídico. O core de centralização de mensagens, IA 24/7, agenda, multi-tenant e métricas permanece. Funcionalidades atreladas a saúde (convênios, procedimentos médicos, ficha clínica/prontuário, validação procedimento×convênio) saem ou são reformuladas para o vocabulário jurídico.

## Product Overview
**One-liner:** A central de atendimento, agenda e gestão que seu escritório de advocacia precisa.
**What it does:** Unifica WhatsApp, Instagram e Digisac numa caixa única, atende clientes com IA 24/7, agenda audiências, reuniões e consultas com validação automática de conflitos, e mostra cada real que entra. Tudo num painel só, sem precisar planilha paralela.
**Product category:** Plataforma de atendimento e gestão para escritórios de advocacia (vertical legal).
**Product type:** SaaS multi-tenant.
**Business model:** Assinatura mensal por escritório, 3 planos (Starter / Pro / Business sob medida). Sem cobrança por mensagem. Cancela quando quiser. **[CONFIRMAR — manter R$297 / R$597 ou recalibrar para o setor jurídico, onde ticket médio costuma ser maior?]**
**Brand wordmark:** **[CONFIRMAR — sugestão "AdvogadosMKT" (paralelo a MedicinaMKT) ou "Nexla Adv"]** — tagline a definir (ex.: "Advocacia que não perde cliente no WhatsApp").

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
**Why customers choose us:** Substitui parcialmente secretária CLT por **[CONFIRMAR preço]**/mês, retornando o investimento em 30 dias com 1 caso fechado.

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
| Substitui secretária CLT | **[CONFIRMAR preço]** vs R$3.500/mês = ROI em <1 mês com 1 caso fechado |
| IA não-besta e em conformidade com OAB | Atende 24/7, fecha agendamento, nunca dá parecer jurídico — tudo auditável |
| Tudo num lugar | WhatsApp + Instagram + agenda + ficha + financeiro + métricas |

## Goals
**Business goal:** **[CONFIRMAR — meta de escritórios pagantes / MRR até quando?]**
**Conversion action:** Trial grátis (sem cartão) → ativação em 24h → conversão pra plano pago.
**Current metrics:** **[PREENCHER — quantos escritórios no piloto? MRR atual? Plano mais vendido?]**

---

## Pendências para você confirmar/preencher

### Críticas (bloqueiam landing/copy oficial)
1. **Brand wordmark** — "AdvogadosMKT", "Nexla Adv", "JurisMKT", outro?
2. **Tagline oficial** — equivalente jurídico de "Lucro e ética andam juntos"
3. **Pricing dos 3 planos** — manter R$297/R$597 ou recalibrar pra ticket jurídico?
4. **Validação OAB / Provimento 205** — copy precisa passar por advogado consultivo antes de ir ao ar (regras de publicidade são apertadas; usar termo "captação" pode ser problema)
5. **Escopo de features que saem** — confirmar lista (convênio, procedimento médico, prontuário, ficha clínica → o quê fica, o quê some, o quê é renomeado)

### Conteúdo (preencher quando tiver)
6. **Escritórios reais no piloto** — substituir mocks (Saúde Total, Novolar, Pet Shop) por escritórios jurídicos
7. **Testimonials reais** — 1-3 frases de sócios piloto
8. **Métricas atuais** — quantos escritórios pagantes, MRR, distribuição por plano
9. **Meta de negócio** — qual número você está perseguindo nos próximos 6 meses?
10. **Stats da landing (3.2x, 68%, etc)** — re-medir no piloto jurídico ou pegar mais leve no copy
11. **Foco de área de atuação** — generalista (qualquer advogado) ou nicho (cível/trabalhista/criminal/família/empresarial)?
