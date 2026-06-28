/**
 * geminiService.js
 * AI chat — calls the SafeNet backend proxy on Render.
 * Falls back to rule-based offline responses (handled in Chat.jsx).
 *
 * The backend (server/index.js) holds the real API keys.
 * VITE_API_URL must be set to your Render backend URL in .env.local
 */
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY
const API_URL    = import.meta.env.VITE_API_URL  // e.g. https://safenet-backend.onrender.com

const SYSTEM_PROMPT = `You are SafeNet Assistant for disaster emergencies and preparedness.
Be concise (under 100 words). Use bullet points.
Emergency numbers: 112 (all), 108 (ambulance), 100 (police), 101 (fire).
Help with: pre-disaster preparedness, building emergency kits, family plans, understanding risk zones, first aid, evacuation, flood/fire/earthquake safety, shelter finding.
Respond in user's language (English/Hindi/Tamil).`

// ── Gemini SDK (client-side, key stays in .env.local) ────────────
let genAI    = null
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

// ── OpenRouter via Render backend ────────────────────────────────
async function askOpenRouter(history, userMessage) {
  if (!API_URL) throw new Error('VITE_API_URL not set')

  const recentHistory = history.slice(-4)
  const messages = [
    { role: 'system',    content: SYSTEM_PROMPT },
    ...recentHistory.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.text })),
    { role: 'user', content: userMessage },
  ]

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
      const res = await fetch(`${API_URL}/api/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ model, messages, max_tokens: 512, temperature: 0.4 }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.warn(`[SAFENET] Backend chat model ${model} failed:`, res.status, err.error)
        continue
      }

      const data = await res.json()
      const text = data.choices?.[0]?.message?.content?.trim()
      if (text) {
        console.log('[SAFENET] Backend responded via:', model)
        return text
      }
    } catch (e) {
      console.warn(`[SAFENET] Backend chat error (${model}):`, e.message)
    }
  }

  throw new Error('All OpenRouter models failed')
}

// ── Public API ───────────────────────────────────────────────────
export async function sendToGemini(history, userMessage) {
  // 1. Try Gemini SDK (client-side key — optional)
  if (GEMINI_KEY && GEMINI_KEY !== 'YOUR_GEMINI_API_KEY') {
    try {
      const text = await askGemini(history, userMessage)
      if (text) return text
    } catch (err) {
      const is429 = err?.message?.includes('429') || err?.message?.toLowerCase().includes('quota')
      if (!is429) throw err
      console.warn('[SAFENET] Gemini quota hit, trying backend OpenRouter…')
    }
  }

  // 2. Try OpenRouter via backend proxy
  if (API_URL) {
    try {
      const text = await askOpenRouter(history, userMessage)
      if (text) return text
    } catch (err) {
      console.warn('[SAFENET] Backend OpenRouter failed:', err.message)
    }
  } else {
    console.warn('[SAFENET] VITE_API_URL not set — backend proxy unavailable')
  }

  throw new Error('ALL_PROVIDERS_FAILED')
}

export const geminiAvailable = () =>
  (!!GEMINI_KEY && GEMINI_KEY !== 'YOUR_GEMINI_API_KEY') ||
  !!API_URL
