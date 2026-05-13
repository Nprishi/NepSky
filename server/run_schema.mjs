import fs from 'fs'
import path from 'path'
import 'dotenv/config'
import { Client } from 'pg'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set in environment. Set it in .env or the shell and retry.')
  process.exit(1)
}

const sqlPath = path.resolve(process.cwd(), 'server', 'db_schema.sql')

if (!fs.existsSync(sqlPath)) {
  console.error('Schema file not found at', sqlPath)
  process.exit(1)
}

const sql = fs.readFileSync(sqlPath, 'utf8')

async function run() {
  const client = new Client({ connectionString: DATABASE_URL })
  try {
    console.log('Connecting to', DATABASE_URL.split('@').pop())
    await client.connect()
    console.log('Executing schema SQL...')
    await client.query(sql)
    console.log('Schema applied successfully.')
  } catch (err) {
    console.error('Failed to apply schema:')
    console.error(err && err.message ? err.message : err)
    process.exitCode = 2
  } finally {
    await client.end()
  }
}

run()
