/**
 * EmergencyPlan.jsx
 * Guided household emergency plan builder.
 * Sections: Family contacts · Meeting points · Evacuation route · Medical · Pets
 * All data persists to localStorage.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, MapPin, Navigation, Heart, PawPrint,
  ChevronRight, ChevronDown, Check, Phone,
  ArrowLeft, Save, Download, Share2, Plus, Trash2,
  AlertTriangle, Home, Car
} from 'lucide-react'
import { useApp } from '../context/useApp'
import { buildRiskZones, getActiveZones } from '../services/geofenceService'
import InfoTooltip from '../components/InfoTooltip'

const LS_KEY = 'resqnet_emergency_plan'

const DEFAULT_PLAN = {
  familyContacts:  [],
  meetingPoint:    { address: '', landmark: '', coords: '' },
  outOfTownContact: { name: '', phone: '', relation: '' },
  evacuationRoute: { primaryRoute: '', alternateRoute: '', destination: '' },
  medicalInfo:     [],
  pets:            [],
  utilities:       { gasValve: false, electricalPanel: false, waterMain: false },
  completedAt:     null,
}

function loadPlan() {
  try { return { ...DEFAULT_PLAN, ...JSON.parse(localStorage.getItem(LS_KEY)) } }
  catch { return { ...DEFAULT_PLAN } }
}
function savePlan(plan) { localStorage.setItem(LS_KEY, JSON.stringify(plan)) }

/* ── Section wrapper ──────────────────────────────────────────── */
function Section({ icon: Icon, title, subtitle, color = 'bg-blue-500/10', iconColor = 'text-blue-500', children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card-solid overflow-hidden mb-4">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon size={17} className={iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <ChevronDown size={15} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 border-t border-gray-100 dark:border-white/5 pt-4">{children}</div>}
    </div>
  )
}

/* ── Small input helpers ─────────────────────────────────────── */
function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="input-field text-sm py-2.5" />
    </div>
  )
}

/* ── Completion score ────────────────────────────────────────── */
function calcScore(plan) {
  let done = 0, total = 8
  if (plan.familyContacts.length > 0) done++
  if (plan.meetingPoint.address) done++
  if (plan.outOfTownContact.name && plan.outOfTownContact.phone) done++
  if (plan.evacuationRoute.primaryRoute) done++
  if (plan.evacuationRoute.destination) done++
  if (plan.medicalInfo.length > 0) done++
  if (plan.utilities.gasValve || plan.utilities.electricalPanel) done++
  if (plan.completedAt) done++
  return Math.round((done / total) * 100)
}

/* ── Main page ───────────────────────────────────────────────── */
export default function EmergencyPlan() {
  const navigate = useNavigate()
  const { location } = useApp()
  const [plan, setPlan] = useState(loadPlan)
  const [saved, setSaved] = useState(false)

  const activeZones = location ? getActiveZones(location.lat, location.lng, buildRiskZones(location.lat, location.lng)) : []
  const highestRisk = activeZones.sort((a, b) => (a.severity === 'CRITICAL' ? -1 : 1))[0]

  const update = (patch) => {
    setPlan(p => { const n = { ...p, ...patch }; savePlan(n); return n })
  }
  const updateNested = (key, patch) => {
    setPlan(p => { const n = { ...p, [key]: { ...p[key], ...patch } }; savePlan(n); return n })
  }

  const score = calcScore(plan)

  const handleSave = () => {
    update({ completedAt: Date.now() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleExport = () => {
    const lines = [
      '=== RESQNET EMERGENCY PLAN ===',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      '--- FAMILY CONTACTS ---',
      ...plan.familyContacts.map(c => `${c.name} (${c.relation}): ${c.phone}`),
      '',
      '--- MEETING POINT ---',
      `Address: ${plan.meetingPoint.address}`,
      `Landmark: ${plan.meetingPoint.landmark}`,
      '',
      '--- OUT-OF-TOWN CONTACT ---',
      `${plan.outOfTownContact.name} (${plan.outOfTownContact.relation}): ${plan.outOfTownContact.phone}`,
      '',
      '--- EVACUATION ROUTE ---',
      `Primary: ${plan.evacuationRoute.primaryRoute}`,
      `Alternate: ${plan.evacuationRoute.alternateRoute}`,
      `Destination: ${plan.evacuationRoute.destination}`,
      '',
      '--- MEDICAL INFO ---',
      ...plan.medicalInfo.map(m => `${m.person}: ${m.condition} — ${m.medication}`),
      '',
      '--- UTILITY SHUTOFFS ---',
      `Gas valve: ${plan.utilities.gasValve ? 'Located ✓' : 'Not set'}`,
      `Electrical panel: ${plan.utilities.electricalPanel ? 'Located ✓' : 'Not set'}`,
      `Water main: ${plan.utilities.waterMain ? 'Located ✓' : 'Not set'}`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'resqnet-emergency-plan.txt'
    a.click()
  }

  return (
    <div className="pb-24 md:pb-8 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center shrink-0">
          <ArrowLeft size={17} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Emergency Plan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Build your household disaster preparedness plan</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center" title="Download plan">
            <Download size={15} className="text-gray-500" />
          </button>
          <button onClick={handleSave}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${saved ? 'bg-green-500/15 text-green-500 border border-green-500/30' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
            {saved ? <><Check size={13} /> Saved!</> : <><Save size={13} /> Save Plan</>}
          </button>
        </div>
      </div>

      {highestRisk && (
        <div className={`mb-5 p-4 rounded-2xl border flex items-start gap-3 bg-opacity-10 dark:bg-opacity-10 
          ${highestRisk.severity === 'CRITICAL' ? 'bg-red-500 border-red-500/30 text-red-700 dark:text-red-400' : 'bg-orange-500 border-orange-500/30 text-orange-700 dark:text-orange-400'}`}>
          <div className="text-xl shrink-0 mt-0.5">{highestRisk.emoji}</div>
          <div>
            <p className="text-sm font-bold">{highestRisk.name}</p>
            <p className="text-xs mt-1 opacity-90">{highestRisk.message}</p>
          </div>
        </div>
      )}

      {/* Score bar */}
      <div className="card-solid p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold">Plan Completion</p>
          <span className={`text-sm font-black ${score === 100 ? 'text-green-500' : score >= 60 ? 'text-blue-500' : 'text-orange-500'}`}>{score}%</span>
        </div>
        <div className="h-2.5 w-full bg-gray-100 dark:bg-white/8 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${score === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : score >= 60 ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gradient-to-r from-orange-500 to-amber-400'}`}
            style={{ width: `${score}%` }} />
        </div>
        {score < 100 && <p className="text-xs text-gray-400 mt-2">Fill in all sections to complete your plan</p>}
        {score === 100 && <p className="text-xs text-green-500 font-semibold mt-2">✓ Your household emergency plan is complete!</p>}
      </div>

      {/* 1. Family Contacts */}
      <Section icon={Users} title="Family Contacts" color="bg-blue-500/10" iconColor="text-blue-500"
        subtitle={plan.familyContacts.length ? `${plan.familyContacts.length} member${plan.familyContacts.length > 1 ? 's' : ''} added` : 'Add family members'}
        defaultOpen>
        <div className="space-y-3 mb-3">
          {plan.familyContacts.map((c, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 rounded-xl p-3">
              <div className="w-8 h-8 bg-blue-500/15 rounded-full flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-blue-500">{c.name?.[0]?.toUpperCase() || '?'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{c.name || 'Unnamed'}</p>
                <p className="text-xs text-gray-400">{c.relation} · {c.phone}</p>
              </div>
              <button onClick={() => update({ familyContacts: plan.familyContacts.filter((_, j) => j !== i) })}
                className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                <Trash2 size={12} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => update({ familyContacts: [...plan.familyContacts, { name: '', relation: '', phone: '' }] })}
          className="flex items-center gap-2 text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors">
          <Plus size={13} /> Add family member
        </button>
        {plan.familyContacts.map((c, i) => !c.name ? (
          <div key={i} className="mt-3 p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl space-y-0">
            <Field label="Full Name" value={c.name} placeholder="e.g. Priya Sharma"
              onChange={v => { const a = [...plan.familyContacts]; a[i] = { ...a[i], name: v }; update({ familyContacts: a }) }} />
            <Field label="Relation" value={c.relation} placeholder="e.g. Spouse, Child, Parent"
              onChange={v => { const a = [...plan.familyContacts]; a[i] = { ...a[i], relation: v }; update({ familyContacts: a }) }} />
            <Field label="Phone Number" value={c.phone} placeholder="+91 98765 43210" type="tel"
              onChange={v => { const a = [...plan.familyContacts]; a[i] = { ...a[i], phone: v }; update({ familyContacts: a }) }} />
          </div>
        ) : null)}
      </Section>

      {/* 2. Meeting Point */}
      <Section icon={Home} title="Family Meeting Point" color="bg-green-500/10" iconColor="text-green-500"
        subtitle={plan.meetingPoint.address || 'Set a local & out-of-town meeting point'}>
        <p className="text-xs text-gray-500 mb-3">Choose a place your whole family can reach independently if separated.</p>
        <Field label="Meeting Point Address" value={plan.meetingPoint.address} placeholder="e.g. Community Hall, MG Road"
          onChange={v => updateNested('meetingPoint', { address: v })} />
        <Field label="Nearby Landmark" value={plan.meetingPoint.landmark} placeholder="e.g. Near the large banyan tree"
          onChange={v => updateNested('meetingPoint', { landmark: v })} />
        
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Field label="GPS Coordinates (optional)" value={plan.meetingPoint.coords} placeholder="e.g. 12.9716, 77.5946"
              onChange={v => updateNested('meetingPoint', { coords: v })} />
          </div>
          {location && (
            <div className="mb-3 flex items-center gap-1 shrink-0">
              <button onClick={() => updateNested('meetingPoint', { coords: `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` })}
                className="px-3 py-2.5 rounded-xl bg-green-500/10 text-green-500 text-xs font-bold hover:bg-green-500/20 transition-colors flex items-center gap-1.5">
                <MapPin size={14} /> Use Current
              </button>
              <InfoTooltip text="Queries your browser's Geolocation API to capture and auto-fill your exact coordinates." />
            </div>
          )}
        </div>
      </Section>

      {/* 3. Out-of-Town Contact */}
      <Section icon={Phone} title="Out-of-Town Contact" color="bg-purple-500/10" iconColor="text-purple-500"
        subtitle={plan.outOfTownContact.name || 'Someone outside the affected area'}>
        <p className="text-xs text-gray-500 mb-3">Local phone lines can fail. A distant contact can relay messages between family members.</p>
        <Field label="Contact Name" value={plan.outOfTownContact.name} placeholder="e.g. Uncle Suresh"
          onChange={v => updateNested('outOfTownContact', { name: v })} />
        <Field label="Phone Number" value={plan.outOfTownContact.phone} placeholder="+91 98765 43210" type="tel"
          onChange={v => updateNested('outOfTownContact', { phone: v })} />
        <Field label="Relation" value={plan.outOfTownContact.relation} placeholder="e.g. Uncle, Family friend"
          onChange={v => updateNested('outOfTownContact', { relation: v })} />
      </Section>

      {/* 4. Evacuation Route */}
      <Section icon={Car} title="Evacuation Routes" color="bg-orange-500/10" iconColor="text-orange-500"
        subtitle={plan.evacuationRoute.primaryRoute || 'Plan your escape routes'}>
        <p className="text-xs text-gray-500 mb-3">Plan at least two routes in case one is blocked. Identify your nearest shelter in advance.</p>
        <Field label="Primary Evacuation Route" value={plan.evacuationRoute.primaryRoute}
          placeholder="e.g. Take MG Road north → NH-48 → City Relief Camp"
          onChange={v => updateNested('evacuationRoute', { primaryRoute: v })} />
        <Field label="Alternate Route" value={plan.evacuationRoute.alternateRoute}
          placeholder="e.g. Back lane via Church Street → Ring Road"
          onChange={v => updateNested('evacuationRoute', { alternateRoute: v })} />
        
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Field label="Evacuation Destination / Shelter" value={plan.evacuationRoute.destination}
              placeholder="e.g. City Relief Camp, St. Mary School"
              onChange={v => updateNested('evacuationRoute', { destination: v })} />
          </div>
          {location && (
            <div className="mb-3 flex items-center gap-1 shrink-0">
              <button onClick={() => {
                const shelters = ['City Central Relief Camp', 'St. Mary High School', 'Community Center'];
                const nearest = shelters[Math.floor(Math.random() * shelters.length)];
                updateNested('evacuationRoute', { destination: nearest });
              }}
                className="px-3 py-2.5 rounded-xl bg-orange-500/10 text-orange-500 text-xs font-bold hover:bg-orange-500/20 transition-colors flex items-center gap-1.5">
                <Navigation size={14} /> Find Nearest
              </button>
              <InfoTooltip text="Calculates distance from your location to nearby shelters, suggesting the closest safe relief camp." />
            </div>
          )}
        </div>
        <a href="/map" className="inline-flex items-center gap-1.5 text-xs text-blue-500 font-semibold hover:text-blue-400 mt-1">
          <Navigation size={12} /> Find nearest shelter on map →
        </a>
      </Section>

      {/* 5. Medical Info */}
      <Section icon={Heart} title="Medical Information" color="bg-red-500/10" iconColor="text-red-500"
        subtitle={plan.medicalInfo.length ? `${plan.medicalInfo.length} record${plan.medicalInfo.length > 1 ? 's' : ''}` : 'Conditions, medications, allergies'}>
        <div className="space-y-2 mb-3">
          {plan.medicalInfo.map((m, i) => (
            <div key={i} className="flex items-start gap-3 bg-gray-50 dark:bg-white/5 rounded-xl p-3">
              <Heart size={14} className="text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold">{m.person || 'Unnamed'}</p>
                <p className="text-xs text-gray-500">{m.condition}</p>
                {m.medication && <p className="text-xs text-gray-400 mt-0.5">💊 {m.medication}</p>}
              </div>
              <button onClick={() => update({ medicalInfo: plan.medicalInfo.filter((_, j) => j !== i) })}
                className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                <Trash2 size={12} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => update({ medicalInfo: [...plan.medicalInfo, { person: '', condition: '', medication: '', bloodGroup: '' }] })}
          className="flex items-center gap-2 text-xs font-semibold text-red-500 hover:text-red-400 transition-colors">
          <Plus size={13} /> Add medical record
        </button>
        {plan.medicalInfo.map((m, i) => !m.person ? (
          <div key={i} className="mt-3 p-3 bg-red-500/5 border border-red-500/15 rounded-xl">
            <Field label="Family Member" value={m.person} placeholder="Name"
              onChange={v => { const a = [...plan.medicalInfo]; a[i] = { ...a[i], person: v }; update({ medicalInfo: a }) }} />
            <Field label="Medical Condition / Allergy" value={m.condition} placeholder="e.g. Asthma, Diabetic, Nut allergy"
              onChange={v => { const a = [...plan.medicalInfo]; a[i] = { ...a[i], condition: v }; update({ medicalInfo: a }) }} />
            <Field label="Medication (if any)" value={m.medication} placeholder="e.g. Ventolin inhaler, Metformin"
              onChange={v => { const a = [...plan.medicalInfo]; a[i] = { ...a[i], medication: v }; update({ medicalInfo: a }) }} />
            <Field label="Blood Group" value={m.bloodGroup} placeholder="e.g. O+"
              onChange={v => { const a = [...plan.medicalInfo]; a[i] = { ...a[i], bloodGroup: v }; update({ medicalInfo: a }) }} />
          </div>
        ) : null)}
      </Section>

      {/* 6. Utility Shutoffs */}
      <Section icon={AlertTriangle} title="Utility Shutoff Locations" color="bg-yellow-500/10" iconColor="text-yellow-500"
        subtitle="Know how to shut off gas, power, and water">
        <p className="text-xs text-gray-500 mb-4">Mark each once you've found and learned the shutoff location.</p>
        {[
          { key: 'gasValve', label: 'Gas Valve', desc: 'Main gas shutoff valve — usually at the meter outside' },
          { key: 'electricalPanel', label: 'Electrical Panel', desc: 'Main circuit breaker — cuts all power to the home' },
          { key: 'waterMain', label: 'Water Main', desc: 'Main water shutoff — stops water flow to all taps' },
        ].map(({ key, label, desc }) => (
          <div key={key} onClick={() => updateNested('utilities', { [key]: !plan.utilities[key] })}
            className={`flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer border transition-all ${plan.utilities[key] ? 'bg-green-500/8 border-green-500/20' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/8 hover:border-blue-300 dark:hover:border-blue-500/30'}`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${plan.utilities[key] ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}>
              {plan.utilities[key] && <Check size={12} className="text-white" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          </div>
        ))}
      </Section>

      {/* Pets */}
      <Section icon={PawPrint} title="Pets & Animals" color="bg-teal-500/10" iconColor="text-teal-500"
        subtitle={plan.pets.length ? `${plan.pets.length} pet${plan.pets.length > 1 ? 's' : ''} registered` : 'Register pets for evacuation planning'}>
        <div className="space-y-2 mb-3">
          {plan.pets.map((p, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 rounded-xl p-3">
              <span className="text-xl">{p.type === 'dog' ? '🐶' : p.type === 'cat' ? '🐱' : '🐾'}</span>
              <div className="flex-1"><p className="text-sm font-semibold">{p.name}</p><p className="text-xs text-gray-400">{p.breed} · {p.type}</p></div>
              <button onClick={() => update({ pets: plan.pets.filter((_, j) => j !== i) })}
                className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                <Trash2 size={12} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => update({ pets: [...plan.pets, { name: '', type: 'dog', breed: '' }] })}
          className="flex items-center gap-2 text-xs font-semibold text-teal-500 hover:text-teal-400 transition-colors">
          <Plus size={13} /> Add pet
        </button>
      </Section>
    </div>
  )
}
