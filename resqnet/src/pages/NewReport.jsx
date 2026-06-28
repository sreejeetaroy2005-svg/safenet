import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/useApp'
import { ArrowLeft, MapPin, Camera, Mic, MicOff, Send, CheckCircle } from 'lucide-react'

const TYPES = [
  { id: 'flood', emoji: '🌊', label: 'Flood' },
  { id: 'fire', emoji: '🔥', label: 'Fire' },
  { id: 'earthquake', emoji: '🌍', label: 'Earthquake' },
  { id: 'accident', emoji: '🚗', label: 'Accident' },
  { id: 'other', emoji: '⚠️', label: 'Other' },
]

export default function NewReport() {
  const navigate = useNavigate()
  const { addReport, location, user } = useApp()
  const [form, setForm] = useState({ title: '', description: '', type: 'flood' })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loc, setLoc] = useState(location)
  const [locLoading, setLocLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])

  const detectLocation = () => {
    setLocLoading(true)
    navigator.geolocation?.getCurrentPosition(
      pos => { setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocLoading(false) },
      () => setLocLoading(false)
    )
  }

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRef.current = mr; chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = () => { setAudioUrl(URL.createObjectURL(new Blob(chunksRef.current, { type: 'audio/webm' }))); stream.getTracks().forEach(t => t.stop()) }
      mr.start(); setRecording(true)
    } catch { alert('Microphone access denied.') }
  }
  const stopRecording = () => { mediaRef.current?.stop(); setRecording(false) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 700))
    addReport({
      ...form,
      location:  loc,
      hasPhoto:  !!photo,
      hasAudio:  !!audioUrl,
      user:      user?.name  || 'Anonymous',
      userId:    user?.uid   || user?.id || 'guest',
    })
    navigate('/reports')
  }

  const selectedType = TYPES.find(t => t.id === form.type)

  return (
    <div className="flex flex-col min-h-full pb-24 bg-slate-50 dark:bg-[#0a0a0f]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-gray-100 dark:border-white/5">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center">
          <ArrowLeft size={17} />
        </button>
        <div>
          <h1 className="text-lg font-black">New Report</h1>
          <p className="text-xs text-gray-400">Report an incident in your area</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 px-4 pt-5 space-y-5">
        {/* Type selector */}
        <div>
          <p className="section-label">Incident Type</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {TYPES.map(t => (
              <button key={t.id} type="button" onClick={() => setForm(f => ({ ...f, type: t.id }))}
                className={`shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border transition-all ${
                  form.type === t.id
                    ? 'bg-red-500/10 border-red-500/40 text-red-500'
                    : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500'
                }`}>
                <span className="text-2xl">{t.emoji}</span>
                <span className="text-xs font-bold">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <p className="section-label">Title *</p>
          <input className="input-field" placeholder={`Describe the ${selectedType?.label.toLowerCase()} incident…`}
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
        </div>

        {/* Description */}
        <div>
          <p className="section-label">Details</p>
          <textarea className="input-field resize-none" rows={3}
            placeholder="Severity, number of people affected, immediate needs…"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        {/* Location */}
        <div>
          <p className="section-label">Location</p>
          <button type="button" onClick={detectLocation}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${loc ? 'bg-blue-500/5 border-blue-500/30' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${loc ? 'bg-blue-500/15' : 'bg-gray-100 dark:bg-white/8'}`}>
              <MapPin size={16} className={loc ? 'text-blue-500' : 'text-gray-400'} />
            </div>
            <span className={`text-sm font-medium ${loc ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>
              {locLoading ? 'Detecting…' : loc ? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` : 'Detect my location'}
            </span>
            {loc && <CheckCircle size={14} className="text-blue-500 ml-auto" />}
          </button>
        </div>

        {/* Photo */}
        <div>
          <p className="section-label">Photo (Optional)</p>
          <label className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${photo ? 'bg-green-500/5 border-green-500/30' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${photo ? 'bg-green-500/15' : 'bg-gray-100 dark:bg-white/8'}`}>
              <Camera size={16} className={photo ? 'text-green-500' : 'text-gray-400'} />
            </div>
            <span className={`text-sm font-medium flex-1 truncate ${photo ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
              {photo ? photo.name : 'Attach a photo'}
            </span>
            {photo && <CheckCircle size={14} className="text-green-500" />}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
          {photoPreview && <img src={photoPreview} alt="preview" className="mt-2 rounded-2xl w-full max-h-44 object-cover" />}
        </div>

        {/* Voice */}
        <div>
          <p className="section-label">Voice Note (Optional)</p>
          <button type="button" onClick={recording ? stopRecording : startRecording}
            className={`w-full flex items-center justify-center gap-2 p-4 rounded-2xl border font-semibold text-sm transition-all ${
              recording ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500'
            }`}>
            {recording ? <><MicOff size={16} /> Stop Recording</> : <><Mic size={16} /> Record Voice Note</>}
          </button>
          {recording && <p className="text-xs text-red-500 text-center mt-1.5 font-semibold animate-pulse">● Recording in progress…</p>}
          {audioUrl && <audio controls src={audioUrl} className="w-full mt-2 h-9 rounded-xl" />}
        </div>

        {/* Submit */}
        <button type="submit" disabled={submitting || !form.title.trim()}
          className="w-full btn-danger flex items-center justify-center gap-2 disabled:opacity-50">
          {submitting
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
            : <><Send size={16} /> Submit Report</>}
        </button>
      </form>
    </div>
  )
}
