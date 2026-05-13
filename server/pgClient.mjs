import { Pool } from 'pg'
import 'dotenv/config'

let pool = null
let enabled = false

function hasPgConfig() {
  if (process.env.DATABASE_URL) return true
  return !!(process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE)
}

if (hasPgConfig()) {
  const poolConfig = {}
  if (process.env.DATABASE_URL) {
    poolConfig.connectionString = process.env.DATABASE_URL
  } else {
    poolConfig.host = process.env.PGHOST
    poolConfig.user = process.env.PGUSER
    poolConfig.password = process.env.PGPASSWORD
    poolConfig.database = process.env.PGDATABASE
    if (process.env.PGPORT) poolConfig.port = parseInt(process.env.PGPORT, 10)
  }

  if (process.env.PGSSLMODE === 'require') {
    poolConfig.ssl = { rejectUnauthorized: false }
  }

  pool = new Pool(poolConfig)
  enabled = true
}

export const isPgEnabled = () => enabled

export async function query(text, params) {
  if (!enabled) {
    throw new Error('Postgres client is not configured. Set DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE.')
  }

  const client = await pool.connect()
  try {
    const res = await client.query(text, params)
    return res
  } finally {
    client.release()
  }
}
