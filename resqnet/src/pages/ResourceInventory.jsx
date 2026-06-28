/**
 * ResourceInventory.jsx
 * Emergency supply tracker — log quantities, units, and expiry dates.
 * Color-coded expiry warnings. Category filters. localStorage persistence.
 */
import { useState } from 'react'
import {
  Package, Plus, Trash2, AlertTriangle, Check,
  ChevronDown, ArrowLeft, Search, Filter, MapPin
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/useApp'
import { buildRiskZones, getActiveZones } from '../services/geofenceService'
import InfoTooltip from '../components/InfoTooltip'

const LS_KEY = 'safenet_inventory'

const CATEGORIES = [
  { id: 'water',     label: 'Water',        emoji: '💧', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { id: 'food',      label: 'Food',         emoji: '🍱', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { id: 'medical',   label: 'Medical',      emoji: '💊', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  { id: 'light',     label: 'Light/Power',  emoji: '🔦', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  { id: 'documents', label: 'Documents',    emoji: '📄', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { id: 'tools',     label: 'Tools',        emoji: '🔧', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  { id: 'clothing',  label: 'Clothing',     emoji: '👕', color: 'bg-teal-500/10 text-teal-500 border-teal-500/20' },
  { id: 'other',     label: 'Other',        emoji: '📦', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
]

function getSuggestedSupplies(hasFlood, hasCyclone, hasEarthquake, hasAQI) {
  let list = [
    { name: 'Drinking Water',     category: 'water',     unit: 'litres',  qty: 0, targetQty: (hasFlood || hasCyclone) ? 40 : 20,  notes: (hasFlood || hasCyclone) ? 'Increased target due to flood/cyclone risk' : '3 days supply per person' },
    { name: 'Rice / Grains',      category: 'food',      unit: 'kg',      qty: 0, targetQty: 5,   notes: '' },
    { name: 'Canned Food',        category: 'food',      unit: 'cans',    qty: 0, targetQty: (hasFlood || hasCyclone) ? 20 : 12,  notes: (hasFlood || hasCyclone) ? 'Stock extra non-perishables' : '' },
    { name: 'First Aid Kit',      category: 'medical',   unit: 'kit',     qty: 0, targetQty: 1,   notes: 'Critical supply' },
    { name: 'Paracetamol',        category: 'medical',   unit: 'tablets', qty: 0, targetQty: 20,  notes: '' },
    { name: 'Torch / Flashlight', category: 'light',     unit: 'units',   qty: 0, targetQty: (hasFlood || hasCyclone || hasEarthquake) ? 3 : 2,   notes: 'Power outages likely' },
    { name: 'AA Batteries',       category: 'light',     unit: 'units',   qty: 0, targetQty: 12,  notes: '' },
    { name: 'Power Bank',         category: 'light',     unit: 'units',   qty: 0, targetQty: (hasFlood || hasCyclone) ? 2 : 1,   notes: 'Keep charged' },
    { name: 'Aadhaar / ID Copy',  category: 'documents', unit: 'copies',  qty: 0, targetQty: 2,   notes: 'Keep in waterproof bag' },
    { name: 'Cash',               category: 'documents', unit: '₹',       qty: 0, targetQty: 3000, notes: 'ATMs may be offline' },
    { name: 'Candles',            category: 'light',     unit: 'units',   qty: 0, targetQty: 6,   notes: '' },
    { name: 'Warm Clothes',       category: 'clothing',  unit: 'sets',    qty: 0, targetQty: 2,   notes: 'One per family member' },
  ]

  if (hasAQI) {
    list.push({ name: 'N95 Face Masks', category: 'medical', unit: 'masks', qty: 0, targetQty: 10, notes: 'Recommended for severe AQI' })
  }
  if (hasFlood) {
    list.push({ name: 'Waterproof Tarpaulin', category: 'tools', unit: 'sheets', qty: 0, targetQty: 1, notes: 'To protect shelter/supplies' })
  }
  if (hasEarthquake) {
    list.push({ name: 'Heavy Duty Gloves', category: 'tools', unit: 'pairs', qty: 0, targetQty: 2, notes: 'For debris handling' })
  }

  return list
}

function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || [] } catch { return [] }
}
function save(items) { localStorage.setItem(LS_KEY, JSON.stringify(items)) }

function expiryStatus(expiry) {
  if (!expiry) return null
  const days = Math.floor((new Date(expiry) - Date.now()) / 86400000)
  if (days < 0)  return { label: 'Expired',     color: 'text-red-500',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    urgent: true }
  if (days < 30) return { label: `${days}d left`, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', urgent: true }
  if (days < 90) return { label: `${days}d left`, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', urgent: false }
  return { label: `${days}d left`, color: 'text-green-500', bg: 'bg-green-500/8', border: 'border-green-500/15', urgent: false }
}

function getCat(id) { return CATEGORIES.find(c => c.id === id) || CATEGORIES[7] }

/* ── Add/Edit modal ─────────────────────────────────────────── */
function ItemModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(item || {
    name: '', category: 'water', unit: 'units', qty: 0, targetQty: 1, expiry: '', notes: ''
  })
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-[#141420] rounded-2xl p-5 shadow-2xl border border-gray-100 dark:border-white/10"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="font-black text-base">{item ? 'Edit Item' : 'Add Supply Item'}</p>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center">
            <span className="text-gray-500 text-sm leading-none">✕</span>
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Item Name</label>
            <input className="input-field text-sm" placeholder="e.g. Drinking Water" value={form.name}
              onChange={e => f('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Category</label>
              <select className="input-field text-sm" value={form.category} onChange={e => f('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Unit</label>
              <input className="input-field text-sm" placeholder="litres, kg, units…" value={form.unit}
                onChange={e => f('unit', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Have (qty)</label>
              <input className="input-field text-sm" type="number" min="0" value={form.qty}
                onChange={e => f('qty', Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Target qty</label>
              <input className="input-field text-sm" type="number" min="1" value={form.targetQty}
                onChange={e => f('targetQty', Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Expiry Date (optional)</label>
            <input className="input-field text-sm" type="date" value={form.expiry}
              onChange={e => f('expiry', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label>
            <input className="input-field text-sm" placeholder="Storage location, brand…" value={form.notes}
              onChange={e => f('notes', e.target.value)} />
          </div>
        </div>
        <button onClick={() => { if (form.name.trim()) onSave(form) }}
          disabled={!form.name.trim()}
          className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-sm hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 transition-all">
          {item ? 'Save Changes' : 'Add to Inventory'}
        </button>
      </div>
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────────── */
export default function ResourceInventory() {
  const navigate = useNavigate()
  const { location } = useApp()
  const [items, setItems]     = useState(load)
  const [modal, setModal]     = useState(null) // null | 'new' | item object
  const [catFilter, setCat]   = useState('all')
  const [search, setSearch]   = useState('')
  const [showSuggest, setShowSuggest] = useState(items.length === 0)

  const activeZones = location ? getActiveZones(location.lat, location.lng, buildRiskZones(location.lat, location.lng)) : []
  const hasFlood = activeZones.some(z => z.type === 'flood')
  const hasCyclone = activeZones.some(z => z.type === 'cyclone')
  const hasEarthquake = activeZones.some(z => z.type === 'earthquake')
  const hasAQI = activeZones.some(z => z.type === 'aqi')

  const SUGGESTED = getSuggestedSupplies(hasFlood, hasCyclone, hasEarthquake, hasAQI)

  const isCritical = (category, name) => {
    if ((hasFlood || hasCyclone) && (category === 'water' || category === 'food' || category === 'light')) return true
    if (hasEarthquake && (category === 'medical' || category === 'tools')) return true
    if (hasAQI && name.includes('Mask')) return true
    return false
  }

  const commit = (next) => { setItems(next); save(next) }

  const addItem = (form) => {
    const item = { ...form, id: Date.now().toString() }
    commit([...items, item])
    setModal(null)
  }
  const editItem = (form) => {
    commit(items.map(i => i.id === form.id ? form : i))
    setModal(null)
  }
  const deleteItem = (id) => commit(items.filter(i => i.id !== id))

  const addSuggested = (s) => {
    if (!items.find(i => i.name === s.name)) {
      commit([...items, { ...s, id: Date.now().toString() }])
    }
  }

  const expiring = items.filter(i => {
    const s = expiryStatus(i.expiry)
    return s?.urgent
  })

  const filtered = items.filter(i => {
    const inCat    = catFilter === 'all' || i.category === catFilter
    const inSearch = !search || i.name.toLowerCase().includes(search.toLowerCase())
    return inCat && inSearch
  })

  // Overall readiness %
  const readyCount = items.filter(i => i.qty >= i.targetQty).length
  const readyPct   = items.length ? Math.round((readyCount / items.length) * 100) : 0

  return (
    <div className="pb-24 md:pb-8 pt-6">
      {modal && (
        <ItemModal
          item={typeof modal === 'object' && modal !== true ? modal : null}
          onSave={typeof modal === 'object' && modal !== true ? editItem : addItem}
          onClose={() => setModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center shrink-0">
          <ArrowLeft size={17} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Resource Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center">
            <span>
              {location ? `Tracking near location (${location.lat.toFixed(2)}, ${location.lng.toFixed(2)})` : 'Track your emergency supplies'}
            </span>
            <InfoTooltip text="Verifies active regional alerts at these coordinates to determine if custom preparedness stock guidelines apply to your area." />
          </p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors">
          <Plus size={13} /> Add Item
        </button>
      </div>

      {/* Active Location Risk Warning Banner */}
      {activeZones.length > 0 && (
        <div className="mb-4 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-500 flex items-center">
              <span>Location Hazard: Supply Recommendations Adjusted</span>
              <InfoTooltip text="Automatically scales target values for food, water, and power sources during active floods/cyclones, and inserts target N95 masks during severe AQI conditions." />
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Due to active risk zones in your area ({activeZones.map(z => z.name).join(', ')}), recommended target stocks for critical survival items have been automatically increased.
            </p>
          </div>
        </div>
      )}

      {/* Expiry alerts */}
      {expiring.length > 0 && (
        <div className="mb-4 bg-orange-500/10 border border-orange-500/25 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={16} className="text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-orange-500">{expiring.length} item{expiring.length > 1 ? 's' : ''} expiring soon or expired</p>
            <p className="text-xs text-gray-500 mt-0.5">{expiring.map(i => i.name).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card-solid p-3 text-center">
          <p className="text-2xl font-black text-gray-900 dark:text-white">{items.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total Items</p>
        </div>
        <div className="card-solid p-3 text-center">
          <p className={`text-2xl font-black ${readyPct >= 80 ? 'text-green-500' : readyPct >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>{readyPct}%</p>
          <p className="text-xs text-gray-400 mt-0.5">Stocked</p>
        </div>
        <div className="card-solid p-3 text-center">
          <p className={`text-2xl font-black ${expiring.length ? 'text-orange-500' : 'text-green-500'}`}>{expiring.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Expiring Soon</p>
        </div>
      </div>

      {/* Overall progress */}
      <div className="card-solid p-4 mb-5">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-bold">Supply Readiness</p>
          <span className={`text-xs font-bold ${readyPct >= 80 ? 'text-green-500' : readyPct >= 50 ? 'text-yellow-500' : 'text-orange-500'}`}>{readyCount}/{items.length} stocked</span>
        </div>
        <div className="h-2.5 w-full bg-gray-100 dark:bg-white/8 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${readyPct >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : readyPct >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' : 'bg-gradient-to-r from-orange-500 to-red-400'}`}
            style={{ width: `${readyPct || 2}%` }} />
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9 text-sm py-2.5" placeholder="Search items…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={catFilter} onChange={e => setCat(e.target.value)}
          className="input-field text-sm py-2.5 w-auto pr-8 min-w-[120px]">
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
        </select>
      </div>

      {/* Suggested items banner */}
      {showSuggest && items.length === 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="section-label mb-0">Suggested Emergency Supplies</p>
            <button onClick={() => setShowSuggest(false)} className="text-xs text-gray-400 hover:text-gray-600">Hide</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUGGESTED.map(s => {
              const critical = isCritical(s.category, s.name)
              return (
                <button key={s.name} onClick={() => addSuggested(s)}
                  className={`flex items-center gap-3 card-solid p-3 text-left hover:border-blue-400 dark:hover:border-blue-500/40 transition-colors group relative ${critical ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
                  <span className="text-xl">{getCat(s.category).emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold truncate">{s.name}</p>
                      {critical && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-white dark:text-slate-900 uppercase">
                          Critical
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">Target: {s.targetQty} {s.unit} {s.notes ? `· ${s.notes}` : ''}</p>
                  </div>
                  <Plus size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Items list */}
      {filtered.length === 0 && items.length > 0 && (
        <p className="text-sm text-center text-gray-400 py-8">No items match your filter.</p>
      )}
      {items.length === 0 && !showSuggest && (
        <div className="text-center py-12 text-gray-400">
          <Package size={40} className="mx-auto mb-2 opacity-30" />
          <p className="font-semibold">No inventory yet</p>
          <button onClick={() => setShowSuggest(true)} className="mt-2 text-sm text-blue-500 font-semibold hover:text-blue-400">Show suggested items</button>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(item => {
          const cat   = getCat(item.category)
          const pct   = Math.min(100, item.targetQty > 0 ? Math.round((item.qty / item.targetQty) * 100) : 0)
          const exp   = expiryStatus(item.expiry)
          const ok    = item.qty >= item.targetQty
          return (
            <div key={item.id} className={`card-solid p-4 ${exp?.urgent ? 'border-orange-500/25' : ok ? '' : 'border-gray-100 dark:border-white/5'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border ${cat.color}`}>
                  {cat.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{item.name}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {exp && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${exp.bg} ${exp.color} ${exp.border}`}>
                          {exp.label}
                        </span>
                      )}
                      {ok && !exp?.urgent && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                          ✓ Stocked
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Quantity bar */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/8 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${ok ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${pct || 2}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 font-mono">
                      {item.qty}/{item.targetQty} {item.unit}
                    </span>
                  </div>
                  {item.notes && <p className="text-xs text-gray-400">{item.notes}</p>}
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <button onClick={() => { const n = [...items]; const idx = n.findIndex(i => i.id === item.id); if (n[idx].qty > 0) { n[idx] = { ...n[idx], qty: n[idx].qty - 1 }; commit(n) } }}
                    className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/8 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-white/15 font-bold text-sm transition-colors">−</button>
                  <span className="text-sm font-bold w-8 text-center">{item.qty}</span>
                  <button onClick={() => { const n = [...items]; const idx = n.findIndex(i => i.id === item.id); n[idx] = { ...n[idx], qty: n[idx].qty + 1 }; commit(n) }}
                    className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/8 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-white/15 font-bold text-sm transition-colors">+</button>
                </div>
                <button onClick={() => setModal(item)}
                  className="ml-auto text-xs text-blue-500 font-semibold hover:text-blue-400 transition-colors px-2 py-1">
                  Edit
                </button>
                <button onClick={() => deleteItem(item.id)}
                  className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                  <Trash2 size={12} className="text-red-400" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
