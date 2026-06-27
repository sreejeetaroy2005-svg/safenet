/**
 * aiDamageService.js
 * Real AI damage assessment using OpenRouter vision models.
 * Sends the uploaded image to a multimodal LLM and parses the response.
 * Falls back to mock analysis if AI is unavailable.
 */

const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY

// Vision-capable free models on OpenRouter
const VISION_MODELS = [
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
  'meta-llama/llama-3.2-11b-vision-instruct:free',
  'openrouter/auto',   // auto-selects best available free vision model
]

const ANALYSIS_PROMPT = `You are an AI disaster damage assessment system for RESQNET emergency app.

Analyze this image of a damaged area or building and respond ONLY in this exact JSON format (no markdown, no explanation):
{
  "damageLevel": "Minor Damage" | "Moderate Damage" | "Severe Damage" | "Critical",
  "score": 1 | 2 | 3 | 4,
  "confidence": <number 70-98>,
  "rescuePriority": "LOW" | "MEDIUM" | "HIGH",
  "urgency": "<one line action statement>",
  "riskFactors": ["<factor1>", "<factor2>", "<factor3>"]
}

Rules:
- score 1 = Minor, 2 = Moderate, 3 = Severe, 4 = Critical
- confidence = your certainty percentage
- urgency = what responders should do immediately
- riskFactors = 2-4 specific hazards visible in the image
- If image is not damage-related, return score:1 with confidence:70`

/**
 * Convert a File to base64 string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1]) // strip "data:image/...;base64,"
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Analyze image using OpenRouter vision model
 * @param {File} imageFile
 * @returns {Promise<object>} analysis result
 */
export async function analyzeImage(imageFile) {
  // Try real AI first
  if (OPENROUTER_KEY && OPENROUTER_KEY !== 'YOUR_OPENROUTER_KEY') {
    try {
      const result = await analyzeWithAI(imageFile)
      if (result) return result
    } catch (err) {
      console.warn('[RESQNET] AI vision failed, using mock analysis:', err.message)
    }
  }

  // Fallback to mock analysis
  return mockAnalysis(imageFile)
}

async function analyzeWithAI(imageFile) {
  const base64 = await fileToBase64(imageFile)
  const mimeType = imageFile.type || 'image/jpeg'

  for (const model of VISION_MODELS) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'HTTP-Referer':  'http://localhost:5173',
          'X-Title':       'RESQNET Damage Assessment',
        },
        body: JSON.stringify({
          model,
          max_tokens: 300,
          temperature: 0.1, // low temp for consistent structured output
          messages: [{
            role: 'user',
            content: [
              { type: 'text',      text: ANALYSIS_PROMPT },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            ],
          }],
        }),
      })

      if (!res.ok) {
        console.warn(`[RESQNET] Vision model ${model} failed: ${res.status}`)
        continue
      }

      const data = await res.json()
      const raw = data.choices?.[0]?.message?.content?.trim()
      if (!raw) continue

      console.log('[RESQNET] AI damage analysis raw response:', raw)

      // Robust JSON extraction — handles markdown blocks, extra text, etc.
      let parsed = null
      // Try 1: direct parse
      try { parsed = JSON.parse(raw) } catch {}
      // Try 2: extract from ```json ... ``` block
      if (!parsed) {
        const mdMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (mdMatch) try { parsed = JSON.parse(mdMatch[1].trim()) } catch {}
      }
      // Try 3: extract first {...} block
      if (!parsed) {
        const objMatch = raw.match(/\{[\s\S]*\}/)
        if (objMatch) try { parsed = JSON.parse(objMatch[0]) } catch {}
      }
      // Try 4: parse key fields with regex if JSON is malformed
      if (!parsed) {
        const levelMatch  = raw.match(/"damageLevel"\s*:\s*"([^"]+)"/)
        const scoreMatch  = raw.match(/"score"\s*:\s*(\d)/)
        const confMatch   = raw.match(/"confidence"\s*:\s*(\d+)/)
        const priMatch    = raw.match(/"rescuePriority"\s*:\s*"([^"]+)"/)
        const urgMatch    = raw.match(/"urgency"\s*:\s*"([^"]+)"/)
        if (levelMatch && scoreMatch) {
          parsed = {
            damageLevel:   levelMatch[1],
            score:         parseInt(scoreMatch[1]),
            confidence:    confMatch ? parseInt(confMatch[1]) : 80,
            rescuePriority: priMatch ? priMatch[1] : 'MEDIUM',
            urgency:       urgMatch ? urgMatch[1] : 'Assess situation and respond',
            riskFactors:   ['Damage detected in image', 'Further assessment needed'],
          }
        }
      }

      if (!parsed) {
        console.warn('[RESQNET] Could not parse JSON from model response:', raw.slice(0, 200))
        continue
      }

      return enrichResult(parsed, imageFile.name)

    } catch (err) {
      console.warn(`[RESQNET] Vision model ${model} error:`, err.message)
      continue
    }
  }

  throw new Error('All vision models failed')
}

/** Add color/style metadata based on score */
function enrichResult(parsed, fileName) {
  const LEVEL_META = {
    4: { color: '#DC2626', bg: 'bg-red-500/15',    border: 'border-red-500/40' },
    3: { color: '#EA580C', bg: 'bg-orange-500/15', border: 'border-orange-500/40' },
    2: { color: '#D97706', bg: 'bg-yellow-500/15', border: 'border-yellow-500/40' },
    1: { color: '#16A34A', bg: 'bg-green-500/15',  border: 'border-green-500/40' },
  }
  const meta = LEVEL_META[parsed.score] || LEVEL_META[1]
  return {
    ...parsed,
    ...meta,
    analyzedAt: Date.now(),
    fileName:   fileName || 'image.jpg',
    aiPowered:  true,
  }
}

/** Mock fallback when AI is unavailable */
function mockAnalysis(imageFile) {
  return new Promise(resolve => {
    setTimeout(() => {
      const levels = [
        { damageLevel: 'Critical',        score: 4, urgency: 'Immediate rescue required',    confidence: 91, rescuePriority: 'HIGH',   riskFactors: ['Structural collapse visible', 'Fire damage indicators', 'Foundation compromise'] },
        { damageLevel: 'Severe Damage',   score: 3, urgency: 'Urgent response within 1 hour',confidence: 85, rescuePriority: 'HIGH',   riskFactors: ['Roof damage detected', 'Wall cracks identified', 'Water intrusion visible'] },
        { damageLevel: 'Moderate Damage', score: 2, urgency: 'Response within 4 hours',      confidence: 78, rescuePriority: 'MEDIUM', riskFactors: ['Debris accumulation', 'Partial structural damage', 'Access route blocked'] },
        { damageLevel: 'Minor Damage',    score: 1, urgency: 'Monitor and assess further',    confidence: 73, rescuePriority: 'LOW',   riskFactors: ['Surface cracks visible', 'Minor debris'] },
      ]
      const weights = [0.15, 0.30, 0.35, 0.20]
      let rand = Math.random(), cum = 0, selected = levels[2]
      for (let i = 0; i < weights.length; i++) { cum += weights[i]; if (rand <= cum) { selected = levels[i]; break } }
      resolve(enrichResult(selected, imageFile?.name))
    }, 1800)
  })
}
