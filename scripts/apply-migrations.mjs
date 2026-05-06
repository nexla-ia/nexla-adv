// Aplica todas as migrations de supabase/migrations/ no banco apontado
// por NEW_DB_URL (postgresql://...). Use a connection string DIRECT do banco
// novo (Settings → Database → Connection string → URI) — NÃO o pooler.
//
// Uso (PowerShell):
//   $env:NEW_DB_URL = "postgresql://postgres:<senha>@db.<ref>.supabase.co:5432/postgres"
//   npm run migrate
//
// Estratégia:
//   - Lê todos os .sql em supabase/migrations/ em ordem alfabética
//   - Cada arquivo roda numa transação separada (BEGIN/COMMIT)
//   - Registra em public.__migrations o que já foi aplicado, pra ser
//     idempotente (re-rodar não reaplica)

import pg from 'pg'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const NEW_DB_URL = process.env.NEW_DB_URL
if (!NEW_DB_URL) {
  console.error('Faltando NEW_DB_URL. Exemplo:')
  console.error('  $env:NEW_DB_URL = "postgresql://postgres:<senha>@db.<ref>.supabase.co:5432/postgres"')
  process.exit(1)
}

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations')
const files = readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql') && !f.startsWith('_'))
  .sort()

if (files.length === 0) {
  console.error(`Nenhuma migration encontrada em ${MIGRATIONS_DIR}`)
  process.exit(1)
}

const client = new pg.Client({ connectionString: NEW_DB_URL })
await client.connect()

// Tabela de controle (idempotência)
await client.query(`
  CREATE TABLE IF NOT EXISTS public.__migrations (
    name        text PRIMARY KEY,
    applied_at  timestamptz NOT NULL DEFAULT now()
  )
`)

const { rows: alreadyApplied } = await client.query(
  'SELECT name FROM public.__migrations',
)
const applied = new Set(alreadyApplied.map(r => r.name))

console.log(`${files.length} migration(s) encontradas; ${applied.size} já aplicada(s)`)

let appliedNow = 0
for (const file of files) {
  if (applied.has(file)) {
    console.log(`  ↷ skip   ${file}  (já aplicada)`)
    continue
  }

  const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8')
  process.stdout.write(`  ▸ apply  ${file} ... `)

  try {
    await client.query('BEGIN')
    await client.query(sql)
    await client.query(
      'INSERT INTO public.__migrations (name) VALUES ($1)',
      [file],
    )
    await client.query('COMMIT')
    appliedNow += 1
    console.log('ok')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.log('FALHOU')
    console.error(`\n${file} falhou:`)
    console.error(err.message)
    if (err.position) console.error(`  posição: ${err.position}`)
    if (err.detail)   console.error(`  detalhe: ${err.detail}`)
    if (err.hint)     console.error(`  dica   : ${err.hint}`)
    await client.end()
    process.exit(1)
  }
}

await client.end()
console.log(`\n✓ ${appliedNow} migration(s) aplicada(s); ${applied.size + appliedNow} no total`)
