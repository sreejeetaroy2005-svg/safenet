/**
 * SOS.jsx — Advanced SOS with category selection, priority system,
 * voice recording, live GPS watch, offline queue, and voice commands.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../context/useApp'
import { AlertCircle, MapPin, CheckCircle, XCircle, Loader, Mic, MicOff, X, WifiOff, Navigation, ChevronDown, Radio } from 'lucide-react'
import { getCurrentLocation } from '../services/locationService'
import { queueSosOffline } from '../services/offlineSync'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useVoiceTrigger } from '../hooks/useVoiceTrigger'
import { SOS_CATEGORIES, getCategoryById, PRIORITY_LABELS, PRIORITY_COLORS } from '../services/sosCategories'
import { useTranslation } from '../services/i18n'
import VoiceCommandButton from '../components/VoiceCommandButton'

export default function SOS() {
  const { user, sosStage, setSosStage, location, setLocation, addSosAlert, lang } = useApp()
  const { t } = useTranslation(lang)
  const online = useOnlineStatus()

  const [selectedCategory, setSelectedCategory] = useState(SOS_CATEGORIES[0])
  const [voiceTriggered,   setVoiceTriggered]   = useState(false)
  const [voiceWord,        setVoiceWord]        = useState('')
  const [showCategories, setShowCategories] = useState(false)
  const [coords, setCoords] = useState(location)
  const [locError, setLocError] = useState(null)
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [watchActive, setWatchActive] = useState(false)

  const lastTapRef = useRef(0)
  const mediaRef   = useRef(null)
  const chunksRef  = useRef([])
  const watchIdRef = useRef(null)
  const activateSosRef = useRef(null) // forward ref to avoid stale closure

  // Voice trigger — active only when SOS is idle
  const { listening: voiceListening, supported: voiceSupported } = useVoiceTrigger(
    useCallback((transcript) => {
      setVoiceTriggered(true)
      setVoiceWord(transcript)
      setTimeout(() => activateSosRef.current?.(), 1000)
    }, []),
    sosStage === 'idle'
  )

  // Reset voice trigger state when SOS is cancelled
  useEffect(() => {
    if (sosStage !== 'idle') { setVoiceTriggered(false); setVoiceWord('') }
  }, [sosStage])

  // Live GPS watch during active SOS
  useEffect(() => {
    if (sosStage === 'sent' && navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        pos => { const c = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }; setCoords(c); setLocation(c) },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000 }
      )
      setWatchActive(true)
    }
    return () => { if (watchIdRef.current) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; setWatchActive(false) } }
  }, [sosStage])

  const activateSOS = useCallback(async () => {
    const now = Date.now()
    if (now - lastTapRef.current < 2000) return
    lastTapRef.current = now
    if (sosStage !== 'idle' && sosStage !== 'failed') return
    setLocError(null)
    setSosStage('locating')

    const loc = await getCurrentLocation({ highAccuracy: true, timeout: 8000 })
    if (loc) { setCoords(loc); setLocation(loc); if (loc.stale) setLocError('Using last known location — GPS signal weak.') }
    else setLocError('Location unavailable. Alert sent without GPS.')

    setSosStage('sending')
    await new Promise(r => setTimeout(r, 700))

    const payload = {
      user:          user?.name || 'Anonymous',
      userId:        user?.id   || 'guest',
      location:      loc || { lat: 0, lng: 0 },
      emergencyType: selectedCategory.id,
      priority:      selectedCategory.priority,
      audioBlob:     audioBlob ? 'voice_attached' : null,
      message:       `${selectedCategory.label} — Emergency SOS`,
    }

    if (online) addSosAlert(payload)
    else { queueSosOffline(payload); setLocError('Offline — SOS queued and will send when reconnected.') }

    setSosStage('sent')
  }, [sosStage, user, audioBlob, online, selectedCategory, addSosAlert, setLocation, setSosStage])

  // Keep ref in sync with latest activateSOS
  useEffect(() => { activateSosRef.current = activateSOS }, [activateSOS])

  const cancelSOS = () => { setSosStage('idle'); setCoords(null); setLocError(null); setAudioBlob(null); setAudioUrl(null) }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRef.current = mr; chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = () => { const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); setAudioBlob(blob); setAudioUrl(URL.createObjectURL(blob)); stream.getTracks().forEach(t => t.stop()) }
      mr.start(); setRecording(true)
    } catch { setLocError('Microphone access denied.') }
  }
  const stopRecording = () => { mediaRef.current?.stop(); setRecording(false) }

  const isProcessing = sosStage === 'locating' || sosStage === 'sending'
  const isSent = sosStage === 'sent'
  const cat = getCategoryById(isSent ? (location?.emergencyType || selectedCategory.id) : selectedCategory.id) || selectedCategory

  return (
    <div className="flex flex-col items-center pb-24 md:pb-8 pt-6 px-0 bg-slate-50 dark:bg-[#0a0a0f]">
      {/* Offline pill */}
      {!online && (
        <div className="w-full flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-4 py-2.5 mb-4">
          <WifiOff size={13} className="text-yellow-500 shrink-0" />
          <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">{t('offline_warning')}</p>
        </div>
      )}

      <div className="flex items-center justify-between w-full mb-2">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">SOS Emergency</h1>
        <VoiceCommandButton />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center w-full">{t('sos_sub')}</p>

      {/* Voice trigger status */}
      {voiceSupported && sosStage === 'idle' && (
        <div className={`w-full flex items-center gap-2.5 rounded-2xl px-4 py-2.5 mb-4 border transition-all ${
          voiceTriggered
            ? 'bg-red-500/15 border-red-500/40'
            : voiceListening
            ? 'bg-green-500/8 border-green-500/20'
            : 'bg-gray-100/50 dark:bg-white/5 border-gray-200 dark:border-white/8'
        }`}>
          <div className={`w-2 h-2 rounded-full shrink-0 ${voiceListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-xs font-semibold flex-1 text-gray-600 dark:text-gray-400">
            {voiceTriggered
              ? `🆘 Voice trigger: "${voiceWord}" — sending SOS…`
              : voiceListening
              ? 'Listening for emergency words… (say "help", "emergency", "bachao")'
              : 'Voice trigger inactive'}
          </span>
          <Radio size={13} className={voiceListening ? 'text-green-500' : 'text-gray-400'} />
        </div>
      )}

      {/* Category selector */}
      {!isSent && (
        <div className="w-full mb-6">
          <p className="section-label">{t('emergency_type')}</p>
          <button onClick={() => setShowCategories(!showCategories)}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all bg-gradient-to-r ${selectedCategory.color} text-white shadow-lg`}>
            <span className="text-2xl">{selectedCategory.emoji}</span>
            <div className="flex-1 text-left">
              <p className="font-black text-base">{selectedCategory.label}</p>
              <p className="text-xs text-white/70">{PRIORITY_LABELS[selectedCategory.priority]} Priority</p>
            </div>
            <ChevronDown size={18} className={`transition-transform ${showCategories ? 'rotate-180' : ''}`} />
          </button>

          {showCategories && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {SOS_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => { setSelectedCategory(cat); setShowCategories(false) }}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all ${selectedCategory.id === cat.id ? `bg-gradient-to-r ${cat.color} text-white border-transparent` : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'}`}>
                  <span className="text-xl">{cat.emoji}</span>
                  <div className="text-left min-w-0">
                    <p className="font-bold text-xs leading-tight truncate">{cat.label}</p>
                    <p className={`text-[10px] ${selectedCategory.id === cat.id ? 'text-white/70' : 'text-gray-400'}`}>{PRIORITY_LABELS[cat.priority]}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SOS Button */}
      <div className="relative mb-8 flex items-center justify-center">
        {isSent && <>
          <span className="absolute w-72 h-72 rounded-full border border-red-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          <span className="absolute w-56 h-56 rounded-full border border-red-500/30 animate-ping" style={{ animationDuration: '1.5s' }} />
        </>}

        <button onClick={activateSOS} disabled={isProcessing}
          className={`relative w-48 h-48 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-200 select-none
            ${sosStage === 'idle' || sosStage === 'failed' ? 'active:scale-95 cursor-pointer' : ''}
            ${isProcessing ? 'cursor-not-allowed' : ''}
            ${isSent ? 'animate-glow' : ''}
          `}
          style={{
            background: isSent ? 'linear-gradient(135deg,#b91c1c,#dc2626)' : sosStage === 'failed' ? 'linear-gradient(135deg,#374151,#4b5563)' : 'linear-gradient(135deg,#dc2626,#e11d48)',
            boxShadow: isSent ? '0 0 60px 20px rgba(220,38,38,0.4)' : '0 20px 60px rgba(220,38,38,0.35)',
          }}>
          <div className="absolute inset-3 rounded-full border-2 border-white/20" />
          {sosStage === 'idle'     && <><span className="text-4xl">{selectedCategory.emoji}</span><span className="text-white text-2xl font-black tracking-widest">{t('sos')}</span></>}
          {sosStage === 'locating' && <><MapPin size={40} className="text-white animate-bounce" /><span className="text-white text-sm font-bold">{t('locating')}</span></>}
          {sosStage === 'sending'  && <><Loader size={40} className="text-white animate-spin" /><span className="text-white text-sm font-bold">{t('sending')}</span></>}
          {isSent                  && <><CheckCircle size={48} className="text-white" /><span className="text-white text-xl font-black">{t('sos_sent').split(' ')[0]}</span><span className="text-white/70 text-xs">{t('help_notified')}</span></>}
          {sosStage === 'failed'   && <><XCircle size={48} className="text-white" /><span className="text-white text-xl font-black">RETRY</span></>}
        </button>
      </div>

      {/* Sent status */}
      {isSent && (
        <div className="w-full rounded-2xl overflow-hidden mb-4 border border-green-500/30 bg-green-500/5">
          <div className="px-4 py-3 bg-green-500/10 flex items-center gap-2 border-b border-green-500/20">
            <CheckCircle size={15} className="text-green-500" />
            <p className="font-bold text-green-600 dark:text-green-400 text-sm">{t('sos_sent')}</p>
            {watchActive && <span className="ml-auto flex items-center gap-1.5 text-xs text-blue-500 font-semibold"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> {t('live_gps')}</span>}
          </div>
          <div className="px-4 py-3 flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${PRIORITY_COLORS[selectedCategory.priority]}`}>
              {selectedCategory.emoji} {selectedCategory.label}
            </span>
          </div>
          {coords?.lat !== 0 && (
            <div className="px-4 pb-3 flex items-center gap-2">
              <Navigation size={13} className="text-gray-400 shrink-0" />
              <p className="text-xs text-gray-500 font-mono">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}{coords.accuracy && ` ±${Math.round(coords.accuracy)}m`}</p>
            </div>
          )}
        </div>
      )}

      {locError && (
        <div className="w-full rounded-2xl px-4 py-3 mb-4 bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">{locError}</p>
        </div>
      )}

      {/* Voice message */}
      <div className="w-full card-solid p-4 mb-4">
        <p className="font-bold text-sm mb-3">{t('voice_message')}</p>
        <div className="flex items-center gap-3">
          <button onClick={recording ? stopRecording : startRecording}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${recording ? 'bg-red-500/10 border border-red-500/30 text-red-500' : 'bg-gray-100 dark:bg-white/8 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'}`}>
            {recording ? <><MicOff size={15} /> Stop</> : <><Mic size={15} /> Record</>}
          </button>
          {recording && <><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /><span className="text-xs text-red-500 font-semibold">Recording…</span></>}
          {audioBlob && !recording && <span className="text-xs text-green-500 font-semibold">✓ Recorded</span>}
        </div>
        {audioUrl && <audio controls src={audioUrl} className="w-full mt-3 h-9 rounded-lg" />}
      </div>

      {isSent && (
        <button onClick={cancelSOS}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gray-100 dark:bg-white/8 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-semibold text-sm">
          <X size={15} /> {t('cancel_sos')}
        </button>
      )}
    </div>
  )
}
