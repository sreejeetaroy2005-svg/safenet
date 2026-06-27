/**
 * useVoiceTrigger.js
 * Continuously listens for emergency trigger words.
 * Fixes: debounced listening state to prevent flicker, longer restart delay.
 */
import { useEffect, useRef, useState, useCallback } from 'react'

const TRIGGER_WORDS = [
  'sos', 'emergency', 'help', 'help me', 'save me', 'danger',
  'fire', 'flood', 'earthquake', 'trapped', 'accident', 'mayday',
  'bachao', 'madad', 'khatra', 'aag', 'udavi', 'aapathu',
]

function hasTriggerWord(transcript) {
  const lower = transcript.toLowerCase().trim()
  return TRIGGER_WORDS.some(w => lower.includes(w))
}

export function useVoiceTrigger(onTrigger, active = true) {
  const [listening,  setListening]  = useState(false)
  const [lastHeard,  setLastHeard]  = useState('')
  const [supported,  setSupported]  = useState(false)

  const recognitionRef  = useRef(null)
  const activeRef       = useRef(active)
  const triggeredRef    = useRef(false)
  const restartTimer    = useRef(null)
  const listenTimer     = useRef(null)   // debounce timer for listening state
  const onTriggerRef    = useRef(onTrigger)

  // Keep refs in sync
  useEffect(() => { activeRef.current  = active },    [active])
  useEffect(() => { onTriggerRef.current = onTrigger }, [onTrigger])

  const setListeningDebounced = useCallback((val) => {
    clearTimeout(listenTimer.current)
    if (val) {
      // Show "listening" immediately when it starts
      setListening(true)
    } else {
      // Delay "not listening" by 1.5s to prevent flicker during auto-restart
      listenTimer.current = setTimeout(() => setListening(false), 1500)
    }
  }, [])

  const stop = useCallback(() => {
    clearTimeout(restartTimer.current)
    clearTimeout(listenTimer.current)
    try { recognitionRef.current?.stop() } catch {}
    recognitionRef.current = null
    setListening(false)
  }, [])

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR || recognitionRef.current) return

    const r = new SR()
    r.continuous     = true
    r.interimResults = true
    r.lang           = 'en-IN'
    r.maxAlternatives = 2

    r.onstart = () => setListeningDebounced(true)

    r.onend = () => {
      recognitionRef.current = null
      setListeningDebounced(false)
      // Restart after 1.5s if still active and not triggered
      if (activeRef.current && !triggeredRef.current) {
        restartTimer.current = setTimeout(start, 1500)
      }
    }

    r.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      recognitionRef.current = null
      setListeningDebounced(false)
      if (activeRef.current && !triggeredRef.current) {
        restartTimer.current = setTimeout(start, 2000)
      }
    }

    r.onresult = (e) => {
      if (triggeredRef.current) return
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript
        setLastHeard(transcript)
        if (hasTriggerWord(transcript)) {
          triggeredRef.current = true
          stop()
          onTriggerRef.current?.(transcript)
          return
        }
      }
    }

    recognitionRef.current = r
    try { r.start() } catch { recognitionRef.current = null }
  }, [stop, setListeningDebounced])

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    setSupported(!!SR)
    if (!SR) return

    if (active) {
      triggeredRef.current = false
      start()
    } else {
      stop()
    }

    return stop
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  return { listening, lastHeard, supported }
}
