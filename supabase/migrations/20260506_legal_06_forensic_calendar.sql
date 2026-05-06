-- ════════════════════════════════════════════════════════════════════════════
-- Pivô jurídico — parte 6: Calendário forense
--
-- forensic_calendar guarda feriados forenses (federais, estaduais e
-- municipais) + recesso forense (CNJ Resolução 244/2016: 20/12 a 06/01).
-- Usado pra impedir/avisar o usuário ao marcar audiência em dia sem expediente.
--
-- Seed cobre 2026-2027 (federal). Estaduais/municipais ficam pra cada
-- escritório cadastrar manualmente.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.forensic_calendar (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date        date NOT NULL,
  label       text NOT NULL,
  scope       text NOT NULL DEFAULT 'federal' CHECK (scope IN ('federal','estadual','municipal')),
  uf          text,            -- preenchido só pra escopo estadual/municipal
  created_at  timestamptz NOT NULL DEFAULT now()
);
-- Garante 1 entrada por (data, escopo, uf-ou-vazio)
CREATE UNIQUE INDEX IF NOT EXISTS uq_forensic_calendar_date_scope_uf
  ON public.forensic_calendar (date, scope, COALESCE(uf, ''));
CREATE INDEX IF NOT EXISTS idx_forensic_calendar_date ON public.forensic_calendar(date);

-- Seed federal 2026 — feriados nacionais + recesso forense
-- (CNJ Resolução 244/2016: recesso de 20/12 a 06/01 inclusive)
INSERT INTO public.forensic_calendar (date, label, scope) VALUES
  -- 2026
  ('2026-01-01', 'Confraternização Universal', 'federal'),
  ('2026-01-02', 'Recesso forense',            'federal'),
  ('2026-01-03', 'Recesso forense',            'federal'),
  ('2026-01-04', 'Recesso forense',            'federal'),
  ('2026-01-05', 'Recesso forense',            'federal'),
  ('2026-01-06', 'Recesso forense',            'federal'),
  ('2026-02-16', 'Carnaval (segunda)',         'federal'),
  ('2026-02-17', 'Carnaval (terça)',           'federal'),
  ('2026-02-18', 'Quarta-feira de Cinzas',     'federal'),
  ('2026-04-03', 'Sexta-feira Santa',          'federal'),
  ('2026-04-21', 'Tiradentes',                 'federal'),
  ('2026-05-01', 'Dia do Trabalho',            'federal'),
  ('2026-06-04', 'Corpus Christi',             'federal'),
  ('2026-09-07', 'Independência',              'federal'),
  ('2026-10-12', 'N.S. Aparecida',             'federal'),
  ('2026-11-02', 'Finados',                    'federal'),
  ('2026-11-15', 'Proclamação da República',   'federal'),
  ('2026-11-20', 'Consciência Negra',          'federal'),
  ('2026-12-08', 'Dia da Justiça',             'federal'),
  ('2026-12-25', 'Natal',                      'federal'),
  ('2026-12-20', 'Recesso forense',            'federal'),
  ('2026-12-21', 'Recesso forense',            'federal'),
  ('2026-12-22', 'Recesso forense',            'federal'),
  ('2026-12-23', 'Recesso forense',            'federal'),
  ('2026-12-24', 'Recesso forense',            'federal'),
  ('2026-12-26', 'Recesso forense',            'federal'),
  ('2026-12-27', 'Recesso forense',            'federal'),
  ('2026-12-28', 'Recesso forense',            'federal'),
  ('2026-12-29', 'Recesso forense',            'federal'),
  ('2026-12-30', 'Recesso forense',            'federal'),
  ('2026-12-31', 'Recesso forense',            'federal'),
  -- 2027
  ('2027-01-01', 'Confraternização Universal', 'federal'),
  ('2027-01-02', 'Recesso forense',            'federal'),
  ('2027-01-03', 'Recesso forense',            'federal'),
  ('2027-01-04', 'Recesso forense',            'federal'),
  ('2027-01-05', 'Recesso forense',            'federal'),
  ('2027-01-06', 'Recesso forense',            'federal'),
  ('2027-02-08', 'Carnaval (segunda)',         'federal'),
  ('2027-02-09', 'Carnaval (terça)',           'federal'),
  ('2027-02-10', 'Quarta-feira de Cinzas',     'federal'),
  ('2027-03-26', 'Sexta-feira Santa',          'federal'),
  ('2027-04-21', 'Tiradentes',                 'federal'),
  ('2027-05-01', 'Dia do Trabalho',            'federal'),
  ('2027-05-27', 'Corpus Christi',             'federal'),
  ('2027-09-07', 'Independência',              'federal'),
  ('2027-10-12', 'N.S. Aparecida',             'federal'),
  ('2027-11-02', 'Finados',                    'federal'),
  ('2027-11-15', 'Proclamação da República',   'federal'),
  ('2027-11-20', 'Consciência Negra',          'federal'),
  ('2027-12-08', 'Dia da Justiça',             'federal'),
  ('2027-12-25', 'Natal',                      'federal'),
  ('2027-12-20', 'Recesso forense',            'federal'),
  ('2027-12-21', 'Recesso forense',            'federal'),
  ('2027-12-22', 'Recesso forense',            'federal'),
  ('2027-12-23', 'Recesso forense',            'federal'),
  ('2027-12-24', 'Recesso forense',            'federal'),
  ('2027-12-26', 'Recesso forense',            'federal'),
  ('2027-12-27', 'Recesso forense',            'federal'),
  ('2027-12-28', 'Recesso forense',            'federal'),
  ('2027-12-29', 'Recesso forense',            'federal'),
  ('2027-12-30', 'Recesso forense',            'federal'),
  ('2027-12-31', 'Recesso forense',            'federal')
ON CONFLICT DO NOTHING;
