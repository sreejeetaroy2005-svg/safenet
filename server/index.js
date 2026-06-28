/**
 * SafeNet Backend — Express proxy server
 * Deployed on Render. Keeps API keys server-side only.
 *
 * Routes:
 *   POST /api/chat      → OpenRouter chat completions
 *   POST /api/damage    → OpenRouter vision (damage assessment)
 *   GET  /api/weather   → OpenWeatherMap current weather
 *   GET  /api/health    → health check
 */

import express    from 'express'
import cors       from 'cors'
import dotenv     from 'dotenv'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 3001

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY
const WEATHER_KEY    = process.env.WEATHER_API_KEY
const FRONTEND_URL   = process.env.FRONTEND_URL || '*'

// ── Middleware ────────────────────────────────────────────────────
app.use(express.json({ limit: '20mb' })) // large for base64 images
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST'],
}))

// ── Health check ─────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    openrouter: !!OPENROUTER_KEY,
    weather:    !!WEATHER_KEY,
    timestamp:  new Date().toISOString(),
  })
})

// ── POST /api/chat ────────────────────────────────────────────────
// Body: { model, messages, max_tokens, temperature }
app.post('/api/chat', async (req, res) => {
  if (!OPENROUTER_KEY) {
    return res.status(503).json({ error: 'OpenRouter key not configured on server' })
  }

  const { model, messages, max_tokens = 512, temperature = 0.4 } = req.body
  if (!model || !messages) {
    return res.status(400).json({ error: 'model and messages are required' })
  }

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'HTTP-Referer':  FRONTEND_URL,
        'X-Title':       'SafeNet Emergency Assistant',
      },
      body: JSON.stringify({ model, messages, max_tokens, temperature }),
    })

    const data = await upstream.json()

    if (!upstream.ok) {
      console.warn('[chat] OpenRouter error:', upstream.status, data?.error?.message)
      return res.status(upstream.status).json({ error: data?.error?.message || 'OpenRouter error' })
    }

    res.json(data)
  } catch (err) {
    console.error('[chat] proxy error:', err.message)
    res.status(502).json({ error: 'Upstream request failed' })
  }
})

// ── POST /api/damage ──────────────────────────────────────────────
// Body: { model, messages, max_tokens, temperature }
// messages[0].content includes base64 image_url content
app.post('/api/damage', async (req, res) => {
  if (!OPENROUTER_KEY) {
    return res.status(503).json({ error: 'OpenRouter key not configured on server' })
  }

  const { model, messages, max_tokens = 300, temperature = 0.1 } = req.body
  if (!model || !messages) {
    return res.status(400).json({ error: 'model and messages are required' })
  }

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'HTTP-Referer':  FRONTEND_URL,
        'X-Title':       'SafeNet Damage Assessment',
      },
      body: JSON.stringify({ model, messages, max_tokens, temperature }),
    })

    const data = await upstream.json()

    if (!upstream.ok) {
      console.warn('[damage] OpenRouter error:', upstream.status, data?.error?.message)
      return res.status(upstream.status).json({ error: data?.error?.message || 'OpenRouter error' })
    }

    res.json(data)
  } catch (err) {
    console.error('[damage] proxy error:', err.message)
    res.status(502).json({ error: 'Upstream request failed' })
  }
})

// ── GET /api/weather ──────────────────────────────────────────────
// Query: ?lat=xx&lon=yy
app.get('/api/weather', async (req, res) => {
  if (!WEATHER_KEY) {
    return res.status(503).json({ error: 'Weather key not configured on server' })
  }

  const { lat, lon } = req.query
  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon query params are required' })
  }

  try {
    const upstream = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_KEY}&units=metric`
    )
    const data = await upstream.json()

    if (!upstream.ok) {
      console.warn('[weather] OWM error:', upstream.status, data?.message)
      return res.status(upstream.status).json({ error: data?.message || 'Weather API error' })
    }

    res.json(data)
  } catch (err) {
    console.error('[weather] proxy error:', err.message)
    res.status(502).json({ error: 'Upstream request failed' })
  }
})

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`SafeNet backend running on port ${PORT}`)
  console.log(`OpenRouter: ${OPENROUTER_KEY ? '✓ configured' : '✗ missing'}`)
  console.log(`Weather:    ${WEATHER_KEY    ? '✓ configured' : '✗ missing'}`)
})
