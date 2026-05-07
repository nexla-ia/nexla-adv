import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, ArrowUpRight, ChevronRight, Plus, Check, Menu, X,
  Bot, Calendar, Video, Building2,
  Target, GitBranch, ShieldAlert, Eye, FolderOpen, Award,
  Lock, ShieldCheck, BadgeCheck,
} from 'lucide-react'
import BrandMark from '../components/BrandMark'
import './Landing.css'

/* ═══════════════════════════════════════════════════════════════════════════
   Section components — declarados localmente pra manter um arquivo só
   coeso, sem perder organização.
   ═══════════════════════════════════════════════════════════════════════════ */

function Eyebrow({ children }) {
  return <div className="lp-hero-eyebrow">{children}</div>
}

function SectionHead({ num, tag, title, subtitle, id }) {
  return (
    <header className="lp-section-head" id={id}>
      <div className="lp-section-head-left">
        <div className="lp-section-head-num">{num}</div>
        <div className="lp-section-head-tag">{tag}</div>
      </div>
      <div>
        <h2 dangerouslySetInnerHTML={{ __html: title }} />
        {subtitle && <p>{subtitle}</p>}
      </div>
    </header>
  )
}

/* ─── HERO ─────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="lp-hero">
      <div className="container">
        <div className="lp-hero-grid">
          <div className="lp-hero-left">
            <Eyebrow>Pra advogados · Pra escritórios · Pra bancas inteiras</Eyebrow>
            <h1>
              Seu escritório merece
              <br />
              responder <em>24/7</em>
              <br />
              — sem você responder.
            </h1>
            <p className="lp-hero-sub">
              Pare de perder cliente no WhatsApp. Pare de pagar anúncio sem saber se trouxe contrato.
              Comece agora — sem cartão de crédito.
            </p>
            <div className="lp-hero-ctas">
              <a href="#planos" className="lp-btn-primary">
                Experimentar grátis <ArrowRight size={18} />
              </a>
              <a href="#contato" className="lp-btn-secondary">
                Falar com humano <ArrowUpRight size={18} />
              </a>
            </div>
            <div className="lp-hero-foot">
              <ShieldCheck size={18} />
              <span>Garantia de 30 dias · Setup em 24h · LGPD &amp; sigilo profissional</span>
            </div>
          </div>

          <div className="lp-hero-right">
            <article className="lp-dossier-card" aria-label="Demonstração: ficha de cliente">
              <span className="lp-dossier-stamp">Demo · Conforme OAB</span>
              <div className="lp-dossier-head">
                <span className="lp-dossier-title">Dossiê Nº 0042 / 2026</span>
                <span className="lp-dossier-meta">Recebido 02:14 BRT</span>
              </div>
              <div className="lp-dossier-row">
                <strong>Cliente em prospecção</strong>
                <span>Helena B.</span>
              </div>
              <div className="lp-dossier-row">
                <strong>Triagem da Sofia</strong>
                <span>Trabalhista</span>
              </div>
              <div className="lp-dossier-row">
                <strong>Origem do contato</strong>
                <span>Meta Ads · Campanha 04</span>
              </div>
              <div className="lp-dossier-row">
                <strong>Conflito de interesse</strong>
                <span className="ok">Sem ocorrência</span>
              </div>
              <div className="lp-dossier-row">
                <strong>Ação proposta</strong>
                <span>Reunião · Dr.ª Maria · qua 14h</span>
              </div>
              <div className="lp-dossier-row">
                <strong>Status</strong>
                <span className="alert">Aguardando confirmação</span>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── METRICS ──────────────────────────────────────────────────────────── */
function Metrics() {
  const items = [
    { num: '80%',     label: 'Mensagens respondidas pela IA' },
    { num: <>&lt;<em>2</em>min</>, label: 'Tempo médio de resposta' },
    { num: '24/7',    label: 'IA atendendo seus clientes' },
    { num: '+0',      label: 'Contratações novas mesmo crescendo' },
  ]
  return (
    <section className="lp-metrics">
      <div className="container">
        <div className="lp-metrics-grid">
          {items.map((m, i) => (
            <div key={i} className="lp-metric">
              <div className="lp-metric-num">{m.num}</div>
              <div className="lp-metric-label">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── PROFILES ─────────────────────────────────────────────────────────── */
function Profiles() {
  const profiles = [
    {
      n: '01',
      title: 'Trabalha sozinho ou com poucos sócios',
      body: 'Não tem secretária dedicada. Cada mensagem no WhatsApp tira você do que importa: produzir petição, advogar, ir pra audiência. Você cobra R$ 300/h advogando — e gasta esse tempo respondendo "qual o valor da consulta?".',
    },
    {
      n: '02',
      title: 'Quer crescer mas tem medo de afogar',
      body: 'Pensou em tráfego pago, mas calculou: se vier 50 leads/dia, você não dá conta. Trava no crescimento por falta de operação.',
    },
    {
      n: '03',
      title: 'Cliente ativo também consome tempo',
      body: '"Doutor, quanto eu devo?", "Doutor, qual o status?". Pergunta repetida toda semana, do mesmo cliente. Multiplica por 30 clientes ativos.',
    },
    {
      n: '04',
      title: 'Quer controle, não só ferramenta',
      body: 'Métrica de cada advogado, taxa de reunião realizada, atribuição de marketing. Decisão por dado, não achismo.',
    },
  ]
  return (
    <section className="lp-section" id="para-quem">
      <div className="container">
        <SectionHead
          num="I."
          tag="Pra quem é"
          title="Se você se reconhece <em>aqui</em>, a gente foi feito pra você."
        />
        <div className="lp-profiles-grid" data-reveal>
          {profiles.map((p) => (
            <article key={p.n} className="lp-profile">
              <div className="lp-profile-num">{p.n} · Perfil</div>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── FEATURES ─────────────────────────────────────────────────────────── */
function Features() {
  return (
    <section className="lp-section" id="recursos">
      <div className="container">
        <SectionHead
          num="II."
          tag="O que faz"
          title="Captação <em>inbound</em>, triagem assistida e organização que cabe num escritório de advocacia."
          subtitle="Cada peça desenhada respeitando OAB, sigilo profissional e o ritmo de quem já trabalha de toga."
        />

        <div className="lp-features" data-reveal>
          {/* Sofia — bloco grande */}
          <article className="lp-feature lp-feature-sofia lp-feat-span-7">
            <div>
              <div className="lp-feature-marker">
                <span className="lp-feature-marker-icon"><Bot size={18} strokeWidth={1.6} /></span>
                <span className="lp-feature-marker-num">II.A · Sofia, IA atendente</span>
              </div>
              <h3>Atende 24/7. <em>Nunca</em> dá parecer.</h3>
              <p>
                Sofia recebe a mensagem, entende o caso, classifica por área do direito,
                marca a reunião com o sócio certo e chama você só quando precisa.
                Tem guardrails embutidos: nunca dá parecer jurídico, nunca promete resultado,
                nunca pratica captação ativa.
              </p>
            </div>
            <div>
              <div className="lp-sofia-quote">
                Eu não posso te dar orientação jurídica — isso só o(a) Dr(a). pode fazer
                numa análise pessoal do seu caso. Posso te ajudar a marcar uma conversa?
              </div>
              <div className="lp-sofia-attr">— Sofia · resposta padrão · log auditável</div>
            </div>
          </article>

          {/* Agenda multi-target — destaque */}
          <article className="lp-feature lp-feature-agenda lp-feat-span-5">
            <div className="lp-feature-marker">
              <span className="lp-feature-marker-icon"><Calendar size={18} strokeWidth={1.6} /></span>
              <span className="lp-feature-marker-num">II.B · Agenda integrada</span>
            </div>
            <h3>Marca direto na <em>sua</em> agenda — onde ela já está.</h3>
            <p>
              Cada advogado escolhe o seu calendário. A Sofia respeita a escolha e marca direto.
              Sem migração, sem ferramenta a mais.
            </p>
            <div className="lp-agenda-grid">
              <div className="lp-agenda-tile">
                <span className="lp-agenda-tile-icon"><Video size={28} strokeWidth={1.5} /></span>
                <strong>Microsoft Teams</strong>
                <small>Reuniões corporativas</small>
              </div>
              <div className="lp-agenda-tile">
                <span className="lp-agenda-tile-icon"><Calendar size={28} strokeWidth={1.5} /></span>
                <strong>Google Calendar</strong>
                <small>Integra ao Workspace</small>
              </div>
              <div className="lp-agenda-tile">
                <span className="lp-agenda-tile-icon"><Building2 size={28} strokeWidth={1.5} /></span>
                <strong>NexlaAdv</strong>
                <small>Agenda interna</small>
              </div>
            </div>
          </article>

          {/* Atribuição */}
          <article className="lp-feature lp-feat-span-4">
            <div className="lp-feature-marker">
              <span className="lp-feature-marker-icon"><Target size={18} strokeWidth={1.6} /></span>
              <span className="lp-feature-marker-num">II.C</span>
            </div>
            <h3>Atribuição completa do funil</h3>
            <p>
              Clique no anúncio → mensagem → IA qualificou → reunião → contrato. Você sabe qual ad
              do Meta ou campanha do Google trouxe cliente — não precisa adivinhar.
            </p>
          </article>

          {/* Distribuição */}
          <article className="lp-feature lp-feat-span-4">
            <div className="lp-feature-marker">
              <span className="lp-feature-marker-icon"><GitBranch size={18} strokeWidth={1.6} /></span>
              <span className="lp-feature-marker-num">II.D</span>
            </div>
            <h3>Distribuição por área e round-robin</h3>
            <p>
              Triagem da Sofia identifica a área e roteia pro especialista da banca. Sócio A não
              esquece de passar pro sócio B. Mensagem dupla acabou.
            </p>
          </article>

          {/* Conflito */}
          <article className="lp-feature lp-feat-span-4">
            <div className="lp-feature-marker">
              <span className="lp-feature-marker-icon"><ShieldAlert size={18} strokeWidth={1.6} /></span>
              <span className="lp-feature-marker-num">II.E</span>
            </div>
            <h3>Alerta de conflito de interesse</h3>
            <p>
              Antes da primeira reunião, o sistema verifica se a parte contrária já é cliente do
              escritório. Obrigação ética cumprida sem trabalho extra.
            </p>
          </article>

          {/* Modo confidencial */}
          <article className="lp-feature lp-feat-span-6">
            <div className="lp-feature-marker">
              <span className="lp-feature-marker-icon"><Eye size={18} strokeWidth={1.6} /></span>
              <span className="lp-feature-marker-num">II.F</span>
            </div>
            <h3>Modo confidencial entre sócios</h3>
            <p>
              Casos sensíveis ficam visíveis só para os sócios autorizados. Sigilo profissional
              cumprido <em>dentro</em> do próprio escritório, conforme art. 7º do Estatuto.
            </p>
          </article>

          {/* Pasta do cliente */}
          <article className="lp-feature lp-feat-span-6">
            <div className="lp-feature-marker">
              <span className="lp-feature-marker-icon"><FolderOpen size={18} strokeWidth={1.6} /></span>
              <span className="lp-feature-marker-num">II.G</span>
            </div>
            <h3>Pasta única do cliente</h3>
            <p>
              Múltiplos casos, contratos e conversas do mesmo cliente — agrupados numa pasta. Quem
              atende ele amanhã enxerga o histórico inteiro.
            </p>
          </article>

          {/* Validado em campo */}
          <article className="lp-feature lp-feat-span-12" style={{ borderRight: 'none' }}>
            <div className="lp-feature-marker">
              <span className="lp-feature-marker-icon"><Award size={18} strokeWidth={1.6} /></span>
              <span className="lp-feature-marker-num">II.H · Procedência</span>
            </div>
            <h3>Validado em campo, antes de virar produto.</h3>
            <p>
              A Nexla já entrega IA atendente para escritórios reais via projeto sob medida há mais de um ano.
              O NexlaAdv é a transformação dessa entrega em plataforma autosserviço, mensurável e gerenciável —
              sem você precisar pagar projeto sob medida pra ter o mesmo aparato.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}

/* ─── TRUST ────────────────────────────────────────────────────────────── */
function TrustStrip() {
  return (
    <section className="lp-trust" aria-label="Conformidade e sigilo">
      <div className="container">
        <div className="lp-trust-grid">
          <div className="lp-trust-cell">
            <span className="lp-trust-icon"><BadgeCheck size={22} strokeWidth={1.6} /></span>
            <div>
              <h4>Conforme Provimento 205/2021<sup>¹</sup></h4>
              <p>
                Sofia nunca dá parecer, nunca promete resultado. Sistema só inbound — nada de
                captação ativa ou disparo proibido.
              </p>
            </div>
          </div>
          <div className="lp-trust-cell">
            <span className="lp-trust-icon"><Lock size={22} strokeWidth={1.6} /></span>
            <div>
              <h4>Sigilo profissional reforçado<sup>²</sup></h4>
              <p>
                API de IA com retenção zero de dados. Modo confidencial entre sócios.
                Tratamento documentado em contrato.
              </p>
            </div>
          </div>
          <div className="lp-trust-cell">
            <span className="lp-trust-icon"><ShieldCheck size={22} strokeWidth={1.6} /></span>
            <div>
              <h4>LGPD &amp; auditoria</h4>
              <p>
                Toda decisão da Sofia é logada. Seu DPO consegue auditar bloqueios éticos
                a qualquer momento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── PRICING ──────────────────────────────────────────────────────────── */
function Pricing() {
  return (
    <section className="lp-section" id="planos">
      <div className="container">
        <SectionHead
          num="IV."
          tag="Planos"
          title="Do advogado solo à <em>banca inteira</em>."
          subtitle="Sem cobrança por mensagem. Sem fidelidade. Cancele quando quiser. 30 dias de garantia."
        />

        <div className="lp-pricing-grid" data-reveal>
          {/* Solo */}
          <article className="lp-plan">
            <div className="lp-plan-eyebrow">Plano · Solo</div>
            <h3>Solo</h3>
            <p className="lp-plan-pitch">Pra advogado solo ou autônomo (até 2 advogados).</p>
            <div className="lp-plan-price">
              <span className="lp-plan-price-cents">R$</span>
              <strong>247</strong>
              <small>/ mês</small>
            </div>
            <ul>
              <li><Check size={16} strokeWidth={2} /> Até 2 advogados cadastrados, 3 usuários</li>
              <li><Check size={16} strokeWidth={2} /> WhatsApp + Sofia 24/7</li>
              <li><Check size={16} strokeWidth={2} /> Triagem automática por área do direito</li>
              <li><Check size={16} strokeWidth={2} /> Ficha do cliente + alerta de conflito</li>
              <li><Check size={16} strokeWidth={2} /> Atribuição de origem (UTM básico)</li>
              <li><Check size={16} strokeWidth={2} /> 1 instância · 1 agenda · Kanban</li>
            </ul>
            <a href="#contato" className="lp-plan-cta">Experimentar grátis <ArrowRight size={16} /></a>
          </article>

          {/* Banca — featured */}
          <article className="lp-plan lp-plan-featured">
            <span className="lp-plan-tag">Mais escolhido</span>
            <div className="lp-plan-eyebrow">Plano · Banca</div>
            <h3>Banca</h3>
            <p className="lp-plan-pitch">Pra escritório pequeno societário (até 8 advogados).</p>
            <div className="lp-plan-price">
              <span className="lp-plan-price-cents">R$</span>
              <strong>597</strong>
              <small>/ mês</small>
            </div>
            <ul>
              <li><Check size={16} strokeWidth={2} /> Até 8 advogados, 15 usuários</li>
              <li><Check size={16} strokeWidth={2} /> Tudo do Solo, mais:</li>
              <li><Check size={16} strokeWidth={2} /> Instagram Direct unificado com WhatsApp</li>
              <li><Check size={16} strokeWidth={2} /> Atribuição completa (UTM + Meta)</li>
              <li><Check size={16} strokeWidth={2} /> Distribuição automática round-robin</li>
              <li><Check size={16} strokeWidth={2} /> Modo confidencial entre sócios</li>
              <li><Check size={16} strokeWidth={2} /> Pasta do cliente (múltiplos casos)</li>
              <li><Check size={16} strokeWidth={2} /> Métricas por advogado e por área</li>
              <li><Check size={16} strokeWidth={2} /> Lembretes de reunião (HSM)</li>
            </ul>
            <a href="#contato" className="lp-plan-cta">Experimentar grátis <ArrowRight size={16} /></a>
          </article>

          {/* Custom */}
          <article className="lp-plan">
            <div className="lp-plan-eyebrow">Plano · Custom</div>
            <h3>Custom</h3>
            <p className="lp-plan-pitch">Pra escritórios médios e grandes, redes ou casos especiais (acima de 8 advogados).</p>
            <div className="lp-plan-price">
              <span className="lp-plan-price-cents" style={{ fontSize: '0.9rem', letterSpacing: '0.1em' }}>SOB</span>
              <strong style={{ fontSize: '2.4rem' }}>consulta</strong>
            </div>
            <ul>
              <li><Check size={16} strokeWidth={2} /> Tudo do Banca, mais:</li>
              <li><Check size={16} strokeWidth={2} /> Multi-filial e correspondentes</li>
              <li><Check size={16} strokeWidth={2} /> SLA dedicado &amp; suporte prioritário</li>
              <li><Check size={16} strokeWidth={2} /> Modelo de IA on-premise opcional</li>
              <li><Check size={16} strokeWidth={2} /> Integrações sob medida (PJe / e-SAJ / CNJ Datajud)</li>
              <li><Check size={16} strokeWidth={2} /> Onboarding assistido por equipe Nexla</li>
              <li><Check size={16} strokeWidth={2} /> Cláusulas contratuais customizadas</li>
            </ul>
            <a href="#contato" className="lp-plan-cta">Falar com vendas <ArrowUpRight size={16} /></a>
          </article>
        </div>

        <p className="lp-pricing-foot">
          Os valores cobrem a plataforma — instâncias de WhatsApp/Instagram seguem regras das próprias APIs Meta.
          Pricing publicado em maio/2026, revisado periodicamente.
        </p>
      </div>
    </section>
  )
}

/* ─── FAQ ──────────────────────────────────────────────────────────────── */
function FAQ() {
  const items = [
    {
      q: 'Já uso Astrea, ADVBOX ou outro CRM jurídico — faz sentido somar?',
      a: 'Sim, e é exatamente o ponto: esses sistemas cuidam do cliente DEPOIS que vira processo (peticionamento, prazos, audiências). NexlaAdv cuida ANTES — captação, triagem, primeira consulta, atribuição de marketing. Não competem. A maioria dos nossos clientes usa os dois, em frentes diferentes.',
    },
    {
      q: 'A IA não vai dar parecer e me dar problema na OAB?',
      a: 'A Sofia tem guardrails embutidos no prompt: nunca dá parecer jurídico, nunca informa prazo prescricional, nunca recomenda estratégia, nunca promete resultado. Sempre redireciona dúvida jurídica pro advogado humano e diz expressamente que não substitui orientação. Tudo logado e auditável. O sistema também é só inbound — nada de captação ativa proibida pelo Provimento 205/2021.',
    },
    {
      q: 'Meus sócios resistem a tecnologia. Dá pra implantar mesmo assim?',
      a: 'Setup em 24 horas, treinamento dos sócios e da recepção em 1-2 horas, e os primeiros 30 dias têm garantia integral. A maior parte da operação não muda — a IA absorve as mensagens repetitivas e o sócio só recebe o que precisa de atenção humana. Quem ganha tempo desde a primeira semana costuma virar o maior defensor interno.',
    },
    {
      q: 'R$ 597 é caro?',
      a: 'É menos da metade de uma secretária terceirizada (R$ 1.500-2.500/mês), e a Sofia atende 24/7 — inclusive de madrugada e em recesso forense, quando o lead chega do anúncio que você pagou. Em 8 advogados, sai R$ 75 por advogado/mês. Um único contrato fechado paga o ano.',
    },
    {
      q: 'Como funciona o sigilo dos logs da IA?',
      a: 'Trabalhamos com APIs configuradas com retenção zero de dados (data_retention=0 na OpenAI ou Azure OpenAI), o que significa que o provedor não retém o conteúdo das conversas. No plano Custom, oferecemos modelo on-premise pra quem quer total isolamento. Tudo isso vai documentado no contrato — incluindo cláusula específica sobre tratamento de dados sob a LGPD e o art. 7º do Estatuto da Advocacia.',
    },
    {
      q: 'É complicado migrar pra cá?',
      a: 'Não. Cadastrar advogados, áreas de atuação e tabela de honorários leva 1-2 horas. A integração com WhatsApp é via Evolution API (mantemos seu número), e Instagram via API oficial Meta. Nosso onboarding faz o setup completo em 24 horas, com você acompanhando.',
    },
  ]
  const [open, setOpen] = useState(0)
  return (
    <section className="lp-section" id="duvidas">
      <div className="container">
        <SectionHead
          num="V."
          tag="Dúvidas"
          title="Perguntas que sempre <em>chegam</em>."
        />
        <div className="lp-faq-list" data-reveal>
          {items.map((it, i) => (
            <div key={i} className={`lp-faq-item ${open === i ? 'open' : ''}`}>
              <button
                className="lp-faq-trigger"
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
              >
                <span>{it.q}</span>
                <span className="lp-faq-trigger-icon" aria-hidden="true">
                  <Plus size={16} strokeWidth={2} />
                </span>
              </button>
              <div className="lp-faq-answer">{it.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── FINAL CTA ────────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="lp-final" id="contato">
      <div className="container">
        <div className="lp-final-tag">Capítulo seguinte</div>
        <h2>
          Sua IA já economiza horas. Agora é hora de saber <em>o quanto</em>.
        </h2>
        <div className="lp-final-ctas">
          <a href="#planos" className="lp-btn-primary">
            Experimentar grátis <ArrowRight size={18} />
          </a>
          <a href="#contato" className="lp-btn-secondary">
            Ver demo de 20 min <ArrowUpRight size={18} />
          </a>
        </div>
      </div>
    </section>
  )
}

/* ─── FOOTER ───────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="lp-footer">
      <div className="container">
        <div className="lp-footer-grid">
          <div className="lp-footer-brand">
            <Link to="/" className="lp-brand">
              <BrandMark size={28} color="#F4EFE6" strokeWidth={1.4} />
              <span className="lp-brand-text" style={{ color: '#F4EFE6' }}>
                Nexla<em>Adv</em>
              </span>
            </Link>
            <p>
              Atendimento e captação inbound para escritórios de advocacia.
              Um produto Nexla Automação e IA.
            </p>
          </div>

          <div>
            <h5>Produto</h5>
            <ul>
              <li><a href="#recursos">Recursos</a></li>
              <li><a href="#como-funciona">Como funciona</a></li>
              <li><a href="#planos">Planos</a></li>
              <li><a href="#duvidas">Dúvidas</a></li>
            </ul>
          </div>

          <div>
            <h5>Conta</h5>
            <ul>
              <li><Link to="/login">Acessar</Link></li>
              <li><a href="#contato">Falar com humano</a></li>
              <li><a href="#contato">Marcar demo</a></li>
            </ul>
          </div>

          <div>
            <h5>Jurídico</h5>
            <ul>
              <li><a href="#">Termos de uso</a></li>
              <li><a href="#">Política de privacidade</a></li>
              <li><a href="#">LGPD &amp; sigilo</a></li>
              <li><a href="#">Provimento 205/2021</a></li>
            </ul>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <span>© 2026 Nexla Automação e IA · NexlaAdv™</span>
          <span>Documento vivo · revisão Maio/2026</span>
        </div>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function Landing() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Bloqueia scroll do body quando menu mobile aberto
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // Reveal on scroll
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const els = (rootRef.current ?? document).querySelectorAll('[data-reveal]')
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  function closeMobile() { setMobileOpen(false) }

  return (
    <div className="lp" ref={rootRef}>
      {/* NAV */}
      <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <Link to="/" className="lp-brand" onClick={closeMobile}>
            <div className="lp-brand-mark">
              <BrandMark size={30} color="#14110F" strokeWidth={1.4} />
            </div>
            <span className="lp-brand-text">
              Nexla<em>Adv</em>
            </span>
          </Link>

          <div className="lp-nav-links">
            <a href="#para-quem">Pra quem é</a>
            <a href="#recursos">Recursos</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#planos">Planos</a>
            <a href="#duvidas">Dúvidas</a>
          </div>

          <div className="lp-nav-cta">
            <Link to="/login" className="lp-btn-ghost-sm">Acessar</Link>
            <a href="#planos" className="lp-btn-primary-sm">
              Experimentar <ArrowRight size={14} />
            </a>
          </div>

          <button
            className="lp-nav-burger"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className={`lp-mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <div className="lp-mobile-menu-inner">
          <a href="#para-quem"     onClick={closeMobile}>Pra quem é     <ChevronRight size={18} /></a>
          <a href="#recursos"      onClick={closeMobile}>Recursos       <ChevronRight size={18} /></a>
          <a href="#como-funciona" onClick={closeMobile}>Como funciona  <ChevronRight size={18} /></a>
          <a href="#planos"        onClick={closeMobile}>Planos         <ChevronRight size={18} /></a>
          <a href="#duvidas"       onClick={closeMobile}>Dúvidas        <ChevronRight size={18} /></a>

          <div className="lp-mobile-cta">
            <Link to="/login" className="lp-btn-secondary" onClick={closeMobile}>Acessar conta</Link>
            <a href="#planos" className="lp-btn-primary" onClick={closeMobile}>
              Experimentar grátis <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>

      <Hero />
      <Metrics />
      <Profiles />
      <Features />

      <section className="lp-section" style={{ paddingTop: 0 }}>
        <div className="container">
          <FunnelInline />
        </div>
      </section>

      <TrustStrip />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}

// Helper para renderizar a FunnelSection já dentro do container do <section>
function FunnelInline() {
  return (
    <>
      <SectionHead
        num="III."
        tag="Onde NexlaAdv atua"
        title="Cuidamos do <em>antes</em>. Seu CRM jurídico cuida do depois."
        subtitle="NexlaAdv é o front-office que captura e qualifica o lead até virar contrato. A gestão de processo, prazos e peticionamento continua na ferramenta jurídica que sua banca já confia."
      />

      <div className="lp-funnel-wrap" data-reveal>
        <header className="lp-funnel-header">
          <strong>Fluxo NexlaAdv · Pré-contratação</strong>
          <span>Domínio: captação inbound · qualificação · agendamento</span>
        </header>

        <div className="lp-funnel-flow">
          <div className="lp-funnel-step lp-funnel-step-mine">
            <span className="lp-funnel-step-num">I.</span>
            <h4>WhatsApp / Instagram</h4>
            <p>Cliente em prospecção chega pelo canal que já usa.</p>
          </div>
          <div className="lp-funnel-step lp-funnel-step-mine">
            <span className="lp-funnel-step-num">II.</span>
            <h4>Sofia tria</h4>
            <p>IA classifica por área, qualifica e identifica conflito.</p>
          </div>
          <div className="lp-funnel-step lp-funnel-step-mine">
            <span className="lp-funnel-step-num">III.</span>
            <h4>Agenda integrada</h4>
            <p>Marca em Teams, Google Calendar ou agenda interna.</p>
          </div>
          <div className="lp-funnel-step lp-funnel-step-mine">
            <span className="lp-funnel-step-num">IV.</span>
            <h4>Reunião realizada</h4>
            <p>Sócio recebe ficha completa antes do encontro.</p>
          </div>
          <div className="lp-funnel-step lp-funnel-step-mine">
            <span className="lp-funnel-step-num">V.</span>
            <h4>Contrato assinado</h4>
            <p>Cliente fechado. Atribuição registrada (qual ad / origem).</p>
          </div>

          <div className="lp-funnel-divider" aria-hidden="true">
            <span className="lp-funnel-divider-label">Fim do nosso domínio</span>
          </div>

          <div className="lp-funnel-step lp-funnel-step-other">
            <span className="lp-funnel-step-num">VI.</span>
            <h4>Gestão de processo</h4>
            <p>Seu CRM jurídico assume — peticionamento, prazos, audiência.</p>
          </div>
          <div className="lp-funnel-step lp-funnel-step-other">
            <span className="lp-funnel-step-num">VII.</span>
            <h4>Encerramento &amp; honorários</h4>
            <p>Acompanhamento e cobrança seguem na ferramenta jurídica.</p>
          </div>
        </div>

        <div className="lp-funnel-foot">
          <div>
            <strong>Não competimos com Astrea, ADVBOX, ProJuris.</strong>
            <p>Esses sistemas cuidam do cliente DEPOIS que ele virou processo. Nós trazemos o cliente até lá.</p>
          </div>
          <div>
            <strong>O que é PRÉ-contratação fica com a gente.</strong>
            <p>WhatsApp, Instagram, IA, triagem, agenda, atribuição de marketing, pasta do cliente, alerta de conflito.</p>
          </div>
        </div>
      </div>
    </>
  )
}
