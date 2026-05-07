import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, ArrowUpRight, Sparkles, MessageSquare, Calendar, BarChart3,
  Users, Bot, Scale, Headset, Check, ChevronRight, ChevronLeft, Star, Zap, ShieldCheck,
  Phone, Mail, Activity, Clock, TrendingUp, Lock, FileText, Trash2, Server, Quote,
  Building2, Network, Wallet, Bot as BotIcon, Instagram, BookUser, Image as ImageIcon,
  ScanLine, FileSearch, Camera, Cake, Briefcase, MapPin, Gavel, Video, AlertTriangle, Pencil, Menu, X, ArrowRightLeft, Inbox,
  ShieldAlert, FolderOpen, Target, GitBranch,
} from 'lucide-react'
import BrandMark from '../components/BrandMark'
import './Landing.css'

const TESTIMONIALS = [
  {
    quote: 'Antes a gente perdia 3 ou 4 leads por dia só porque ninguém dava conta do WhatsApp à noite. Hoje a Sofia tria, marca a reunião e me chama só quando é caso especial. Mudou o jogo.',
    highlight: '3 ou 4 leads por dia',
    strong: 'Mudou o jogo.',
    authorName: 'Dr. Rafael Mendes',
    authorRole: 'Mendes Advocacia · Porto Velho',
    initials: 'RM',
  },
]

export default function Landing() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Bloqueia scroll do body quando menu mobile aberto
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  function closeMobile() { setMobileOpen(false) }

  return (
    <div className="lp">
      {/* NAV */}
      <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <Link to="/" className="lp-brand" onClick={closeMobile}>
            <div className="lp-brand-mark">
              <BrandMark size={32} color="#0F0E1B" strokeWidth={1.6} />
            </div>
            <span className="lp-brand-text">NexlaAdv</span>
          </Link>

          <div className="lp-nav-links">
            <a href="#recursos">Recursos</a>
            <a href="#atribuicao">Atribuição</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#para-quem">Pra quem é</a>
            <a href="#planos">Planos</a>
          </div>

          <div className="lp-nav-cta">
            <Link to="/login" className="lp-btn-ghost-sm">Acessar conta</Link>
            <a href="#planos" className="lp-btn-primary-sm">Começar agora <ArrowRight size={14} /></a>
          </div>

          <button
            className="lp-nav-burger"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      <div className={`lp-mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <div className="lp-mobile-menu-inner">
          <a href="#recursos" onClick={closeMobile}>Recursos <ChevronRight size={16} /></a>
          <a href="#atribuicao" onClick={closeMobile}>Atribuição <ChevronRight size={16} /></a>
          <a href="#como-funciona" onClick={closeMobile}>Como funciona <ChevronRight size={16} /></a>
          <a href="#para-quem" onClick={closeMobile}>Pra quem é <ChevronRight size={16} /></a>
          <a href="#planos" onClick={closeMobile}>Planos <ChevronRight size={16} /></a>
          <div className="lp-mobile-menu-actions">
            <Link to="/login" className="lp-btn-ghost-sm" onClick={closeMobile}>Acessar conta</Link>
            <a href="#planos" className="lp-btn-primary-sm" onClick={closeMobile}>Começar agora <ArrowRight size={14} /></a>
          </div>
        </div>
      </div>

      {/* HERO */}
      <header className="lp-hero">
        <div className="lp-hero-bg">
          <div className="lp-grain" />
          <div className="lp-hero-glow lp-glow-1" />
          <div className="lp-hero-glow lp-glow-2" />
        </div>

        <div className="lp-container">
          <div className="lp-hero-grid">
            <div className="lp-hero-left">
              <div className="lp-eyebrow">
                <span className="lp-pulse-dot" />
                Para advogados, escritórios e bancas inteiras
              </div>

              <h1 className="lp-h1">
                Seu escritório <span className="lp-h1-em">responde</span>
                <br />
                <span className="lp-h1-accent">24/7</span> — sem você responder.
                <br />
                WhatsApp, Instagram Direct e IA — numa só inbox.
              </h1>

              <p className="lp-hero-sub">
                Pare de perder cliente no WhatsApp.
                <strong> Sofia atende, qualifica e marca a reunião</strong> direto no
                Teams, Google Calendar ou agenda interna — você só vê o cliente
                que importa, com a ficha pronta.
              </p>

              <div className="lp-hero-actions">
                <a href="#planos" className="lp-btn-primary">
                  Experimentar grátis
                  <ArrowRight size={16} />
                </a>
                <a href="#como-funciona" className="lp-btn-ghost">
                  Como funciona
                  <ArrowRight size={16} />
                </a>
              </div>

              <p className="lp-microcopy">
                Sem cartão de crédito · Setup guiado em 24h · Cancele quando quiser
              </p>

              <div className="lp-hero-trust">
                <div className="lp-trust-item">
                  <ShieldCheck size={14} />
                  <span>LGPD Compliance</span>
                </div>
                <div className="lp-trust-divider" />
                <div className="lp-trust-item">
                  <Activity size={14} />
                  <span>99.9% uptime</span>
                </div>
                <div className="lp-trust-divider" />
                <div className="lp-trust-item">
                  <Clock size={14} />
                  <span>Setup em 24h</span>
                </div>
              </div>
            </div>

            <div className="lp-hero-right">
              <DashboardMock />
            </div>
          </div>
        </div>

      </header>

      {/* STATS */}
      <section className="lp-stats">
        <div className="lp-container">
          <div className="lp-stats-grid">
            <Stat number="80%" label="Mensagens respondidas pela IA" />
            <Stat number="<2min" label="Tempo médio de resposta" />
            <Stat number="24/7" label="IA atendendo seus clientes" />
            <Stat number="+0" label="Contratações novas mesmo crescendo" />
          </div>
          <p className="lp-stats-note">
            Médias da rede de IAs jurídicas Nexla · Atualizado mensalmente
          </p>
        </div>
      </section>

      {/* SOFIA — IA atendente */}
      <section className="lp-sofia" id="sofia">
        <div className="lp-container">
          <div className="lp-sofia-header">
            <div className="lp-sofia-eyebrow">
              <span className="lp-sofia-eyebrow-pulse" />
              Sofia · IA atendente
            </div>
            <h2 className="lp-h2 lp-sofia-title">
              Treinada com a <em>cara do seu escritório</em>.
              <br />
              Atende como se fosse <span className="lp-sofia-title-accent">você</span>.
            </h2>
            <p className="lp-sofia-sub">
              Sofia aprende seu nome, sua tabela de honorários, suas áreas de atuação e
              suas regras éticas. Recebe o cliente, classifica o caso, marca a reunião
              e ainda lembra do compromisso — <strong>24/7, sem você responder.</strong>
            </p>
          </div>

          <div className="lp-sofia-stage">
            {/* CHAT — Sofia em ação */}
            <div className="lp-sofia-chat">
              <div className="lp-sofia-chat-bar">
                <div className="lp-sofia-chat-avatar">S</div>
                <div>
                  <div className="lp-sofia-chat-name">Sofia · Mendes Advocacia</div>
                  <div className="lp-sofia-chat-status">
                    <span className="lp-sofia-chat-dot" />
                    online · respondendo agora
                  </div>
                </div>
                <div className="lp-sofia-chat-tag">IA · 24/7</div>
              </div>

              <div className="lp-sofia-chat-msgs">
                <div className="lp-sofia-day-mark">Hoje · 02:14</div>
                <div className="lp-sofia-bubble lp-sofia-bubble-out">
                  Boa noite, vi um anúncio de vocês. Tô precisando de um advogado.
                </div>
                <div className="lp-sofia-bubble lp-sofia-bubble-in">
                  Olá! Sou a <strong>Sofia</strong>, atendente do <strong>Mendes Advocacia</strong>.
                  Posso te ajudar a marcar uma conversa com um dos sócios.
                  Antes, me conta resumidamente o que aconteceu?
                </div>
                <div className="lp-sofia-bubble lp-sofia-bubble-out">
                  Fui demitido por justa causa mas não foi justa
                </div>
                <div className="lp-sofia-bubble lp-sofia-bubble-meta">
                  <Sparkles size={11} /> Sofia classificou: <strong>Trabalhista</strong> · roteando pro Dr. Rafael
                </div>
                <div className="lp-sofia-bubble lp-sofia-bubble-in">
                  Entendi. Esse caso é da área de <strong>Trabalhista</strong>, e o sócio responsável
                  é o <strong>Dr. Rafael Mendes</strong>. Tenho horário <strong>quinta às 14h</strong> ou
                  <strong> sexta às 10h</strong>. Qual fica melhor pra você?
                </div>
                <div className="lp-sofia-bubble lp-sofia-bubble-out">
                  Quinta às 14h
                </div>
                <div className="lp-sofia-bubble lp-sofia-bubble-in lp-sofia-bubble-confirm">
                  ✓ Reunião marcada · <strong>quinta 30/04 às 14h</strong> com Dr. Rafael Mendes.
                  Vou te lembrar 1 dia antes. Até lá!
                </div>
                <div className="lp-sofia-bubble lp-sofia-bubble-meta">
                  <Calendar size={11} /> Adicionado ao Google Calendar do Dr. Rafael · ficha da cliente criada
                </div>
              </div>
            </div>

            {/* PERSONALIZAÇÃO — Configuração feita pela Nexla */}
            <div className="lp-sofia-config">
              <div className="lp-sofia-config-bar">
                <div className="lp-sofia-config-title">
                  <Sparkles size={14} /> Treinamento da Sofia
                </div>
                <div className="lp-sofia-config-badge">
                  <ShieldCheck size={11} /> Feito pela Nexla
                </div>
              </div>

              <div className="lp-sofia-config-intro">
                Você não mexe em nada. <strong>Nossa equipe configura</strong> a Sofia
                com a cara do seu escritório em até 24h.
              </div>

              <div className="lp-sofia-config-row">
                <div className="lp-sofia-config-label">Nome da assistente</div>
                <div className="lp-sofia-config-value">
                  <strong>Sofia</strong>
                  <span className="lp-sofia-config-hint">você escolhe outro se quiser</span>
                </div>
              </div>

              <div className="lp-sofia-config-row">
                <div className="lp-sofia-config-label">Tom de voz</div>
                <div className="lp-sofia-config-value">
                  <span className="lp-sofia-pill">Profissional</span>
                  <span className="lp-sofia-pill">Acolhedor</span>
                  <span className="lp-sofia-pill">Direto</span>
                </div>
              </div>

              <div className="lp-sofia-config-row">
                <div className="lp-sofia-config-label">Áreas de atuação</div>
                <div className="lp-sofia-config-value">
                  <span className="lp-sofia-area" style={{ color: '#F59E0B', background: 'rgba(245, 158, 11, 0.12)' }}>Trabalhista</span>
                  <span className="lp-sofia-area" style={{ color: '#3B82F6', background: 'rgba(59, 130, 246, 0.12)' }}>Cível</span>
                  <span className="lp-sofia-area" style={{ color: '#A855F7', background: 'rgba(168, 85, 247, 0.12)' }}>Família</span>
                  <span className="lp-sofia-area" style={{ color: '#10B981', background: 'rgba(16, 185, 129, 0.12)' }}>Empresarial</span>
                </div>
              </div>

              <div className="lp-sofia-config-row">
                <div className="lp-sofia-config-label">Tabela de honorários</div>
                <div className="lp-sofia-config-value">
                  <strong>12 serviços</strong> cadastrados
                  <span className="lp-sofia-config-hint">avulso · fixo · êxito</span>
                </div>
              </div>

              <div className="lp-sofia-config-row">
                <div className="lp-sofia-config-label">Agenda integrada</div>
                <div className="lp-sofia-config-value">
                  <div className="lp-sofia-agenda-pills">
                    <span className="lp-sofia-pill lp-sofia-pill-on"><Video size={11} /> Teams</span>
                    <span className="lp-sofia-pill lp-sofia-pill-on"><Calendar size={11} /> Calendar</span>
                    <span className="lp-sofia-pill"><Building2 size={11} /> Interna</span>
                  </div>
                </div>
              </div>

              <div className="lp-sofia-config-rules">
                <div className="lp-sofia-rules-title">
                  <ShieldCheck size={13} /> Regras OAB embutidas
                </div>
                <ul className="lp-sofia-rules-list">
                  <li><Check size={11} /> Nunca dá parecer jurídico</li>
                  <li><Check size={11} /> Nunca promete resultado</li>
                  <li><Check size={11} /> Encaminha consulta pro advogado</li>
                  <li><Check size={11} /> Verifica conflito de interesse</li>
                </ul>
              </div>

              <div className="lp-sofia-config-foot">
                <Clock size={13} />
                <span>Setup completo em <strong>até 24h</strong> · sua equipe não levanta um dedo</span>
              </div>
            </div>
          </div>

          {/* 4 capacidades — cards premium com gradientes e watermark */}
          <div className="lp-sofia-caps">
            <article className="lp-sofia-cap" data-tone="green">
              <div className="lp-sofia-cap-watermark">01</div>
              <div className="lp-sofia-cap-icon">
                <MessageSquare size={22} strokeWidth={1.8} />
              </div>
              <div className="lp-sofia-cap-tag">Recepção</div>
              <h3 className="lp-sofia-cap-title">Atende</h3>
              <p className="lp-sofia-cap-desc">
                Recebe o cliente com o nome do escritório, em tom profissional e acolhedor — em qualquer horário, qualquer dia.
              </p>
              <div className="lp-sofia-cap-stat">
                <span className="lp-sofia-cap-stat-num">24/7</span>
                <span className="lp-sofia-cap-stat-lbl">disponibilidade</span>
              </div>
            </article>

            <article className="lp-sofia-cap" data-tone="amber">
              <div className="lp-sofia-cap-watermark">02</div>
              <div className="lp-sofia-cap-icon">
                <GitBranch size={22} strokeWidth={1.8} />
              </div>
              <div className="lp-sofia-cap-tag">Triagem</div>
              <h3 className="lp-sofia-cap-title">Classifica</h3>
              <p className="lp-sofia-cap-desc">
                Identifica a área do direito (cível, trabalhista, família…) e roteia automaticamente pro sócio especialista da banca.
              </p>
              <div className="lp-sofia-cap-stat">
                <span className="lp-sofia-cap-stat-num">8 áreas</span>
                <span className="lp-sofia-cap-stat-lbl">do direito</span>
              </div>
            </article>

            <article className="lp-sofia-cap" data-tone="violet">
              <div className="lp-sofia-cap-watermark">03</div>
              <div className="lp-sofia-cap-icon">
                <Calendar size={22} strokeWidth={1.8} />
              </div>
              <div className="lp-sofia-cap-tag">Agenda</div>
              <h3 className="lp-sofia-cap-title">Agenda</h3>
              <p className="lp-sofia-cap-desc">
                Marca a reunião direto no Teams, Google Calendar ou agenda interna — sem ping-pong de mensagens.
              </p>
              <div className="lp-sofia-cap-stat">
                <span className="lp-sofia-cap-stat-num">3 destinos</span>
                <span className="lp-sofia-cap-stat-lbl">de agenda</span>
              </div>
            </article>

            <article className="lp-sofia-cap" data-tone="blue">
              <div className="lp-sofia-cap-watermark">04</div>
              <div className="lp-sofia-cap-icon">
                <Clock size={22} strokeWidth={1.8} />
              </div>
              <div className="lp-sofia-cap-tag">Follow-up</div>
              <h3 className="lp-sofia-cap-title">Lembra</h3>
              <p className="lp-sofia-cap-desc">
                Avisa o cliente antes da reunião e o sócio antes da audiência. Ninguém perde compromisso, ninguém erra prazo.
              </p>
              <div className="lp-sofia-cap-stat">
                <span className="lp-sofia-cap-stat-num">2 lados</span>
                <span className="lp-sofia-cap-stat-lbl">cliente + sócio</span>
              </div>
            </article>
          </div>

          <div className="lp-sofia-foot">
            <div className="lp-sofia-foot-marker">
              <Sparkles size={14} />
            </div>
            <div>
              <strong>Sofia é o coração do NexlaAdv.</strong> Você não compra só uma plataforma —
              você compra a IA atendente que a Nexla já validou em escritórios reais.
            </div>
            <a href="#planos" className="lp-sofia-foot-cta">
              Quero ver na minha banca <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* QUALQUER OPERAÇÃO */}
      <section className="lp-versatility">
        <div className="lp-container">
          <SectionHeader
            kicker="Para qualquer escritório"
            title={<>Funciona do advogado solo<br /><em>à banca com várias filiais</em></>}
          />
          <div className="lp-versatility-grid">
            <VersatilityCard
              tone="amber"
              icon={<Users size={22} />}
              title="1 a 30+ advogados"
              description="Do solo ao escritório societário com várias áreas atendendo em paralelo. A plataforma escala com você sem trocar de sistema."
              chip="Solo · Banca · Custom"
            />
            <VersatilityCard
              tone="green"
              icon={<Network size={22} />}
              title="Filiais e correspondentes"
              description="Unidades sincronizadas em tempo real. Recepção de qualquer cidade vê a conversa, marca com o sócio certo e o cliente nem percebe."
              chip="Multi-instância"
            />
            <VersatilityCard
              tone="blue"
              icon={<Wallet size={22} />}
              title="Honorário avulso, fixo ou êxito"
              description="Cadastre serviços com valor fechado, mensalidade consultiva ou percentual de êxito. O agendamento puxa o modelo certo — sem planilha paralela."
              chip="4 modelos de honorário"
            />
            <VersatilityCard
              tone="pink"
              icon={<BotIcon size={22} />}
              title="Sofia + atendimento humano"
              description="Sofia atende e qualifica 24/7. Quando o caso pede sócio, ela passa a ficha pronta. Você ativa ou desativa quando quiser."
              chip="IA + Equipe"
            />
          </div>
        </div>
      </section>

      {/* RECURSOS */}
      <section className="lp-features" id="recursos">
        <div className="lp-container">
          <SectionHeader
            kicker="O que faz por você"
            title={<>Tudo que sua escritório<br /><em>precisa em um só lugar</em></>}
          />

          <div className="lp-features-grid">
            <FeatureCard
              variant="primary"
              icon={<Bot size={22} />}
              title="IA que conversa, qualifica e agenda"
              description="Atendente virtual 24/7 que entende seu cliente, responde dúvidas, qualifica o lead e agenda automaticamente — sem você levantar um dedo."
              tags={['WhatsApp', 'Instagram', 'Digisac']}
            />
            <FeatureCard
              icon={<MessageSquare size={22} />}
              title="Atendimento humano organizado"
              description="Recepção, setores e finalizados em abas. Cada atendente vê só o seu setor. Áudios, imagens e PDFs renderizados direto no chat."
            />
            <FeatureCard
              icon={<Calendar size={22} />}
              title="Agenda jurídica completa"
              description="Cadastre advogados, dias de atendimento, intervalos e serviço jurídicos. Validação automática de conflitos e horários."
            />
            <FeatureCard
              icon={<Scale size={22} />}
              title="Catálogo clínico"
              description="Advogados, serviço jurídicos, exames, valores particulares e por honorário. Tudo cadastrado e refletido no agendamento."
            />
            <FeatureCard
              icon={<BookUser size={22} />}
              title="Cadastro de clientes"
              description="Cada contato vira ficha completa: nome, telefone, histórico de conversas, agendamentos e notas privadas. Centralizado e pesquisável."
            />
            <FeatureCard
              variant="instagram"
              icon={<Instagram size={22} />}
              title="Instagram + WhatsApp na mesma caixa"
              description="Direct, comentários e stories do Instagram unificados com o WhatsApp. Atenda os dois canais com a mesma equipe e a mesma IA."
              tags={['Direct', 'Stories', 'Comentários']}
            />
            <FeatureCard
              icon={<ImageIcon size={22} />}
              title="IA cria posts para Instagram"
              description="A IA escreve legendas, sugere imagens e agenda postagens com base nos serviço jurídicos, datas e promoções da sua escritório."
              soon
            />
            <FeatureCard
              icon={<FileSearch size={22} />}
              title="IA analisa laudos advogados"
              description="Cliente envia o laudo no chat, a IA lê, resume os pontos principais e prepara a triagem para o advogado — economizando tempo da equipe."
              soon
            />
            <FeatureCard
              icon={<BarChart3 size={22} />}
              title="Métricas que importam"
              description="Faturamento por advogado, taxa de no-show, ticket médio, tempo de resposta. Dashboard com 6 abas de análise."
            />
            <FeatureCard
              icon={<Users size={22} />}
              title="Gestão de equipe e setores"
              description="Convide atendentes, atribua a setores, defina permissões. Cada conversa fica com quem deve atender."
            />
          </div>
        </div>
      </section>

      {/* TIME INTEIRO NUM NÚMERO SÓ */}
      <section className="lp-team" id="time">
        <div className="lp-container">
          {/* Cabeçalho com tom diferenciado */}
          <div className="lp-team-header">
            <div className="lp-team-eyebrow">
              <span className="lp-team-eyebrow-dot" />
              <span>Time inteiro num número só</span>
            </div>
            <h2 className="lp-team-title">
              <span>Sua equipe inteira atendendo.</span>
              <span className="lp-team-title-grad">no mesmo número de WhatsApp.</span>
            </h2>
            <p className="lp-team-sub">
              Acabou aquela história de revezar o celular ou ter 5 números diferentes
              pros setores. Aqui é <strong>um número, time inteiro</strong> — com regra
              de ownership pra ninguém atrapalhar a conversa do colega.
            </p>
          </div>

          {/* Visual: cliente ↔ time */}
          <div className="lp-team-stage">
            {/* COLUNA ESQUERDA — cliente vê 1 conversa */}
            <div className="lp-team-side lp-team-patient">
              <div className="lp-team-side-label">
                <Phone size={11} />
                <span>O cliente vê</span>
              </div>
              <div className="lp-team-phone">
                <div className="lp-team-phone-notch" />
                <div className="lp-team-phone-bar">
                  <div className="lp-team-phone-avatar">CS</div>
                  <div>
                    <div className="lp-team-phone-name">Mendes Advocacia</div>
                    <div className="lp-team-phone-status">
                      <span className="lp-team-phone-dot" />
                      online · respondendo
                    </div>
                  </div>
                </div>
                <div className="lp-team-phone-msgs">
                  <div className="lp-team-bubble lp-team-bubble-out">Oi, queria conversar sobre uma demissão sem justa causa</div>
                  <div className="lp-team-bubble lp-team-bubble-in">Claro! Vou te encaminhar pro Dr. Rafael, sócio de Trabalhista.</div>
                  <div className="lp-team-bubble lp-team-bubble-in">
                    Qual a melhor data pra primeira conversa?
                  </div>
                  <div className="lp-team-bubble lp-team-bubble-out">Quinta de tarde se possível</div>
                  <div className="lp-team-bubble lp-team-bubble-in lp-team-typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
                <div className="lp-team-phone-foot">
                  <span>Mensagem</span>
                </div>
              </div>
              <div className="lp-team-side-caption">
                <em>uma conversa só</em>, contínua e fluida —
                ele nem percebe que mudou de atendente
              </div>
            </div>

            {/* CONECTOR — fluxo central animado */}
            <svg className="lp-team-flow" viewBox="0 0 220 480" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="teamFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22C55E" />
                  <stop offset="50%" stopColor="#C9A074" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
              {/* 3 linhas saindo do meio-esquerda pra meio-direita */}
              <path d="M 0,80 Q 110,80 220,80" stroke="url(#teamFlow)" strokeWidth="2" fill="none" strokeDasharray="6 8" className="lp-team-flow-path" />
              <path d="M 0,240 Q 110,240 220,240" stroke="url(#teamFlow)" strokeWidth="2" fill="none" strokeDasharray="6 8" className="lp-team-flow-path lp-team-flow-path-2" />
              <path d="M 0,400 Q 110,400 220,400" stroke="url(#teamFlow)" strokeWidth="2" fill="none" strokeDasharray="6 8" className="lp-team-flow-path lp-team-flow-path-3" />
              {/* Bolinhas pulsantes nas pontas */}
              <circle cx="6" cy="80" r="4" fill="#22C55E" className="lp-team-flow-pulse" />
              <circle cx="6" cy="240" r="4" fill="#C9A074" className="lp-team-flow-pulse lp-team-flow-pulse-2" />
              <circle cx="6" cy="400" r="4" fill="#7C3AED" className="lp-team-flow-pulse lp-team-flow-pulse-3" />
            </svg>

            {/* COLUNA DIREITA — painel do time */}
            <div className="lp-team-side lp-team-control">
              <div className="lp-team-side-label">
                <Users size={11} />
                <span>Vocês organizam por setor</span>
              </div>
              <div className="lp-team-panel">
                <div className="lp-team-panel-bar">
                  <div className="lp-team-panel-title">Inbox NexlaAdv</div>
                  <div className="lp-team-panel-meta">
                    <span className="lp-team-panel-pulse" />
                    8 conversas ativas
                  </div>
                </div>

                {/* Setor 1 — Recepção */}
                <div className="lp-team-sector">
                  <div className="lp-team-sector-head">
                    <span className="lp-team-sector-color" style={{ background: '#22C55E' }} />
                    <span className="lp-team-sector-name">Recepção</span>
                    <div className="lp-team-sector-team">
                      <span className="lp-team-mini-avatar" style={{ background: 'linear-gradient(135deg, #F472B6, #EC4899)' }}>A</span>
                      <span className="lp-team-mini-avatar" style={{ background: 'linear-gradient(135deg, #FBBF24, #FB923C)' }}>J</span>
                      <span className="lp-team-mini-avatar" style={{ background: 'linear-gradient(135deg, #34D399, #06B6D4)' }}>M</span>
                    </div>
                  </div>
                  <div className="lp-team-conv lp-team-conv-active">
                    <span className="lp-team-conv-bullet">●</span>
                    <span className="lp-team-conv-text">
                      <strong>Maria Silva</strong> · Ana digitando
                    </span>
                    <span className="lp-team-conv-tag" style={{ color: '#16A34A', background: '#DCFCE7' }}>assumida</span>
                  </div>
                  <div className="lp-team-conv">
                    <span className="lp-team-conv-bullet" style={{ color: '#94A3B8' }}>●</span>
                    <span className="lp-team-conv-text">
                      <strong>Pedro Santos</strong> · aguardando
                    </span>
                    <span className="lp-team-conv-tag" style={{ color: '#7C3AED', background: '#F3E8FF' }}>IA</span>
                  </div>
                </div>

                {/* Setor 2 — Triagem */}
                <div className="lp-team-sector">
                  <div className="lp-team-sector-head">
                    <span className="lp-team-sector-color" style={{ background: '#C9A074' }} />
                    <span className="lp-team-sector-name">Triagem</span>
                    <div className="lp-team-sector-team">
                      <span className="lp-team-mini-avatar" style={{ background: 'linear-gradient(135deg, #A78BFA, #6366F1)' }}>C</span>
                      <span className="lp-team-mini-avatar" style={{ background: 'linear-gradient(135deg, #60A5FA, #3B82F6)' }}>L</span>
                    </div>
                  </div>
                  <div className="lp-team-conv">
                    <span className="lp-team-conv-bullet" style={{ color: '#C9A074' }}>●</span>
                    <span className="lp-team-conv-text">
                      <strong>Joana Lima</strong> · Carlos assumiu há 2min
                    </span>
                    <span className="lp-team-conv-tag" style={{ color: '#B8895C', background: 'rgba(201, 160, 116, 0.18)' }}>travada</span>
                  </div>
                </div>

                {/* Setor 3 — Advogados */}
                <div className="lp-team-sector">
                  <div className="lp-team-sector-head">
                    <span className="lp-team-sector-color" style={{ background: '#7C3AED' }} />
                    <span className="lp-team-sector-name">Advogados</span>
                    <div className="lp-team-sector-team">
                      <span className="lp-team-mini-avatar" style={{ background: 'linear-gradient(135deg, #C084FC, #9333EA)' }}>K</span>
                    </div>
                  </div>
                  <div className="lp-team-conv">
                    <span className="lp-team-conv-bullet" style={{ color: '#7C3AED' }}>●</span>
                    <span className="lp-team-conv-text">
                      <strong>Ana Bia</strong> · transferida da Triagem
                    </span>
                    <span className="lp-team-conv-tag" style={{ color: '#0891B2', background: '#CFFAFE' }}>↪ recebida</span>
                  </div>
                </div>
              </div>
              <div className="lp-team-side-caption">
                cada um <em>vê só o que precisa</em> —
                e ninguém pisa na conversa do outro
              </div>
            </div>
          </div>

          {/* 3 regras de ouro */}
          <div className="lp-team-rules">
            <div className="lp-team-rule">
              <div className="lp-team-rule-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#16A34A' }}>
                <Users size={18} />
              </div>
              <div>
                <div className="lp-team-rule-title">Setores que organizam</div>
                <div className="lp-team-rule-desc">
                  Recepção, triagem, advogados, financeiro — você divide do jeito que faz sentido pra escritório.
                  Cada atendente só vê o que é dele.
                </div>
              </div>
            </div>
            <div className="lp-team-rule lp-team-rule-featured">
              <div className="lp-team-rule-icon" style={{ background: 'rgba(201, 160, 116, 0.18)', color: '#C9A074' }}>
                <Lock size={18} />
              </div>
              <div>
                <div className="lp-team-rule-title">Trava automática</div>
                <div className="lp-team-rule-desc">
                  Quando alguém assume a conversa, ela <strong>trava no nome dele</strong>.
                  Os outros enxergam, mas não conseguem mandar mensagem — cliente nunca recebe resposta dupla.
                </div>
                <span className="lp-team-rule-pill">Novo</span>
              </div>
            </div>
            <div className="lp-team-rule">
              <div className="lp-team-rule-icon" style={{ background: 'rgba(124, 58, 237, 0.12)', color: '#7C3AED' }}>
                <ArrowRightLeft size={18} />
              </div>
              <div>
                <div className="lp-team-rule-title">Transferência num clique</div>
                <div className="lp-team-rule-desc">
                  Recepção encaminha pra triagem, triagem manda pro advogado — sem perder histórico,
                  sem o cliente trocar de número.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FICHA DO PACIENTE */}
      <section className="lp-ficha" id="ficha">
        <div className="lp-container">
          <SectionHeader
            kicker="Ficha do cliente"
            title={<>Cada cliente, <em>uma ficha de dossiê</em><br />que respira com sua escritório</>}
          />

          <div className="lp-ficha-stage">
            <FichaMock />

            {/* Callouts flutuantes */}
            <div className="lp-ficha-callout lp-callout-1">
              <div className="lp-callout-icon" style={{ background: '#FCE7F3', color: '#DB2777' }}><Camera size={16} /></div>
              <div>
                <div className="lp-callout-title">Foto vira avatar</div>
                <div className="lp-callout-desc">A foto cadastrada aparece como ícone do cliente nas conversas, na agenda e em qualquer canto.</div>
              </div>
            </div>
            <div className="lp-ficha-callout lp-callout-2">
              <div className="lp-callout-icon" style={{ background: '#FEF3C7', color: '#D97706' }}><Cake size={16} /></div>
              <div>
                <div className="lp-callout-title">Aniversário sozinho</div>
                <div className="lp-callout-desc">Banner colorido aparece automaticamente na semana do aniversário do cliente.</div>
              </div>
            </div>
            <div className="lp-ficha-callout lp-callout-3">
              <div className="lp-callout-icon" style={{ background: '#DBEAFE', color: '#2563EB' }}><Activity size={16} /></div>
              <div>
                <div className="lp-callout-title">Áreas e status do caso</div>
                <div className="lp-callout-desc">Cliente vinculado a área de atuação; status do caso visível direto na ficha.</div>
              </div>
            </div>
            <div className="lp-ficha-callout lp-callout-4">
              <div className="lp-callout-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}><Clock size={16} /></div>
              <div>
                <div className="lp-callout-title">Linha do tempo</div>
                <div className="lp-callout-desc">Reuniões, audiências e contratos passados e futuros — com status e valor. Histórico que não some.</div>
              </div>
            </div>
          </div>

          {/* Linha de pílulas com mais features */}
          <div className="lp-ficha-pills">
            <span><BookUser size={13} /> Identificação completa (PF: CPF/RG · PJ: CNPJ/representante)</span>
            <span><MapPin size={13} /> Endereço e contato de emergência</span>
            <span><ShieldAlert size={13} /> Alerta de conflito de interesse</span>
            <span><FolderOpen size={13} /> Pasta com múltiplos casos vinculados</span>
            <span><Scale size={13} /> Notas jurídicas privadas da equipe</span>
            <span><TrendingUp size={13} /> Origem do cliente (Indicação, Instagram, Google...)</span>
          </div>
        </div>
      </section>

      {/* ATRIBUIÇÃO DE LEAD */}
      <section className="lp-attr" id="atribuicao">
        <div className="lp-container">
          <SectionHeader
            kicker="Atribuição de lead"
            title={<>Saiba exatamente de onde<br /><em>cada cliente veio</em></>}
          />
          <p className="lp-attr-intro">
            Pare de pagar ad sem saber se trouxe cliente. A NexlaAdv
            rastreia origem do lead automaticamente — do clique no anúncio
            até a atendimento realizada.
          </p>

          <div className="lp-attr-grid">
            <div className="lp-attr-card">
              <div className="lp-attr-ico" style={{ background: '#DBEAFE', color: '#2563EB' }}>
                <ScanLine size={20} />
              </div>
              <div className="lp-attr-card-title">Rastreio técnico nativo</div>
              <p>Captura origem via UTM, parâmetros de URL e contextInfo do Meta. Lead chega já marcado com a campanha que clicou.</p>
              <span className="lp-attr-tag">UTM · contextInfo</span>
            </div>
            <div className="lp-attr-card lp-attr-card-featured">
              <div className="lp-attr-ico" style={{ background: 'rgba(201, 160, 116, 0.18)', color: '#C9A074' }}>
                <Bot size={20} />
              </div>
              <div className="lp-attr-card-title">Qualificação por IA</div>
              <p>A IA pergunta naturalmente "como nos conheceu?" durante a conversa e classifica a resposta automaticamente. Cruzamento com o rastreio técnico pra eliminar dúvida.</p>
              <span className="lp-attr-tag">No ar</span>
            </div>
            <div className="lp-attr-card">
              <div className="lp-attr-ico" style={{ background: '#D1FAE5', color: '#16A34A' }}>
                <TrendingUp size={20} />
              </div>
              <div className="lp-attr-card-title">Atribuição até o atendimento</div>
              <p>Acompanhe o lead do anúncio ao agendamento confirmado. Saiba qual ad gerou cliente que efetivamente compareceu — e quanto cada real investido virou receita.</p>
              <span className="lp-attr-tag">Roadmap Q3</span>
            </div>
          </div>

          {/* Mapa de jornada do lead */}
          <div className="lp-journey">
            <div className="lp-journey-head">
              <div className="lp-journey-eyebrow">A jornada</div>
              <div className="lp-journey-title">Campanha Trabalhista <span>· Out/2026</span></div>
              <div className="lp-journey-sub">do clique no anúncio até a primeira reunião realizada</div>
              <div className="lp-journey-pill">
                <TrendingUp size={14} />
                <span>R$ 9.300 atribuídos</span>
              </div>
            </div>

            <div className="lp-journey-map">
              {/* Caminho curvo em SVG */}
              <svg
                className="lp-journey-svg"
                viewBox="0 0 1080 520"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="journeyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="20%" stopColor="#22C55E" />
                    <stop offset="45%" stopColor="#C9A074" />
                    <stop offset="65%" stopColor="#3B82F6" />
                    <stop offset="85%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                  <filter id="journeyGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Caminho de fundo (linha cheia, baixa opacidade) */}
                <path
                  d="M 80,380 C 200,380 140,130 260,130 S 380,340 460,340 S 580,110 660,110 S 780,320 860,320 S 940,90 1020,90"
                  stroke="url(#journeyGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.18"
                />
                {/* Caminho tracejado animado */}
                <path
                  className="lp-journey-path"
                  d="M 80,380 C 200,380 140,130 260,130 S 380,340 460,340 S 580,110 660,110 S 780,320 860,320 S 940,90 1020,90"
                  stroke="url(#journeyGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="8 10"
                  fill="none"
                />

                {/* Etiquetas de conversão entre paradas */}
                <g className="lp-journey-conv-labels">
                  <g transform="translate(170, 255)">
                    <rect x="-22" y="-11" width="44" height="22" rx="11" fill="#fff" stroke="#E5E7EB" />
                    <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#16A34A">↗ 15%</text>
                  </g>
                  <g transform="translate(360, 235)">
                    <rect x="-22" y="-11" width="44" height="22" rx="11" fill="#fff" stroke="#E5E7EB" />
                    <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#16A34A">↗ 71%</text>
                  </g>
                  <g transform="translate(560, 225)">
                    <rect x="-22" y="-11" width="44" height="22" rx="11" fill="#fff" stroke="#E5E7EB" />
                    <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#D97706">↗ 43%</text>
                  </g>
                  <g transform="translate(760, 215)">
                    <rect x="-22" y="-11" width="44" height="22" rx="11" fill="#fff" stroke="#E5E7EB" />
                    <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#16A34A">↗ 82%</text>
                  </g>
                </g>
              </svg>

              {/* Paradas do caminho */}
              <div className="lp-journey-stop" style={{ left: '7.4%', top: '73%' }} data-tone="instagram">
                <div className="lp-journey-bubble">
                  <Instagram size={22} />
                </div>
                <div className="lp-journey-stop-card">
                  <div className="lp-journey-step">01</div>
                  <div className="lp-journey-num">847</div>
                  <div className="lp-journey-lbl">Cliques no ad</div>
                </div>
              </div>

              <div className="lp-journey-stop" style={{ left: '24.1%', top: '25%' }} data-tone="msg">
                <div className="lp-journey-bubble">
                  <MessageSquare size={22} />
                </div>
                <div className="lp-journey-stop-card">
                  <div className="lp-journey-step">02</div>
                  <div className="lp-journey-num">126</div>
                  <div className="lp-journey-lbl">Lead chegou</div>
                </div>
              </div>

              <div className="lp-journey-stop" style={{ left: '42.6%', top: '65.4%' }} data-tone="ia">
                <div className="lp-journey-bubble">
                  <Bot size={22} />
                </div>
                <div className="lp-journey-stop-card">
                  <div className="lp-journey-step">03</div>
                  <div className="lp-journey-num">89</div>
                  <div className="lp-journey-lbl">IA qualificou</div>
                </div>
              </div>

              <div className="lp-journey-stop" style={{ left: '61.1%', top: '21%' }} data-tone="agenda">
                <div className="lp-journey-bubble">
                  <Calendar size={22} />
                </div>
                <div className="lp-journey-stop-card">
                  <div className="lp-journey-step">04</div>
                  <div className="lp-journey-num">38</div>
                  <div className="lp-journey-lbl">Agendaram</div>
                </div>
              </div>

              <div className="lp-journey-stop" style={{ left: '79.6%', top: '61.5%' }} data-tone="atendimento">
                <div className="lp-journey-bubble">
                  <Scale size={22} />
                </div>
                <div className="lp-journey-stop-card">
                  <div className="lp-journey-step">05</div>
                  <div className="lp-journey-num">31</div>
                  <div className="lp-journey-lbl">Compareceram</div>
                </div>
              </div>

              <div className="lp-journey-stop lp-journey-stop-final" style={{ left: '94.4%', top: '17.3%' }} data-tone="receita">
                <div className="lp-journey-bubble">
                  <TrendingUp size={22} />
                </div>
                <div className="lp-journey-stop-card">
                  <div className="lp-journey-step">06</div>
                  <div className="lp-journey-num">R$ 9.3k</div>
                  <div className="lp-journey-lbl">Receita atribuída</div>
                </div>
              </div>
            </div>

            {/* Versão mobile: timeline vertical */}
            <ol className="lp-journey-list">
              <li data-tone="instagram">
                <span className="lp-journey-list-icon"><Instagram size={16} /></span>
                <div>
                  <strong>847</strong>
                  <span>Cliques no ad</span>
                </div>
              </li>
              <li data-tone="msg" data-conv="15%">
                <span className="lp-journey-list-icon"><MessageSquare size={16} /></span>
                <div>
                  <strong>126</strong>
                  <span>Lead chegou</span>
                </div>
              </li>
              <li data-tone="ia" data-conv="71%">
                <span className="lp-journey-list-icon"><Bot size={16} /></span>
                <div>
                  <strong>89</strong>
                  <span>IA qualificou</span>
                </div>
              </li>
              <li data-tone="agenda" data-conv="43%">
                <span className="lp-journey-list-icon"><Calendar size={16} /></span>
                <div>
                  <strong>38</strong>
                  <span>Agendaram</span>
                </div>
              </li>
              <li data-tone="atendimento" data-conv="82%">
                <span className="lp-journey-list-icon"><Scale size={16} /></span>
                <div>
                  <strong>31</strong>
                  <span>Compareceram</span>
                </div>
              </li>
              <li data-tone="receita" data-final>
                <span className="lp-journey-list-icon"><TrendingUp size={16} /></span>
                <div>
                  <strong>R$ 9.3k</strong>
                  <span>Receita atribuída</span>
                </div>
              </li>
            </ol>

            {/* Legenda */}
            <div className="lp-journey-legend">
              <div className="lp-journey-legend-item">
                <span className="lp-journey-dot" data-tone="instagram" />
                Anúncio
              </div>
              <span className="lp-journey-legend-sep">·</span>
              <div className="lp-journey-legend-item">
                <span className="lp-journey-dot" data-tone="msg" />
                Conversa
              </div>
              <span className="lp-journey-legend-sep">·</span>
              <div className="lp-journey-legend-item">
                <span className="lp-journey-dot" data-tone="ia" />
                IA
              </div>
              <span className="lp-journey-legend-sep">·</span>
              <div className="lp-journey-legend-item">
                <span className="lp-journey-dot" data-tone="agenda" />
                Agenda
              </div>
              <span className="lp-journey-legend-sep">·</span>
              <div className="lp-journey-legend-item">
                <span className="lp-journey-dot" data-tone="atendimento" />
                Atendimento
              </div>
              <span className="lp-journey-legend-sep">·</span>
              <div className="lp-journey-legend-item">
                <span className="lp-journey-dot" data-tone="receita" />
                Receita
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="lp-how" id="como-funciona">
        <div className="lp-container">
          <SectionHeader
            kicker="Em 3 passos"
            title={<>Da bagunça do WhatsApp<br /><em>ao controle total</em></>}
            light
          />

          <div className="lp-steps">
            <StepCard
              number="01"
              title="Conecte seus canais"
              description="Escaneie o QR Code do WhatsApp e conecte sua conta do Instagram Business. Em segundos, ambos começam a chegar na mesma inbox."
            />
            <StepCard
              number="02"
              title="Configure advogados e serviço jurídicos"
              description="Cadastre advogados com horários, intervalos e dias de atendimento. Adicione serviço jurídicos com valor particular e por honorário."
            />
            <StepCard
              number="03"
              title="Deixe a IA trabalhar (e medir)"
              description="A IA atende, qualifica, agenda e te avisa quando precisa de atenção humana. E ainda registra de onde cada cliente veio — você foca em cuidar dos clientes e tomar decisões com dado real."
            />
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <TestimonialsSection items={TESTIMONIALS} />

      {/* SEGURANÇA & LGPD */}
      <section className="lp-security" id="seguranca">
        <div className="lp-container">
          <SectionHeader
            kicker="Segurança em primeiro lugar"
            title={<>Conformidade que <em>escritório de verdade</em><br />exige</>}
          />
          <div className="lp-security-grid">
            <SecurityItem
              icon={<Server size={18} />}
              title="Dados em servidor brasileiro"
              description="Infraestrutura hospedada no Brasil, em conformidade com LGPD."
              flag="🇧🇷"
            />
            <SecurityItem
              icon={<Lock size={18} />}
              title="Criptografia ponta a ponta"
              description="Mensagens e dados de clientes criptografados em trânsito e em repouso."
            />
            <SecurityItem
              icon={<FileText size={18} />}
              title="Cláusula de tratamento de dados"
              description="DPO designado e termo de tratamento de dados de clientes incluído no contrato."
            />
            <SecurityItem
              icon={<Trash2 size={18} />}
              title="Política de retenção e exclusão"
              description="Você controla por quanto tempo os dados ficam armazenados e pode solicitar exclusão a qualquer momento."
            />
          </div>
          <div className="lp-security-cta">
            <a href="/seguranca" className="lp-security-link">
              Ver política de privacidade completa
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* PARA QUEM É */}
      <section className="lp-icp" id="para-quem">
        <div className="lp-container">
          <SectionHeader
            kicker="Pra quem é"
            title={<>Feita pra escritórios que levam<br /><em>crescimento a sério</em></>}
          />
          <p className="lp-icp-intro">
            Quatro perfis que a gente atende todo dia. <strong>Provavelmente um deles é você.</strong>
          </p>

          <div className="lp-icp-grid">
            {/* 01 — Investe em marketing */}
            <article className="lp-icp-card lp-icp-marketing" data-tone="amber">
              <div className="lp-icp-card-head">
                <span className="lp-icp-num">01</span>
                <span className="lp-icp-tag">
                  <ScanLine size={11} /> Performance
                </span>
              </div>
              <div className="lp-icp-card-title">
                <span>Investe em marketing</span>
                <em>e quer ver retorno</em>
              </div>
              <p className="lp-icp-card-desc">
                Faz tráfego pago no Meta e Google. Quer saber qual ad trouxe
                <strong> cliente que apareceu na atendimento</strong>, não só lead que abriu chat.
              </p>
              <div className="lp-icp-card-visual lp-icp-visual-bars">
                <div className="lp-icp-visual-label">Receita por origem · out/26</div>
                <div className="lp-icp-bars">
                  <div className="lp-icp-bar" style={{ '--h': '78%', '--c': '#F59E0B' }}>
                    <span className="lp-icp-bar-val">R$ 9.3k</span>
                    <span className="lp-icp-bar-lbl">Meta</span>
                  </div>
                  <div className="lp-icp-bar" style={{ '--h': '52%', '--c': '#FCD34D' }}>
                    <span className="lp-icp-bar-val">R$ 6.2k</span>
                    <span className="lp-icp-bar-lbl">Google</span>
                  </div>
                  <div className="lp-icp-bar" style={{ '--h': '34%', '--c': '#FDE68A' }}>
                    <span className="lp-icp-bar-val">R$ 4.1k</span>
                    <span className="lp-icp-bar-lbl">Indica.</span>
                  </div>
                </div>
              </div>
            </article>

            {/* 02 — Multi-canal */}
            <article className="lp-icp-card lp-icp-multichannel" data-tone="emerald">
              <div className="lp-icp-card-head">
                <span className="lp-icp-num">02</span>
                <span className="lp-icp-tag">
                  <Network size={11} /> Multi-canal
                </span>
              </div>
              <div className="lp-icp-card-title">
                <span>Cliente chega</span>
                <em>por todo lugar</em>
              </div>
              <p className="lp-icp-card-desc">
                WhatsApp, Instagram Direct, site, indicação. Hoje gerencia tudo
                <strong> separado e perde conversa</strong> quando o telefone toca.
              </p>
              <div className="lp-icp-card-visual lp-icp-visual-channels">
                <div className="lp-icp-channel" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
                  <MessageSquare size={14} />
                </div>
                <div className="lp-icp-channel" style={{ background: 'linear-gradient(135deg, #F472B6, #EC4899)' }}>
                  <Instagram size={14} />
                </div>
                <div className="lp-icp-channel" style={{ background: 'linear-gradient(135deg, #60A5FA, #3B82F6)' }}>
                  <Network size={14} />
                </div>
                <svg className="lp-icp-channel-flow" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M 20,12 Q 100,30 180,30" stroke="#10B981" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
                  <path d="M 20,30 Q 100,30 180,30" stroke="#10B981" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
                  <path d="M 20,48 Q 100,30 180,30" stroke="#10B981" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
                </svg>
                <div className="lp-icp-channel-target">
                  <Inbox size={14} />
                  <span>1 inbox</span>
                </div>
              </div>
            </article>

            {/* 03 — Multi-advogado */}
            <article className="lp-icp-card lp-icp-multidoc" data-tone="sky">
              <div className="lp-icp-card-head">
                <span className="lp-icp-num">03</span>
                <span className="lp-icp-tag">
                  <Users size={11} /> Equipe
                </span>
              </div>
              <div className="lp-icp-card-title">
                <span>Tem dois ou mais</span>
                <em>advogados</em>
              </div>
              <p className="lp-icp-card-desc">
                Agenda complexa, especialidades diferentes, setores que se misturam.
                <strong> Excel e WhatsApp Web não dão mais conta.</strong>
              </p>
              <div className="lp-icp-card-visual lp-icp-visual-team">
                <div className="lp-icp-team-card" style={{ background: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)', borderColor: '#93C5FD' }}>
                  <div className="lp-icp-team-avatar" style={{ background: 'linear-gradient(135deg, #60A5FA, #3B82F6)' }}>C</div>
                  <div>
                    <div className="lp-icp-team-name">Dra. Camila</div>
                    <div className="lp-icp-team-spec">Cível</div>
                  </div>
                </div>
                <div className="lp-icp-team-card" style={{ background: 'linear-gradient(135deg, #E0E7FF, #C7D2FE)', borderColor: '#A5B4FC' }}>
                  <div className="lp-icp-team-avatar" style={{ background: 'linear-gradient(135deg, #A78BFA, #6366F1)' }}>R</div>
                  <div>
                    <div className="lp-icp-team-name">Dr. Rafael</div>
                    <div className="lp-icp-team-spec">Trabalhista</div>
                  </div>
                </div>
                <div className="lp-icp-team-card" style={{ background: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)', borderColor: '#93C5FD' }}>
                  <div className="lp-icp-team-avatar" style={{ background: 'linear-gradient(135deg, #34D399, #06B6D4)' }}>M</div>
                  <div>
                    <div className="lp-icp-team-name">Dra. Marina</div>
                    <div className="lp-icp-team-spec">Família</div>
                  </div>
                </div>
              </div>
            </article>

            {/* 04 — Quer controle */}
            <article className="lp-icp-card lp-icp-control" data-tone="rose">
              <div className="lp-icp-card-head">
                <span className="lp-icp-num">04</span>
                <span className="lp-icp-tag">
                  <BarChart3 size={11} /> Dados
                </span>
              </div>
              <div className="lp-icp-card-title">
                <span>Quer controle,</span>
                <em>não só ferramenta</em>
              </div>
              <p className="lp-icp-card-desc">
                Métrica de cada advogado, taxa de no-show, atribuição de marketing.
                <strong> Decisão por dado, não achismo.</strong>
              </p>
              <div className="lp-icp-card-visual lp-icp-visual-kpis">
                <div className="lp-icp-kpi">
                  <div className="lp-icp-kpi-val" style={{ color: '#16A34A' }}>R$ 87k</div>
                  <div className="lp-icp-kpi-lbl">Faturamento</div>
                  <div className="lp-icp-kpi-trend">↑ 12%</div>
                </div>
                <div className="lp-icp-kpi">
                  <div className="lp-icp-kpi-val" style={{ color: '#DC2626' }}>8%</div>
                  <div className="lp-icp-kpi-lbl">No-show</div>
                  <div className="lp-icp-kpi-trend lp-icp-kpi-trend-down">↓ 3%</div>
                </div>
                <div className="lp-icp-kpi">
                  <div className="lp-icp-kpi-val" style={{ color: '#7C3AED' }}>R$ 312</div>
                  <div className="lp-icp-kpi-lbl">Ticket médio</div>
                  <div className="lp-icp-kpi-trend">↑ 8%</div>
                </div>
              </div>
            </article>
          </div>

          {/* Outro */}
          <div className="lp-icp-outro">
            <div className="lp-icp-outro-marker">
              <Sparkles size={14} />
            </div>
            <div>
              <strong>Se você se viu em pelo menos 2 desses</strong>, a gente já consegue
              te mostrar resultado em 30 dias.
            </div>
            <a href="#cta" className="lp-icp-outro-cta">
              Quero conversar <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section className="lp-pricing" id="planos">
        <div className="lp-container">
          <SectionHeader
            kicker="Planos"
            title={<>Do solo à banca inteira.<br /><em>O comercial te ajuda a escolher.</em></>}
          />
          <p className="lp-pricing-anchor lp-pricing-anchor-soft">
            Cada escritório tem um tamanho — e cada tamanho um plano.
            <strong> A gente conversa rápido, entende seu cenário e mostra o que cabe melhor.</strong>
          </p>

          <div className="lp-pricing-grid">
            <PricingTier
              name="Solo"
              tier="Para começar"
              tagline="Pra advogado solo ou autônomo (até 2 advogados)"
              features={[
                'Até 2 advogados cadastrados',
                'Até 3 usuários na equipe',
                'WhatsApp + Sofia 24/7',
                'Triagem automática por área do direito',
                'Ficha completa do cliente PF/PJ',
                'Alerta de conflito de interesse',
                'Atribuição de origem (UTM básico)',
                '1 instância · 1 agenda · Kanban',
                'Agenda em Teams, Google Calendar ou interna',
                'Suporte por e-mail',
              ]}
            />
            <PricingTier
              featured
              name="Banca"
              tier="Mais escolhido"
              tagline="Pra escritório pequeno societário (até 8 advogados)"
              features={[
                'Até 8 advogados cadastrados',
                'Até 15 usuários na equipe',
                'Tudo do Solo, e mais:',
                '+ Instagram Direct unificado com Sofia',
                '+ Atribuição completa (UTM + Meta)',
                '+ Distribuição automática round-robin',
                '+ Modo confidencial entre sócios',
                '+ Pasta do cliente (múltiplos casos)',
                '+ Templates HSM (lembrete de reunião)',
                '+ Métricas por advogado e por área',
                'Suporte prioritário (resposta em 2h úteis)',
              ]}
            />
            <PricingTier
              name="Custom"
              tier="Sob consulta"
              tagline="Pra escritórios médios e grandes (>8 advogados), redes e bancas"
              features={[
                'Advogados e usuários ilimitados',
                'Multi-filial e correspondentes',
                'SLA dedicado · suporte prioritário',
                'Modelo de IA on-premise opcional',
                'Integrações sob medida (PJe / e-SAJ / CNJ Datajud)',
                'Onboarding assistido por equipe Nexla',
                'Cláusulas contratuais customizadas',
                'Gerente de conta dedicado',
              ]}
            />
          </div>

          {/* CTA único pro comercial */}
          <div className="lp-pricing-cta">
            <a href="https://wa.me/5561999999999?text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20a%20NexlaAdv" target="_blank" rel="noreferrer" className="lp-btn-primary lp-btn-large">
              Falar com o comercial agora
              <ArrowRight size={18} />
            </a>
            <p className="lp-pricing-cta-sub">Em média, respondemos em <strong>menos de 5 minutos</strong> em horário comercial.</p>
          </div>

          {/* Tabela completa de comparação */}
          <details className="lp-compare">
            <summary className="lp-compare-toggle">
              <span>Ver tabela completa de comparação</span>
              <ChevronRight size={16} />
            </summary>
            <ComparisonTable />
          </details>

          <p className="lp-pricing-note">
            Onboarding incluso em todos os planos · Sem cobrar por mensagem · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="lp-cta" id="contato">
        <div className="lp-container">
          <div className="lp-cta-card">
            <div className="lp-cta-text">
              <h2 className="lp-h2">
                Sua IA já economiza horas. <em>Agora é hora de saber o quanto.</em>
              </h2>
              <p>
                Pare de perder cliente no WhatsApp e no Direct.
                Pare de pagar ad sem saber se trouxe contrato.
                Comece agora — sem cartão de crédito.
              </p>
            </div>
            <div className="lp-cta-actions">
              <a href="#planos" className="lp-btn-primary lp-btn-large">
                Experimentar grátis
                <ArrowRight size={18} />
              </a>
              <a href="https://wa.me/5561999999999" target="_blank" rel="noreferrer" className="lp-btn-ghost lp-btn-large">
                <Phone size={16} />
                Falar com humano
              </a>
              <p className="lp-microcopy lp-cta-microcopy">
                Sem cartão de crédito · Setup guiado em 24h · Cancele quando quiser
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <Link to="/" className="lp-brand">
                <div className="lp-brand-mark">
                  <BrandMark size={32} color="#C9A074" strokeWidth={1.6} />
                </div>
                <div>
                  <span className="lp-brand-text">NexlaAdv</span>
                  <span className="lp-brand-tagline">Ética e eficiência não brigam</span>
                </div>
              </Link>
              <p>
                Atendimento e captação inbound para escritórios de advocacia.
                Um produto Nexla Automação e IA.
              </p>
            </div>
            <div className="lp-footer-col">
              <h4>Produto</h4>
              <a href="#recursos">Recursos</a>
              <a href="#como-funciona">Como funciona</a>
              <a href="#planos">Planos</a>
              <Link to="/login">Acessar conta</Link>
            </div>
            <div className="lp-footer-col">
              <h4>Empresa</h4>
              <a href="#contato">Contato</a>
              <a href="#">Termos de uso</a>
              <a href="#">Privacidade</a>
              <a href="#">LGPD</a>
            </div>
            <div className="lp-footer-col">
              <h4>Falar com a gente</h4>
              <a href="https://wa.me/5561999999999"><Phone size={12} /> WhatsApp</a>
              <a href="mailto:contato@nexlaadv.com.br"><Mail size={12} /> contato@nexlaadv.com.br</a>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>© 2026 NexlaAdv · Todos os direitos reservados</span>
            <span className="lp-footer-made">Ética e eficiência não brigam.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ─── Subcomponentes ──────────────────────────────────────────────────────── */
function SectionHeader({ kicker, title, light }) {
  return (
    <div className={`lp-section-header ${light ? 'light' : ''}`}>
      <div className="lp-kicker">
        <span className="lp-kicker-line" />
        {kicker}
      </div>
      <h2 className="lp-h2">{title}</h2>
    </div>
  )
}

function Stat({ number, label }) {
  return (
    <div className="lp-stat">
      <div className="lp-stat-number">{number}</div>
      <div className="lp-stat-label">{label}</div>
    </div>
  )
}

function FeatureCard({ icon, title, description, variant, tags, soon }) {
  const variantClass =
    variant === 'primary' ? 'primary' :
    variant === 'instagram' ? 'instagram' : ''
  return (
    <div className={`lp-feature ${variantClass}`}>
      {soon && <span className="lp-feature-soon">Em breve</span>}
      <div className="lp-feature-icon">{icon}</div>
      <h3 className="lp-feature-title">{title}</h3>
      <p className="lp-feature-desc">{description}</p>
      {tags && (
        <div className="lp-feature-tags">
          {tags.map(t => <span key={t}>{t}</span>)}
        </div>
      )}
      <div className="lp-feature-arrow"><ArrowUpRight size={18} /></div>
    </div>
  )
}

function StepCard({ number, title, description }) {
  return (
    <div className="lp-step">
      <div className="lp-step-number">{number}</div>
      <h3 className="lp-step-title">{title}</h3>
      <p className="lp-step-desc">{description}</p>
    </div>
  )
}

function FichaMock() {
  return (
    <div className="lp-ficha-mock">
      <div className="lp-ficha-mock-glow" />

      {/* Banner aniversário */}
      <div className="lp-ficha-bday">
        <Cake size={13} /> <strong>Aniversariante!</strong> Faltam 3 dias para Maria.
      </div>

      {/* Cabeçalho */}
      <div className="lp-ficha-head">
        <div className="lp-ficha-photo">M</div>
        <div className="lp-ficha-info">
          <div className="lp-ficha-name">Maria Silva Santos</div>
          <div className="lp-ficha-meta">42 anos · PF · Particular · Professora</div>
          <div className="lp-ficha-actions">
            <span className="lp-ficha-btn primary"><MessageSquare size={10} /> Conversar</span>
            <span className="lp-ficha-btn"><Calendar size={10} /> Agendar</span>
            <span className="lp-ficha-btn"><Pencil size={10} /> Editar</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="lp-ficha-tabs">
        <span className="active">Resumo</span>
        <span>Cadastro</span>
        <span>Casos (3)</span>
        <span>Histórico</span>
      </div>

      {/* KPIs */}
      <div className="lp-ficha-kpis">
        <div className="lp-ficha-kpi" style={{ background: '#EFF6FF' }}>
          <div className="lp-ficha-kpi-label">Próxima</div>
          <div className="lp-ficha-kpi-value">02/05 · 14:30</div>
        </div>
        <div className="lp-ficha-kpi" style={{ background: '#F0FDF4' }}>
          <div className="lp-ficha-kpi-label">Casos ativos</div>
          <div className="lp-ficha-kpi-value">3</div>
        </div>
        <div className="lp-ficha-kpi" style={{ background: '#F5F3FF' }}>
          <div className="lp-ficha-kpi-label">Honorários</div>
          <div className="lp-ficha-kpi-value">R$ 12.4k</div>
        </div>
        <div className="lp-ficha-kpi" style={{ background: '#FFFBEB' }}>
          <div className="lp-ficha-kpi-label">Cadastrado</div>
          <div className="lp-ficha-kpi-value">10/03/24</div>
        </div>
      </div>

      {/* Resumo do caso */}
      <div className="lp-ficha-health">
        <div className="lp-ficha-health-tag pat-allergy"><Briefcase size={11} /> <strong>Área principal:</strong> Trabalhista</div>
        <div className="lp-ficha-health-tag pat-chronic"><Activity size={11} /> <strong>Status:</strong> Contrato assinado</div>
        <div className="lp-ficha-health-tag pat-meds"><FileText size={11} /> <strong>Honorário:</strong> Êxito 20%</div>
      </div>

      {/* Resumo do caso */}
      <div className="lp-ficha-antro">
        <div><strong>0028</strong><span>Pasta</span></div>
        <div><strong>3</strong><span>Casos</span></div>
        <div><strong>R$ 850</strong><span>1ª consulta</span></div>
        <div><strong>2</strong><span>Reuniões</span></div>
      </div>

      {/* Mini timeline */}
      <div className="lp-ficha-timeline">
        <div className="lp-ficha-tl-line" />
        <div className="lp-ficha-tl-event">
          <div className="lp-ficha-tl-dot" style={{ background: '#2563EB' }} />
          <div>
            <div className="lp-ficha-tl-date">02/05/2026 · 14:30</div>
            <div className="lp-ficha-tl-title">Audiência inicial · Dr. Rafael (Trabalhista)</div>
          </div>
          <span className="lp-ficha-tl-pill" style={{ color: '#2563EB', background: '#DBEAFE' }}>Confirmada</span>
        </div>
        <div className="lp-ficha-tl-event">
          <div className="lp-ficha-tl-dot" style={{ background: '#0891B2' }} />
          <div>
            <div className="lp-ficha-tl-date">22/04/2026 · 10:00</div>
            <div className="lp-ficha-tl-title">Reunião — assinatura de honorários · Dra. Camila</div>
          </div>
          <span className="lp-ficha-tl-pill" style={{ color: '#0891B2', background: '#CFFAFE' }}>Concluída</span>
        </div>
        <div className="lp-ficha-tl-event">
          <div className="lp-ficha-tl-dot" style={{ background: '#9CA3AF' }} />
          <div>
            <div className="lp-ficha-tl-date">10/03/2024</div>
            <div className="lp-ficha-tl-title">Cadastrada no escritório</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function VersatilityCard({ tone, icon, title, description, chip }) {
  return (
    <div className={`lp-versatility-card lp-tone-${tone}`} data-chip={chip ? '1' : undefined}>
      <div className="lp-versatility-icon">{icon}</div>
      <h3 className="lp-versatility-title">{title}</h3>
      <p className="lp-versatility-desc">{description}</p>
      {chip && <span className="lp-vc-chip">{chip}</span>}
    </div>
  )
}

function SecurityItem({ icon, title, description, flag }) {
  return (
    <div className="lp-security-item">
      <div className="lp-security-icon">
        {flag ? <span className="lp-security-flag">{flag}</span> : icon}
      </div>
      <div>
        <h4 className="lp-security-title">{title}</h4>
        <p className="lp-security-desc">{description}</p>
      </div>
    </div>
  )
}

function TestimonialsSection({ items }) {
  const [idx, setIdx] = useState(0)
  const total = items.length
  useEffect(() => {
    if (total <= 1) return
    const t = setInterval(() => setIdx(i => (i + 1) % total), 8000)
    return () => clearInterval(t)
  }, [total])
  const t = items[idx]
  return (
    <section className="lp-testimonial">
      <div className="lp-container">
        <div className="lp-testimonial-card" key={idx}>
          <div className="lp-quote-mark">&ldquo;</div>
          <p className="lp-quote">
            {renderQuote(t)}
          </p>
          <div className="lp-quote-author">
            <div className="lp-avatar">{t.initials}</div>
            <div>
              <div className="lp-author-name">{t.authorName}</div>
              <div className="lp-author-role">{t.authorRole}</div>
            </div>
          </div>
          {total > 1 && (
            <div className="lp-testimonial-nav">
              <button
                className="lp-testimonial-arrow"
                onClick={() => setIdx(i => (i - 1 + total) % total)}
                aria-label="Depoimento anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="lp-testimonial-dots">
                {items.map((_, i) => (
                  <button
                    key={i}
                    className={`lp-testimonial-dot ${i === idx ? 'active' : ''}`}
                    onClick={() => setIdx(i)}
                    aria-label={`Depoimento ${i + 1}`}
                  />
                ))}
              </div>
              <button
                className="lp-testimonial-arrow"
                onClick={() => setIdx(i => (i + 1) % total)}
                aria-label="Próximo depoimento"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function renderQuote(t) {
  // Quebra a quote pra aplicar <em> no highlight e <strong> no fechamento
  let txt = t.quote
  const parts = []
  if (t.highlight && txt.includes(t.highlight)) {
    const [before, after] = txt.split(t.highlight)
    parts.push(before, <em key="hl">{t.highlight}</em>)
    txt = after
  }
  if (t.strong && txt.includes(t.strong)) {
    const [before, after] = txt.split(t.strong)
    parts.push(before, <strong key="st">{t.strong}</strong>, after)
  } else {
    parts.push(txt)
  }
  return parts
}

function ComparisonTable() {
  const groups = [
    { title: 'Plano e equipe', rows: [
      ['Profissionais cadastrados',     'Até 3',         'Até 25',          'Ilimitado'],
      ['Usuários (equipe)',             '5 inclusos',    '20 inclusos',     'Ilimitado'],
      ['Clientes cadastrados',         'Ilimitado',     'Ilimitado',       'Ilimitado'],
      ['Agendas',                       '1',             'Ilimitadas',      'Ilimitadas'],
    ]},
    { title: 'Canais e atendimento', rows: [
      ['WhatsApp',                      '1 instância',   '1 instância',     'Multi-instância'],
      ['Instagram Direct',              false,           '1 conta',         'Multi-conta'],
      ['Digisac (integração)',          true,            true,              true],
      ['IA atendimento 24/7',           'WhatsApp',      'WhatsApp + Insta','Todos os canais'],
      ['Distribuição automática (round-robin)', false,   true,              true],
      ['Templates HSM (fora da janela 24h)',    false,   true,              true],
      ['Setores e atribuição',          true,            true,              true],
      ['Encaminhar conversa entre atendentes', true,     true,              true],
      ['Conversas IA (auditoria)',      true,            true,              true],
    ]},
    { title: 'Clientes e operação', rows: [
      ['Ficha completa (PF/PJ, casos, timeline)', true,   true,              true],
      ['Catálogo (advogados, serviço jurídicos, honorários)', true, true,    true],
      ['Cálculo automático serviço jurídico × honorário',  true, true,           true],
      ['Banner de aniversário',         true,            true,              true],
      ['Kanban de atividades',          '1 quadro',      'Ilimitado',       'Ilimitado'],
    ]},
    { title: 'Métricas', rows: [
      ['Visão geral · Atendimento · Agenda · Leads', true, true,            true],
      ['Equipe · Financeiro',           false,           true,              true],
      ['Comparativo entre filiais',     false,           false,             true],
    ]},
    { title: 'IA avançada', rows: [
      ['IA criando posts no Instagram', false,           false,             'Em breve'],
      ['IA gerando laudos / relatórios',false,           false,             'Em breve'],
    ]},
    { title: 'Integrações e suporte', rows: [
      ['API + integrações custom',      false,           false,             true],
      ['Onboarding',                    'Tutorial auto', 'Setup em 24h',    'Presencial dedicado'],
      ['Suporte',                       'E-mail',        'Prioritário (2h)','Gerente + SLA'],
    ]},
  ]

  function cell(v) {
    if (v === true)  return <Check size={14} className="lp-cmp-yes" />
    if (v === false) return <span className="lp-cmp-no">—</span>
    return <span className="lp-cmp-text">{v}</span>
  }

  return (
    <div className="lp-cmp">
      <div className="lp-cmp-row lp-cmp-head">
        <div className="lp-cmp-cell-feature"></div>
        <div className="lp-cmp-cell-plan">Starter<span>Para começar</span></div>
        <div className="lp-cmp-cell-plan featured">Pro<span>Mais escolhido</span></div>
        <div className="lp-cmp-cell-plan">Business<span>Personalizado</span></div>
      </div>
      {groups.map(g => (
        <div key={g.title} className="lp-cmp-group">
          <div className="lp-cmp-group-title">{g.title}</div>
          {g.rows.map((r, i) => (
            <div key={i} className="lp-cmp-row">
              <div className="lp-cmp-cell-feature">{r[0]}</div>
              <div className="lp-cmp-cell">{cell(r[1])}</div>
              <div className="lp-cmp-cell featured">{cell(r[2])}</div>
              <div className="lp-cmp-cell">{cell(r[3])}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function PricingTier({ name, tier, tagline, features, featured }) {
  return (
    <div className={`lp-plan lp-plan-tier ${featured ? 'featured' : ''}`}>
      {featured && <div className="lp-plan-badge">Mais escolhido</div>}
      <div className="lp-plan-name">{name}</div>
      <div className="lp-plan-tier-label">{tier}</div>
      <p className="lp-plan-tagline">{tagline}</p>
      <ul className="lp-plan-features">
        {features.map(f => (
          <li key={f}><Check size={14} /> {f}</li>
        ))}
      </ul>
      <a
        href="https://wa.me/5561999999999?text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20o%20plano%20NexlaAdv"
        target="_blank"
        rel="noreferrer"
        className={`lp-plan-cta ${featured ? 'featured' : ''}`}>
        Falar com o comercial <ArrowRight size={14} />
      </a>
    </div>
  )
}

function PricingCard({ name, price, tagline, features, cta, featured, badge, custom }) {
  // mantido pra compat — não usado mais na landing pública (substituído por PricingTier)
  return (
    <div className={`lp-plan ${featured ? 'featured' : ''}`}>
      {badge && <div className="lp-plan-badge">{badge}</div>}
      <div className="lp-plan-name">{name}</div>
      <div className="lp-plan-price">
        {custom ? (
          <span className="lp-plan-custom">{price}</span>
        ) : (
          <>
            <span className="lp-plan-currency">R$</span>
            <span className="lp-plan-value">{price}</span>
            <span className="lp-plan-period">/mês</span>
          </>
        )}
      </div>
      <p className="lp-plan-tagline">{tagline}</p>
      <ul className="lp-plan-features">
        {features.map(f => (
          <li key={f}><Check size={14} /> {f}</li>
        ))}
      </ul>
      <Link to="/login" className={`lp-plan-cta ${featured ? 'featured' : ''}`}>
        {cta} <ArrowRight size={14} />
      </Link>
      {!custom && (
        <p className="lp-plan-microcopy">Sem cartão · Setup em 24h</p>
      )}
    </div>
  )
}

function DashboardMock() {
  const [view, setView] = useState('rastreio')

  const VIEWS = [
    { key: 'rastreio',   icon: TrendingUp,    label: 'Rastreio' },
    { key: 'conversas',  icon: MessageSquare, label: 'Conversas' },
    { key: 'agenda',     icon: Calendar,      label: 'Agenda' },
    { key: 'metricas',   icon: BarChart3,     label: 'Métricas' },
    { key: 'catalogo',   icon: Scale,   label: 'Catálogo' },
    { key: 'equipe',     icon: Users,         label: 'Equipe' },
  ]

  const FLOATING = {
    rastreio:  { left: { icon: ScanLine, label: 'Rastreados:', value: '94% dos leads' }, right: { icon: TrendingUp, label: 'Top canal:', value: 'Instagram', green: true } },
    conversas: { left: { icon: Zap, label: 'Tempo médio:', value: '2min 14s' }, right: { icon: TrendingUp, label: 'Conversão:', value: '+47%', green: true } },
    agenda:    { left: { icon: Calendar, label: 'Hoje:', value: '14 atendimentos' }, right: { icon: TrendingUp, label: 'Ocupação:', value: '92%', green: true } },
    metricas:  { left: { icon: TrendingUp, label: 'Faturado:', value: 'R$ 38,4k' }, right: { icon: Sparkles, label: 'Ticket médio:', value: 'R$ 280', green: true } },
    catalogo:  { left: { icon: Scale, label: 'Profissionais:', value: '8 ativos' }, right: { icon: Activity, label: 'Serviço jurídicos:', value: '47', green: true } },
    equipe:    { left: { icon: Headset, label: 'Online agora:', value: '5 atendentes' }, right: { icon: Sparkles, label: 'Resp. média:', value: '1min 22s', green: true } },
  }

  const float = FLOATING[view]

  return (
    <div className="lp-mock">
      <div className="lp-mock-glow" />
      <div className="lp-mock-window">
        <div className="lp-mock-bar">
          <div className="lp-mock-dots">
            <span /><span /><span />
          </div>
          <div className="lp-mock-url">app.medicinamkt.com / {view}</div>
        </div>
        <div className="lp-mock-body">
          <div className="lp-mock-side">
            <div className="lp-mock-logo">M</div>
            {VIEWS.map(v => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                title={v.label}
                className={`lp-mock-nav-item ${view === v.key ? 'active' : ''}`}
              >
                <v.icon size={11} />
              </button>
            ))}
          </div>

          <div className="lp-mock-scene" key={view}>
            {view === 'rastreio'   && <SceneRastreio />}
            {view === 'conversas'  && <SceneConversas />}
            {view === 'agenda'     && <SceneAgenda />}
            {view === 'metricas'   && <SceneMetricas />}
            {view === 'catalogo'   && <SceneCatalogo />}
            {view === 'equipe'     && <SceneEquipe />}
          </div>
        </div>
      </div>

      <div className="lp-mock-floating" key={`fl-${view}`}>
        <div className="lp-mock-stat">
          <float.left.icon size={14} /> {float.left.label} <strong>{float.left.value}</strong>
        </div>
      </div>
      <div className="lp-mock-floating-2" key={`fr-${view}`}>
        <div className={`lp-mock-stat ${float.right.green ? 'green' : ''}`}>
          <float.right.icon size={14} /> {float.right.label} <strong>{float.right.value}</strong>
        </div>
      </div>
    </div>
  )
}

function SceneRastreio() {
  const sources = [
    { name: 'Instagram',     leads: 47, agendou: 18, color: '#E11D48', icon: Instagram },
    { name: 'Indicação',     leads: 29, agendou: 19, color: '#16A34A', icon: Briefcase },
    { name: 'Google Ads',    leads: 24, agendou: 7,  color: '#2563EB', icon: ScanLine },
    { name: 'Meta Ads',      leads: 18, agendou: 5,  color: '#7C3AED', icon: TrendingUp },
    { name: 'Site / Direto', leads: 11, agendou: 4,  color: '#0891B2', icon: Building2 },
  ]
  const total = sources.reduce((s, x) => s + x.leads, 0)
  const totalAgenda = sources.reduce((s, x) => s + x.agendou, 0)
  const max = sources[0].leads
  return (
    <div className="lp-scene-rastreio">
      <div className="lp-scene-header">
        <div>
          <div className="lp-scene-title">Atribuição de leads</div>
          <div className="lp-scene-sub">Últimos 30 dias · {total} leads rastreados</div>
        </div>
        <div className="lp-scene-pill green">{Math.round(totalAgenda / total * 100)}% conversão</div>
      </div>

      <div className="lp-rastreio-list">
        {sources.map(s => {
          const conv = Math.round(s.agendou / s.leads * 100)
          return (
            <div key={s.name} className="lp-rastreio-row">
              <div className="lp-rastreio-icon" style={{ background: `${s.color}18`, color: s.color }}>
                <s.icon size={11} />
              </div>
              <div className="lp-rastreio-info">
                <div className="lp-rastreio-name-row">
                  <span className="lp-rastreio-name">{s.name}</span>
                  <span className="lp-rastreio-num">{s.leads}</span>
                </div>
                <div className="lp-rastreio-bar-wrap">
                  <div className="lp-rastreio-bar" style={{ width: `${(s.leads / max) * 100}%`, background: s.color }} />
                </div>
                <div className="lp-rastreio-meta">
                  <span className="lp-rastreio-agendou">{s.agendou} agendamentos</span>
                  <span
                    className="lp-rastreio-conv"
                    style={{
                      background: conv >= 50 ? '#F0FDF4' : conv >= 25 ? '#FFFBEB' : '#FEF2F2',
                      color: conv >= 50 ? '#16A34A' : conv >= 25 ? '#D97706' : '#DC2626',
                    }}>
                    {conv}% conv.
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SceneConversas() {
  return (
    <>
      <div className="lp-mock-list">
        <div className="lp-mock-list-header">Conversas <span>14</span></div>
        <div className="lp-mock-msg">
          <div className="lp-mock-avatar" style={{ background: '#FEF3C7' }}>M</div>
          <div className="lp-mock-msg-content">
            <div className="lp-mock-msg-name">Maria Silva</div>
            <div className="lp-mock-msg-text">Quero marcar um atendimento...</div>
          </div>
          <div className="lp-mock-tag">📅</div>
        </div>
        <div className="lp-mock-msg active">
          <div className="lp-mock-avatar" style={{ background: '#DBEAFE' }}>R</div>
          <div className="lp-mock-msg-content">
            <div className="lp-mock-msg-name">Roberto Alves</div>
            <div className="lp-mock-msg-text">Tem horário sexta?</div>
          </div>
          <div className="lp-mock-tag green">✓</div>
        </div>
        <div className="lp-mock-msg">
          <div className="lp-mock-avatar" style={{ background: '#FCE7F3' }}>P</div>
          <div className="lp-mock-msg-content">
            <div className="lp-mock-msg-name">Patrícia Souza</div>
            <div className="lp-mock-msg-text">Obrigada! Até amanhã.</div>
          </div>
        </div>
        <div className="lp-mock-msg">
          <div className="lp-mock-avatar" style={{ background: '#D1FAE5' }}>F</div>
          <div className="lp-mock-msg-content">
            <div className="lp-mock-msg-name">Fernando R.</div>
            <div className="lp-mock-msg-text">Confirmado às 14h</div>
          </div>
        </div>
      </div>
      <div className="lp-mock-chat">
        <div className="lp-mock-chat-header">
          <div>
            <div className="lp-mock-chat-name">Roberto Alves</div>
            <div className="lp-mock-chat-meta">Recepção · sob atendimento da IA</div>
          </div>
        </div>
        <div className="lp-mock-bubble client">Tem horário sexta de manhã?</div>
        <div className="lp-mock-bubble ai">
          <div className="lp-mock-bubble-tag"><Sparkles size={9} /> IA</div>
          Tenho terça e quinta às 9h ou 10h. Qual prefere?
        </div>
        <div className="lp-mock-bubble client small">Quinta às 10h</div>
        <div className="lp-mock-bubble ai">
          <div className="lp-mock-bubble-tag"><Sparkles size={9} /> IA</div>
          ✅ Agendado! Quinta 28/04 às 10h com Dra. Camila
        </div>
      </div>
    </>
  )
}

function SceneAgenda() {
  const days = ['Seg 27', 'Ter 28', 'Qua 29', 'Qui 30', 'Sex 01']
  const slots = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
  const appts = {
    '09:00-1': { name: 'Maria S.', color: '#FCD34D' },
    '10:00-2': { name: 'Roberto A.', color: '#4ADE80' },
    '11:00-0': { name: 'Patrícia', color: '#A78BFA' },
    '14:00-3': { name: 'Fernando', color: '#F472B6' },
    '15:00-1': { name: 'Camila N.', color: '#22D3EE' },
    '16:00-4': { name: 'Lucas M.', color: '#FB923C' },
    '08:00-2': { name: 'Júlia P.', color: '#4ADE80' },
  }
  return (
    <div className="lp-scene-agenda">
      <div className="lp-scene-header">
        <div>
          <div className="lp-scene-title">Agenda da semana</div>
          <div className="lp-scene-sub">Dra. Camila · Trabalhista</div>
        </div>
        <div className="lp-scene-pill">Hoje</div>
      </div>
      <div className="lp-cal">
        <div className="lp-cal-row lp-cal-head">
          <div />
          {days.map(d => <div key={d} className={d === 'Ter 28' ? 'today' : ''}>{d}</div>)}
        </div>
        {slots.map(s => (
          <div key={s} className="lp-cal-row">
            <div className="lp-cal-time">{s}</div>
            {[0, 1, 2, 3, 4].map(i => {
              const a = appts[`${s}-${i}`]
              return (
                <div key={i} className="lp-cal-slot">
                  {a && (
                    <div className="lp-cal-appt" style={{ background: a.color }}>
                      {a.name}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function SceneMetricas() {
  const bars = [
    { label: 'Seg', value: 60, color: '#FCD34D' },
    { label: 'Ter', value: 85, color: '#4ADE80' },
    { label: 'Qua', value: 45, color: '#22D3EE' },
    { label: 'Qui', value: 95, color: '#A78BFA' },
    { label: 'Sex', value: 75, color: '#F472B6' },
    { label: 'Sáb', value: 35, color: '#FB923C' },
  ]
  return (
    <div className="lp-scene-metricas">
      <div className="lp-scene-header">
        <div>
          <div className="lp-scene-title">Faturamento</div>
          <div className="lp-scene-sub">Esta semana</div>
        </div>
        <div className="lp-scene-pill green">+24%</div>
      </div>
      <div className="lp-kpi-row">
        <div className="lp-kpi-card" style={{ background: '#FEF3C7' }}>
          <div className="lp-kpi-label">Faturado</div>
          <div className="lp-kpi-value">R$ 38.4k</div>
        </div>
        <div className="lp-kpi-card" style={{ background: '#DCFCE7' }}>
          <div className="lp-kpi-label">Concluídos</div>
          <div className="lp-kpi-value">137</div>
        </div>
        <div className="lp-kpi-card" style={{ background: '#FCE7F3' }}>
          <div className="lp-kpi-label">No-show</div>
          <div className="lp-kpi-value">4%</div>
        </div>
      </div>
      <div className="lp-bars">
        {bars.map((b, i) => (
          <div key={b.label} className="lp-bar-col">
            <div className="lp-bar-track">
              <div
                className="lp-bar-fill"
                style={{ height: `${b.value}%`, background: b.color, animationDelay: `${i * 0.06}s` }}
              />
            </div>
            <div className="lp-bar-label">{b.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SceneCatalogo() {
  const procs = [
    { name: 'Primeira consulta',     price: 'R$ 350', type: 'Avulso', color: '#A78BFA' },
    { name: 'Petição inicial',       price: 'R$ 1.200', type: 'Avulso', color: '#4ADE80' },
    { name: 'Ecocardiograma',        price: 'R$ 420', type: 'Exame',    color: '#4ADE80' },
    { name: 'Holter 24h',            price: 'R$ 580', type: 'Serviço jurídico', color: '#FB923C' },
    { name: 'Teste ergométrico',     price: 'R$ 320', type: 'Serviço jurídico', color: '#FB923C' },
  ]
  return (
    <div className="lp-scene-catalogo">
      <div className="lp-scene-header">
        <div>
          <div className="lp-scene-title">Serviço jurídicos</div>
          <div className="lp-scene-sub">Catálogo da escritório</div>
        </div>
        <div className="lp-scene-pill">Trabalhista</div>
      </div>
      <div className="lp-proc-list">
        {procs.map(p => (
          <div key={p.name} className="lp-proc-row">
            <div className="lp-proc-icon" style={{ background: `${p.color}33`, color: p.color }}>
              <Scale size={11} />
            </div>
            <div className="lp-proc-content">
              <div className="lp-proc-name">{p.name}</div>
              <div className="lp-proc-meta">
                <span style={{ color: p.color, background: `${p.color}22`, padding: '1px 6px', borderRadius: 4, fontWeight: 700, fontSize: 8, textTransform: 'uppercase' }}>{p.type}</span>
              </div>
            </div>
            <div className="lp-proc-price">{p.price}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SceneEquipe() {
  const team = [
    { name: 'Dra. Camila', role: 'Trabalhista',  status: 'online',  load: 4, color: '#A78BFA' },
    { name: 'Dr. Lucas',   role: 'Pediatria',    status: 'online',  load: 6, color: '#4ADE80' },
    { name: 'Dra. Bia',    role: 'Dermatologia', status: 'busy',    load: 8, color: '#F472B6' },
    { name: 'Dr. Hugo',    role: 'Cível',    status: 'online',  load: 3, color: '#FB923C' },
    { name: 'Dra. Lara',   role: 'Família',    status: 'offline', load: 0, color: '#94A3B8' },
  ]
  return (
    <div className="lp-scene-equipe">
      <div className="lp-scene-header">
        <div>
          <div className="lp-scene-title">Equipe</div>
          <div className="lp-scene-sub">5 advogados</div>
        </div>
        <div className="lp-scene-pill green">4 online</div>
      </div>
      <div className="lp-team-list">
        {team.map(t => (
          <div key={t.name} className="lp-team-row">
            <div className="lp-team-avatar" style={{ background: t.color }}>{t.name.split(' ')[1]?.[0] || t.name[0]}</div>
            <div className="lp-team-content">
              <div className="lp-team-name">{t.name}</div>
              <div className="lp-team-role">{t.role}</div>
            </div>
            <div className={`lp-team-status ${t.status}`}>
              {t.status === 'online' ? 'Online' : t.status === 'busy' ? 'Ocupado' : 'Offline'}
            </div>
            <div className="lp-team-load">{t.load} {t.load === 1 ? 'ticket' : 'tickets'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
