/**
 * Chat.jsx — RESQNET AI Assistant powered by Google Gemini.
 * Falls back to rule-based responses when API key is not set or call fails.
 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Bot, User, ArrowLeft, AlertCircle, Zap, Wifi, WifiOff } from 'lucide-react'
import { useApp } from '../context/useApp'
import { sendToGemini, geminiAvailable } from '../services/geminiService'

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── Rule-based fallback KB (used when Gemini is unavailable) ────
const FALLBACK = [
  { keys: ['first aid','bleeding','wound','cpr','injury'],
    text: `🩹 First Aid:\n1. Call 108 immediately for serious injuries\n2. Stop bleeding with firm pressure\n3. Don't remove embedded objects\n4. CPR: 30 compressions, 2 breaths\n5. Keep victim still and warm` },
  { keys: ['flood','water logging','drowning'],
    text: `🌊 Flood Safety:\n1. Move to higher ground immediately\n2. Never walk through moving water\n3. Disconnect electrical appliances\n4. Call flood control: 1070\n5. Listen to official evacuation orders` },
  { keys: ['fire','smoke','burning'],
    text: `🔥 Fire Emergency:\n1. Call Fire Brigade: 101 now\n2. Crawl low under smoke\n3. Feel doors before opening\n4. Never use elevators\n5. Meet at assembly point outside` },
  { keys: ['earthquake','tremor','shaking'],
    text: `🌍 Earthquake:\n1. DROP, COVER, HOLD ON\n2. Stay away from windows\n3. If outside, move from buildings\n4. Expect aftershocks\n5. Check for injuries after shaking stops` },
  { keys: ['evacuate','evacuation','escape'],
    text: `🚶 Evacuation:\n1. Follow official routes only\n2. Take water, food, ID documents, medicines\n3. Help elderly and disabled neighbors\n4. Register at nearest relief camp\n5. Don't return until authorities clear it` },
  { keys: ['shelter','camp','safe place'],
    text: `🏠 Finding Shelter:\nGo to the Map tab to see nearby shelters, schools, and hospitals. Bring ID. Register with camp authorities on arrival.` },
  { keys: ['helpline','number','call','ambulance','police'],
    text: `📞 Emergency Helplines:\n• All Emergencies: 112\n• Police: 100\n• Ambulance: 108\n• Fire: 101\n• NDMA: 1078\n• Flood Control: 1070` },
  { keys: ['kit', 'bag', 'supply', 'supplies'],
    text: `🎒 Emergency Kit:\n1. Water (3-day supply)\n2. Non-perishable food\n3. Torch & extra batteries\n4. First aid kit & medicines\n5. Important documents in waterproof bag` },
  { keys: ['plan', 'family', 'meeting', 'meet'],
    text: `👨‍👩‍👧 Family Emergency Plan:\n1. Choose an out-of-town contact person\n2. Set a meeting point outside your neighborhood\n3. Know evacuation routes\n4. Keep emergency numbers saved and visible` },
  { keys: ['zone', 'risk', 'hazard'],
    text: `🗺️ Understanding Risk Zones:\n1. Check the Map tab for flood/cyclone zones\n2. Low risk: stay alert\n3. High risk: prepare to evacuate\n4. Red zones: Evacuate immediately when warned` },
  { keys: ['alert', 'warning', 'issued', 'weather alert'],
    text: `⚠️ When Alert is Issued:\n1. Tune in to official broadcasts (Radio/TV)\n2. Secure outdoor objects\n3. Charge mobile phones/power banks\n4. Review your emergency checklist\n5. Prepare to evacuate if ordered` },
]

function getFallbackResponse(msg) {
  const lower = msg.toLowerCase()
  for (const entry of FALLBACK) {
    if (entry.keys.some(k => lower.includes(k))) return entry.text
  }
  if (/hi|hello|hey|namaste/.test(lower))
    return "👋 Hi! I'm RESQNET Assistant. Ask me about first aid, evacuation, flood/fire/earthquake safety, shelter, or helplines."
  return "I can help with:\n• First aid & CPR\n• Flood / Fire / Earthquake safety\n• Evacuation steps\n• Finding shelter\n• Emergency helplines (112, 108, 100)"
}

const SUGGESTIONS = ['Emergency kit items', 'Family emergency plan', 'Understand risk zones', 'What to do during alerts', 'First aid help', 'Emergency numbers']

export default function Chat() {
  const navigate = useNavigate()
  const { sosStage } = useApp()
  const panicMode = sosStage === 'sent'

  const [messages, setMessages] = useState([{
    id: 1,
    role: 'model',
    text: geminiAvailable()
      ? "👋 Hello! I'm RESQNET Assistant powered by Gemini AI. Ask me anything about emergency response, first aid, evacuation, or disaster safety."
      : "👋 Hello! I'm RESQNET Assistant. Ask me about first aid, evacuation, flood/fire/earthquake safety, or finding shelters.",
  }])
  const [input,   setInput]   = useState('')
  const [typing,  setTyping]  = useState(false)
  const [error,   setError]   = useState(null)
  const bottomRef = useRef(null)

  // Keep only last 10 exchanges in history to stay within token limits
  const historyRef = useRef([])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || typing) return
    setInput('')
    setError(null)

    const userMsg = { id: Date.now(), role: 'user', text: msg }
    setMessages(prev => [...prev, userMsg])
    setTyping(true)

    // Update history for Gemini context (keep last 10 turns)
    historyRef.current = [...historyRef.current, { role: 'user', text: msg }].slice(-10)

    let reply
    if (geminiAvailable()) {
      try {
        reply = await sendToGemini(historyRef.current.slice(-4), msg)
        historyRef.current.push({ role: 'model', text: reply })
        setError(null)
      } catch (err) {
        if (err.message === 'NO_API_KEY' || err.message === 'ALL_PROVIDERS_FAILED') {
          reply = getFallbackResponse(msg)
          if (err.message === 'ALL_PROVIDERS_FAILED') setError('AI unavailable — offline mode active.')
        } else if (err.message?.includes('429') || err.message?.includes('quota')) {
          setError('Gemini quota exceeded — switched to offline mode.')
          reply = getFallbackResponse(msg)
        } else {
          reply = getFallbackResponse(msg)
        }
      }
    } else {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 300))
      reply = getFallbackResponse(msg)
    }

    setTyping(false)
    setMessages(prev => [...prev, { id: Date.now() + 1, role: 'model', text: reply }])
  }

  const bg      = panicMode ? 'bg-red-950' : 'bg-slate-50 dark:bg-[#0a0a0f]'
  const headerBg = panicMode ? 'bg-red-900 border-red-800' : 'bg-white dark:bg-[#0f0f1a] border-gray-100 dark:border-white/5'
  const botBubble = panicMode ? 'bg-red-900 text-red-100' : 'bg-white dark:bg-[#141420] text-gray-800 dark:text-gray-200 shadow-sm'
  const inputBg   = panicMode ? 'bg-red-900 text-white placeholder-red-400 focus:ring-red-500' : 'input-field'
  const suggBg    = panicMode ? 'bg-red-800 text-red-200' : 'bg-gray-100 dark:bg-white/8 text-gray-600 dark:text-gray-400'

  return (
    <div className={`flex flex-col pb-20 md:pb-0 md:h-[calc(100vh-4rem)] ${bg}`}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-4 pt-4 pb-3 border-b ${headerBg}`}>
        <button onClick={() => navigate(-1)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${panicMode ? 'bg-red-800' : 'bg-gray-100 dark:bg-white/8'}`}>
          <ArrowLeft size={17} className={panicMode ? 'text-white' : ''} />
        </button>

        <div className="flex items-center gap-2.5 flex-1">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${panicMode ? 'bg-red-600' : 'bg-gradient-to-br from-blue-500 to-violet-600'}`}>
            {panicMode ? <AlertCircle size={17} className="text-white" /> : <Bot size={17} className="text-white" />}
          </div>
          <div>
            <p className={`font-bold text-sm ${panicMode ? 'text-white' : ''}`}>RESQNET Assistant</p>
            <div className="flex items-center gap-1.5">
              {geminiAvailable()
                ? <><span className="w-1.5 h-1.5 bg-green-400 rounded-full" /><span className="text-[10px] text-green-500 font-semibold">Gemini AI</span></>
                : <><span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" /><span className="text-[10px] text-yellow-500 font-semibold">Offline Mode</span></>
              }
              {panicMode && <span className="text-[10px] text-red-300 font-bold ml-1">🆘 Emergency Mode</span>}
            </div>
          </div>
        </div>

        {panicMode && (
          <button onClick={() => navigate('/sos')}
            className="flex items-center gap-1 bg-red-600 text-white text-xs px-3 py-1.5 rounded-xl font-bold">
            <Zap size={11} /> SOS
          </button>
        )}
      </div>

      {/* API key notice */}
      {!geminiAvailable() && (
        <div className="mx-4 mt-3 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-3 py-2">
          <WifiOff size={13} className="text-yellow-500 shrink-0" />
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            Add <code className="font-mono bg-yellow-500/20 px-1 rounded">VITE_GEMINI_API_KEY</code> to .env.local for AI responses
          </p>
        </div>
      )}

      {/* Error notice */}
      {error && (
        <div className="mx-4 mt-2 flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-2xl px-3 py-2">
          <AlertCircle size={13} className="text-orange-500 shrink-0" />
          <p className="text-xs text-orange-600 dark:text-orange-400">{error}</p>
        </div>
      )}

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-3 ${bg}`}>
        {messages.map(m => (
          <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'model' ? (panicMode ? 'bg-red-600' : 'bg-gradient-to-br from-blue-500 to-violet-600') : 'bg-gray-200 dark:bg-gray-700'}`}>
              {m.role === 'model'
                ? <Bot size={14} className="text-white" />
                : <User size={14} className="text-gray-600 dark:text-gray-300" />}
            </div>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
              m.role === 'model'
                ? `${botBubble} rounded-tl-sm`
                : 'bg-blue-600 text-white rounded-tr-sm'
            }`}>
              {m.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="flex gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${panicMode ? 'bg-red-600' : 'bg-gradient-to-br from-blue-500 to-violet-600'}`}>
              <Bot size={14} className="text-white" />
            </div>
            <div className={`px-4 py-3 rounded-2xl rounded-tl-sm ${panicMode ? 'bg-red-900' : 'bg-white dark:bg-[#141420] shadow-sm'}`}>
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className={`px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar ${bg}`}>
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => send(s)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${suggBg}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className={`px-4 pb-4 flex gap-2 ${bg}`}>
        <input
          className={`flex-1 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all ${
            panicMode
              ? 'bg-red-900 text-white placeholder-red-400 border border-red-700 focus:ring-red-500'
              : 'input-field'
          }`}
          placeholder={panicMode ? 'Ask for emergency help…' : 'Ask about first aid, evacuation…'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={typing}
        />
        <button onClick={() => send()} disabled={!input.trim() || typing}
          className={`p-3 rounded-2xl transition-colors disabled:opacity-40 ${
            panicMode ? 'bg-red-600 text-white' : 'bg-gradient-to-br from-blue-500 to-violet-600 text-white disabled:bg-gray-300 dark:disabled:bg-gray-700'
          }`}>
          <Send size={17} />
        </button>
      </div>
    </div>
  )
}
