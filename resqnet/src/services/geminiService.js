/**
 * geminiService.js
 * AI chat service with two-tier fallback:
 *   1. Google Gemini (gemini-2.0-flash-lite) via official SDK
 *   2. OpenRouter (free, uses google/gemini-2.0-flash-lite or mistral as backup)
 *   3. Rule-based offline fallback (handled in Chat.jsx)
 *
 * Setup:
 *   - Gemini key: https://aistudio.google.com/app/apikey  → VITE_GEMINI_API_KEY
 *   - OpenRouter key: https://openrouter.ai/keys          → VITE_OPENROUTER_API_KEY
 */
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_KEY      = import.meta.env.VITE_GEMINI_API_KEY
const OPENROUTER_KEY  = import.meta.env.VITE_OPENROUTER_API_KEY

const SYSTEM_PROMPT = `You are RESQNET Assistant for disaster emergencies and preparedness.
Be concise (under 100 words). Use bullet points.
Emergency numbers: 112 (all), 108 (ambulance), 100 (police), 101 (fire).
Help with: pre-disaster preparedness, building emergency kits, family plans, understanding risk zones, first aid, evacuation, flood/fire/earthquake safety, shelter finding.
Respond in user's language (English/Hindi/Tamil).`

// ── Gemini SDK ───────────────────────────────────────────────────
let genAI = null
let gemModel = null

function getGeminiModel() {
  if (!gemModel) {
    genAI    = new GoogleGenerativeAI(GEMINI_KEY)
    gemModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      generationConfig: { temperature: 0.4, maxOutputTokens: 512, topP: 0.8 },
    })
  }
  return gemModel
}

async function askGemini(history, userMessage) {
  const m = getGeminiModel()
  const sdkHistory = [
    { role: 'user',  parts: [{ text: SYSTEM_PROMPT }] },
    { role: 'model', parts: [{ text: 'Ready to help with emergency guidance.' }] },
    ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
  ]
  const chat   = m.startChat({ history: sdkHistory })
  const result = await chat.sendMessage(userMessage)
  return result.response.text().trim()
}

// ── OpenRouter fallback ──────────────────────────────────────────
async function askOpenRouter(history, userMessage) {
  // Keep only last 4 turns to save tokens
  const recentHistory = history.slice(-4)
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...recentHistory.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.text })),
    { role: 'user', content: userMessage },
  ]

  // All free models from your OpenRouter account — tries each until one responds
  const models = [
    'google/gemma-4-26b-a4b-it:free',
    'google/gemma-4-31b-it:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'moonshotai/kimi-k2:free',
    'nousresearch/hermes-3-llama-3.1-405b:free',
    'nvidia/llama-3.3-nemotron-super-49b-v1:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
    'liquid/lfm-2.5-1.2b-instruct:free',
  ]

  for (const model of models) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'HTTP-Referer':  'http://localhost:5173',
          'X-Title':       'RESQNET Emergency Assistant',
        },
        body: JSON.stringify({ model, messages, max_tokens: 512, temperature: 0.4 }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const errMsg = err?.error?.message || err?.message || `HTTP ${res.status}`
        console.warn(`[RESQNET] OpenRouter model ${model} failed:`, res.status, errMsg)
        continue  // try next model regardless of error type
      }

      const data = await res.json()
      const text = data.choices?.[0]?.message?.content?.trim()
      if (text) {
        console.log('[RESQNET] OpenRouter responded via:', model)
        return text
      }
    } catch (e) {
      console.warn(`[RESQNET] OpenRouter model ${model} error:`, e.message)
    }
  }

  throw new Error('All OpenRouter models failed')
}

// ── Public API ───────────────────────────────────────────────────
/**
 * Try Gemini first, fall back to OpenRouter, then throw for rule-based fallback.
 */
export async function sendToGemini(history, userMessage) {
  // Try Gemini SDK first
  if (GEMINI_KEY && GEMINI_KEY !== 'YOUR_GEMINI_API_KEY') {
    try {
      const text = await askGemini(history, userMessage)
      if (text) return text
    } catch (err) {
      const is429 = err?.message?.includes('429') || err?.message?.toLowerCase().includes('quota')
      if (!is429) throw err  // non-quota error — propagate
      // quota hit — fall through to OpenRouter
      console.warn('[RESQNET] Gemini quota hit, trying OpenRouter…')
    }
  }

  // Try OpenRouter
  if (OPENROUTER_KEY && OPENROUTER_KEY !== 'YOUR_OPENROUTER_KEY') {
    try {
      const text = await askOpenRouter(history, userMessage)
      if (text) return text
    } catch (err) {
      console.warn('[RESQNET] OpenRouter failed:', err.message)
    }
  } else {
    console.warn('[RESQNET] OpenRouter key not set — add VITE_OPENROUTER_API_KEY to .env.local')
  }

  // Both unavailable
  throw new Error('ALL_PROVIDERS_FAILED')
}

export const geminiAvailable = () =>
  (!!GEMINI_KEY    && GEMINI_KEY    !== 'YOUR_GEMINI_API_KEY') ||
  (!!OPENROUTER_KEY && OPENROUTER_KEY !== 'YOUR_OPENROUTER_KEY')
