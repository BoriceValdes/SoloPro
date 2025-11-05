import pg from 'pg'
import bcrypt from 'bcrypt'

const { Pool } = pg

// ⚠️ Config directe pour ton Docker Postgres
// Si tu changes le mot de passe ou le nom de la base dans docker-compose.yml,
// il faudra mettre à jour ces valeurs ici aussi.
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'solopro'
})

async function main() {
  const client = await pool.connect()
  try {
    const passwordHash = await bcrypt.hash('password', 10)

    // user démo
    const userRes = await client.query(
      `INSERT INTO users (email, password, name, token)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['demo@solopro.dev', passwordHash, 'Demo User', 'DEMO_TOKEN']
    )
    const userId = userRes.rows[0].id

    // business
    const bizRes = await client.query(
      `INSERT INTO businesses (owner_id, name, vat_scheme, city, zip)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, 'Studio Démo', 'no_vat_293B', 'Grenoble', '38000']
    )
    const businessId = bizRes.rows[0].id

    // client
    const clientRes = await client.query(
      `INSERT INTO clients (business_id, first_name, last_name, email)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [businessId, 'Alice', 'Martin', 'alice@example.com']
    )
    const clientId = clientRes.rows[0].id

    // service
    const serviceRes = await client.query(
      `INSERT INTO services (business_id, name, duration_min, price_ht, vat_rate)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [businessId, 'Séance de coaching', 60, 80.0, 0.0]
    )
    const serviceId = serviceRes.rows[0].id

    console.log('Seed OK ✅', { userId, businessId, clientId, serviceId })
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((e) => {
  console.error('Seed ERROR ❌', e)
  process.exit(1)
})
