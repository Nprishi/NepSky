import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { supabase } from './supabaseClient.mjs'
import { query as pgQuery, isPgEnabled } from './pgClient.mjs'

const app = express()
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.get('/flights', async (req, res) => {
  const { data, error } = await supabase.from('flights').select('*').limit(50)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.get('/pg/flights', async (req, res) => {
  if (!isPgEnabled()) {
    return res.status(503).json({ error: 'Postgres is not configured on the server. Set DATABASE_URL or PG* env vars.' })
  }

  app.get('/recommendations', async (req, res) => {
    try {
      const { userId } = req.query

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' })
      }

      const results = await getRecommendations(userId)

      res.json(results)
    } catch (error) {
      console.log(error)
      res.status(500).json({ error: error.message })
    }
  })

  try {
    const result = await pgQuery('SELECT * FROM flights LIMIT 50')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

async function getRecommendations(userId) {
  // 1. Get all flights (same source as /flights)
  const { data: flights } = await supabase
    .from('flights')
    .select('*')
    .limit(100)

  // 2. Get user booking history
  const { data: bookings } = await supabase
    .from('myorder') // change if your table name differs
    .select('*')
    .eq('customer_id', userId)

  // 3. Build Collaborative Filtering map
  const routeFrequency = {}

  bookings?.forEach((b) => {
    const key = `${b.from_location}-${b.to_location}`
    routeFrequency[key] = (routeFrequency[key] || 0) + 1
  })

  // 4. Score flights (BM25 + CF hybrid)
  const scoredFlights = flights.map((f) => {
    const key = `${f.from_location}-${f.to_location}`


    let bm25 = 0

    const text = `${f.from_location} ${f.to_location}`.toLowerCase()

    if (text.includes('kathmandu')) bm25 += 0.4
    if (text.includes('dubai')) bm25 += 0.4
    if (text.includes('singapore')) bm25 += 0.2

    // Collaborative Filtering
    const cf = routeFrequency[key]
      ? Math.min(routeFrequency[key] * 0.3, 1)
      : 0.2

    // Final Score
    const score = 0.6 * bm25 + 0.4 * cf

    return {
      ...f,
      score,
    }
  })

  // sort best flights first
  scoredFlights.sort((a, b) => b.score - a.score)

  return scoredFlights.slice(0, 6)
}

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Server listening on ${port}`))
