// Verifica que o banco novo está com o schema esperado.
// Uso: $env:NEW_DB_URL = "..."; node scripts/verify-schema.mjs

import pg from 'pg'

const NEW_DB_URL = process.env.NEW_DB_URL
if (!NEW_DB_URL) { console.error('Faltando NEW_DB_URL'); process.exit(1) }

const EXPECTED_TABLES = [
  '__migrations', 'agendas', 'alerts', 'appointments', 'attendances',
  'clientes', 'companies', 'contacts', 'conversations', 'insurance_plans',
  'invoices', 'kanban_cards', 'kanban_columns', 'mensagens_geral',
  'procedure_prices', 'procedures', 'professionals', 'saved_contacts',
  'sector_members', 'sectors', 'support_messages', 'support_tickets', 'users',
]

const EXPECTED_FUNCTIONS = [
  'api_agendas_list', 'api_alert_create', 'api_alert_resolve',
  'api_alerts_pending', 'api_appointment_create', 'api_appointment_update_status',
  'api_appointments_busy_slots', 'api_appointments_by_date',
  'api_appointments_by_phone', 'api_conversation_close', 'api_conversation_status',
  'api_insurance_plans_list', 'api_kanban_card_create', 'api_kanban_cards',
  'api_kanban_columns', 'api_message_create', 'api_messages_by_phone',
  'api_paciente_by_phone', 'api_paciente_create', 'api_paciente_delete',
  'api_paciente_update', 'api_pacientes_list', 'api_procedure_price',
  'api_procedures_list', 'api_professionals_list',
  'auto_close_inactive_conversations', 'create_user', 'delete_user',
  'ensure_table_setup', 'insert_alert', 'login_user', 'mark_company_paid',
  'reopen_session_on_new_message', 'send_mensagem_geral', 'support_bump_ticket',
  'update_user_password',
]

const client = new pg.Client({ connectionString: NEW_DB_URL })
await client.connect()

const { rows: tableRows } = await client.query(
  `SELECT table_name FROM information_schema.tables
   WHERE table_schema='public' ORDER BY table_name`,
)
const tables = tableRows.map(r => r.table_name)

const { rows: fnRows } = await client.query(
  `SELECT DISTINCT proname FROM pg_proc p
   JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.prokind = 'f'
   ORDER BY proname`,
)
const fns = fnRows.map(r => r.proname)

const { rows: trgRows } = await client.query(
  `SELECT t.tgname, c.relname AS table_name
   FROM pg_trigger t
   JOIN pg_class c ON c.oid = t.tgrelid
   JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND NOT t.tgisinternal
   ORDER BY c.relname, t.tgname`,
)

await client.end()

function diff(label, got, want) {
  const gotSet = new Set(got)
  const wantSet = new Set(want)
  const missing = want.filter(x => !gotSet.has(x))
  const extra = got.filter(x => !wantSet.has(x))
  console.log(`\n${label}: ${got.length} encontrados (${want.length} esperados)`)
  if (missing.length) console.log(`  ✗ FALTAM:  ${missing.join(', ')}`)
  if (extra.length)   console.log(`  + extras:  ${extra.join(', ')}`)
  if (!missing.length && !extra.length) console.log('  ✓ tudo certo')
  return missing.length === 0
}

const tablesOk = diff('Tables', tables, EXPECTED_TABLES)
const fnsOk    = diff('Functions', fns, EXPECTED_FUNCTIONS)

console.log(`\nTriggers (${trgRows.length}):`)
for (const t of trgRows) console.log(`  ${t.table_name} → ${t.tgname}`)

process.exit(tablesOk && fnsOk ? 0 : 1)
