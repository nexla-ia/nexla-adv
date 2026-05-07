// Cria (ou atualiza) o usuário ADM Global no banco apontado por NEW_DB_URL.
//
// Uso:
//   $env:NEW_DB_URL = "postgresql://..."
//   node scripts/create-admin.mjs admin@nexla.ai SuaSenha123!
//
// Idempotente — se o e-mail já existir, atualiza nome/role/senha/ativo.

import pg from 'pg'

const NEW_DB_URL = process.env.NEW_DB_URL
if (!NEW_DB_URL) {
  console.error('Faltando NEW_DB_URL. Exemplo (PowerShell):')
  console.error('  $env:NEW_DB_URL = "postgresql://postgres.<ref>:<senha>@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"')
  process.exit(1)
}

const [, , email, password, name = 'Admin Nexla'] = process.argv
if (!email || !password) {
  console.error('Uso: node scripts/create-admin.mjs <email> <senha> [nome]')
  process.exit(1)
}

const client = new pg.Client({ connectionString: NEW_DB_URL })
await client.connect()

try {
  // Garantir extensão pgcrypto (já deve estar instalada via baseline)
  await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`)

  // UPSERT por email — usa crypt(senha, gen_salt('bf')) para hash bcrypt
  const { rows } = await client.query(
    `
    INSERT INTO public.users (name, email, password_hash, role, active, company_id)
    VALUES ($1, $2, crypt($3, gen_salt('bf')), 'adm', true, NULL)
    ON CONFLICT (email) DO UPDATE
       SET name          = EXCLUDED.name,
           password_hash = EXCLUDED.password_hash,
           role          = 'adm',
           active        = true,
           company_id    = NULL
     RETURNING id, name, email, role, active, company_id, created_at
    `,
    [name, email, password],
  )

  const u = rows[0]
  console.log('\n✓ ADM Global pronto:')
  console.log('  id        :', u.id)
  console.log('  name      :', u.name)
  console.log('  email     :', u.email)
  console.log('  role      :', u.role)
  console.log('  active    :', u.active)
  console.log('  company_id:', u.company_id)
  console.log('  created_at:', u.created_at)
  console.log('\nLogin: aba "ADM Global" no /login com este e-mail e senha.\n')
} finally {
  await client.end()
}
