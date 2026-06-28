/**
 * AIDamageAssessment.jsx
 * Upload a photo → real AI vision analysis via OpenRouter multimodal model.
 * Falls back to mock analysis if AI is unavailable.
 */
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Zap, AlertTriangle, CheckCircle, RotateCcw, Sparkles } from 'lucide-react'
import { analyzeImage } from '../services/aiDamageService'

const URGENCY_ICON = { HIGH: '🚨', MEDIUM: '⚠️', LOW: '✅' }
const PRIORITY_COLOR = { HIGH: 'text-red-500', MEDIUM: 'text-yellow-500', LOW: 'text-green-500' }

export default function AIDamageAssessment() {
  const navigate  = useNavigate()
  const [image,     setImage]     = useState(null)
  const [preview,   setPreview]   = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result,    setResult]    = useState(null)
  const [progress,  setProgress]  = useState(0)
  const [statusMsg, setStatusMsg] = useState('')
  const [error,     setError]     = useState(null)
  const fileRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setResult(null)
  }

  const handleAnalyze = async () => {
    if (!image) return
    setAnalyzing(true)
    setProgress(0)
    setError(null)
    setStatusMsg('Preparing image…')

    const steps = [
      { pct: 15, msg: 'Uploading to AI model…' },
      { pct: 35, msg: 'Detecting damage patterns…' },
      { pct: 60, msg: 'Assessing structural risk…' },
      { pct: 80, msg: 'Calculating rescue priority…' },
      { pct: 92, msg: 'Generating report…' },
    ]
    let stepIdx = 0
    const ticker = setInterval(() => {
      if (stepIdx < steps.length) {
        setProgress(steps[stepIdx].pct)
        setStatusMsg(steps[stepIdx].msg)
        stepIdx++
      }
    }, 600)

    try {
      const analysis = await analyzeImage(image)
      clearInterval(ticker)
      setProgress(100)
      setStatusMsg('Analysis complete')
      await new Promise(r => setTimeout(r, 300))
      setResult(analysis)
    } catch (err) {
      clearInterval(ticker)
      console.error('[SAFENET] Damage analysis error:', err)
      setError(`Analysis failed: ${err.message}`)
      setStatusMsg('')
    }
    setAnalyzing(false)
  }

  const reset = () => { setImage(null); setPreview(null); setResult(null); setProgress(0); setStatusMsg('') }

  return (
    <div className="flex flex-col pb-24 md:pb-8 bg-slate-50 dark:bg-[#0a0a0f]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-gray-100 dark:border-white/5">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center">
          <ArrowLeft size={17} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-black">AI Damage Assessment</h1>
          <p className="text-xs text-gray-400">Upload photo for instant AI analysis</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <Sparkles size={14} className="text-white" />
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* Upload area */}
        {!preview ? (
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-gray-300 dark:border-white/15 rounded-3xl p-10 flex flex-col items-center gap-3 hover:border-purple-500/50 transition-colors active:scale-[0.98]">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <Camera size={28} className="text-purple-500" />
              </div>
              <p className="font-bold text-gray-700 dark:text-gray-300">Upload Damage Photo</p>
              <p className="text-xs text-gray-400 text-center">Photo of damaged building, road, or disaster area</p>
              <span className="text-xs bg-purple-500/15 text-purple-500 px-3 py-1.5 rounded-full font-semibold border border-purple-500/30">
                Choose Photo
              </span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
          </label>
        ) : (
          <div className="relative rounded-3xl overflow-hidden">
            <img src={preview} alt="damage" className="w-full max-h-72 object-cover" />
            <button onClick={reset} className="absolute top-3 right-3 w-9 h-9 bg-black/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <RotateCcw size={15} className="text-white" />
            </button>
            {!result && !analyzing && (
              <div className="absolute bottom-3 left-3 right-3">
                <button onClick={handleAnalyze}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-500/30 active:scale-95 transition-transform">
                  <Sparkles size={16} /> Analyze with AI
                </button>
              </div>
            )}
          </div>
        )}

        {/* Progress */}
        {analyzing && (
          <div className="card-solid p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <Sparkles size={18} className="text-purple-500 animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-sm">AI Analyzing Image</p>
                <p className="text-xs text-gray-400">{statusMsg}</p>
              </div>
              <span className="ml-auto text-sm font-black text-purple-500">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2.5 overflow-hidden">
              <div className="h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 transition-all duration-500"
                style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`rounded-3xl overflow-hidden border ${result.border} ${result.bg}`}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10" style={{ background: result.color + '18' }}>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-md"
                  style={{ background: result.color + '25' }}>
                  {URGENCY_ICON[result.rescuePriority]}
                </div>
                <div className="flex-1">
                  <p className="font-black text-xl" style={{ color: result.color }}>{result.damageLevel}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{result.urgency}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black" style={{ color: result.color }}>{result.confidence}%</p>
                  <p className="text-xs text-gray-400">Confidence</p>
                </div>
              </div>

              {/* AI badge */}
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${result.border} ${result.bg} ${PRIORITY_COLOR[result.rescuePriority]}`}>
                  {result.rescuePriority} PRIORITY
                </span>
                {result.aiPowered
                  ? <span className="text-xs bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                      <Sparkles size={10} /> AI Vision
                    </span>
                  : <span className="text-xs bg-gray-500/15 text-gray-400 border border-gray-500/30 px-2.5 py-1 rounded-full font-bold">
                      Simulation
                    </span>
                }
              </div>
            </div>

            {/* Details */}
            <div className="px-5 py-4 space-y-4">
              {/* Risk factors */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Detected Risk Factors</p>
                <div className="space-y-2">
                  {result.riskFactors?.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <AlertTriangle size={12} className="text-orange-400 shrink-0" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">{f}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confidence bar */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">AI Confidence</p>
                  <p className="text-xs font-black" style={{ color: result.color }}>{result.confidence}%</p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${result.confidence}%`, background: result.color }} />
                </div>
              </div>

              {/* Damage scale */}
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`flex-1 h-2 rounded-full transition-all ${i <= result.score ? '' : 'bg-gray-200 dark:bg-white/10'}`}
                    style={i <= result.score ? { background: result.color } : {}} />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>Minor</span><span>Moderate</span><span>Severe</span><span>Critical</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button onClick={reset}
                  className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-white/8 text-sm font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10">
                  New Analysis
                </button>
                <button onClick={() => navigate('/reports/new')}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 text-white text-sm font-black shadow-lg shadow-red-500/25 active:scale-95 transition-transform">
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
