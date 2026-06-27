/**
 * VoiceCommandButton.jsx
 * Floating mic button that listens for voice commands and navigates accordingly.
 */
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, X } from 'lucide-react'
import { startListening, isSupported } from '../services/voiceCommandService'

export default function VoiceCommandButton() {
  const navigate = useNavigate()
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [result, setResult] = useState(null)
  const stopRef = useRef(null)

  if (!isSupported()) return null

  const handleListen = () => {
    if (listening) { stopRef.current?.(); setListening(false); return }
    setTranscript(''); setResult(null)
    setListening(true)
    stopRef.current = startListening(
      (cmd, raw) => {
        setListening(false)
        setTranscript(raw || '')
        if (cmd) {
          setResult(cmd)
          setTimeout(() => {
            if (cmd.path) navigate(cmd.path)
            else if (cmd.call) window.location.href = `tel:${cmd.call}`
            setResult(null); setTranscript('')
          }, 1200)
        }
      },
      (raw) => setTranscript(raw)
    )
  }

  return (
    <div className="relative">
      <button onClick={handleListen}
        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${listening ? 'bg-red-500/20 border border-red-500/40 text-red-500 animate-pulse' : 'bg-gray-100 dark:bg-white/8 border border-gray-200 dark:border-white/10 text-gray-500'}`}>
        {listening ? <MicOff size={17} /> : <Mic size={17} />}
      </button>

      {(listening || transcript) && (
        <div className="absolute top-12 right-0 w-56 bg-white dark:bg-[#141420] border border-gray-200 dark:border-white/10 rounded-2xl p-3 shadow-xl z-50">
          {listening && (
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <p className="text-xs font-bold text-red-500">Listening…</p>
            </div>
          )}
          {transcript && <p className="text-xs text-gray-600 dark:text-gray-400 italic">"{transcript}"</p>}
          {result && <p className="text-xs font-bold text-green-500 mt-1">→ {result.action}</p>}
          <p className="text-[10px] text-gray-400 mt-2">Say: "Send SOS", "Find shelter", "Call ambulance"</p>
        </div>
      )}
    </div>
  )
}
