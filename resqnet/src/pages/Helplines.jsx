import { Phone } from 'lucide-react'

const HELPLINES = [
  { category: 'Emergency', items: [
    { name: 'Police', number: '100', emoji: '👮', from: 'from-blue-500', to: 'to-blue-600', glow: 'shadow-blue-500/30' },
    { name: 'Ambulance', number: '108', emoji: '🚑', from: 'from-red-500', to: 'to-rose-600', glow: 'shadow-red-500/30' },
    { name: 'Fire Brigade', number: '101', emoji: '🚒', from: 'from-orange-500', to: 'to-amber-500', glow: 'shadow-orange-500/30' },
    { name: 'All Emergency', number: '112', emoji: '🆘', from: 'from-red-600', to: 'to-red-700', glow: 'shadow-red-600/30' },
  ]},
  { category: 'Disaster Control', items: [
    { name: 'NDMA Helpline', number: '1078', emoji: '🏛️', from: 'from-purple-500', to: 'to-violet-600', glow: 'shadow-purple-500/30' },
    { name: 'Flood Control', number: '1070', emoji: '🌊', from: 'from-cyan-500', to: 'to-blue-500', glow: 'shadow-cyan-500/30' },
    { name: 'Disaster Mgmt', number: '1077', emoji: '⚠️', from: 'from-yellow-500', to: 'to-orange-500', glow: 'shadow-yellow-500/30' },
  ]},
  { category: 'Medical & Support', items: [
    { name: 'Women Helpline', number: '1091', emoji: '👩', from: 'from-pink-500', to: 'to-rose-500', glow: 'shadow-pink-500/30' },
    { name: 'Child Helpline', number: '1098', emoji: '👶', from: 'from-green-500', to: 'to-emerald-500', glow: 'shadow-green-500/30' },
    { name: 'Mental Health', number: '1800-599-0019', emoji: '🧠', from: 'from-teal-500', to: 'to-cyan-500', glow: 'shadow-teal-500/30' },
  ]},
]

export default function Helplines() {
  return (
    <div className="flex flex-col min-h-full pb-24 pt-5 px-4 bg-slate-50 dark:bg-[#0a0a0f]">
      <h1 className="text-2xl font-black mb-1">Emergency Helplines</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Tap any card to call instantly</p>

      <div className="space-y-6">
        {HELPLINES.map(({ category, items }) => (
          <div key={category}>
            <p className="section-label">{category}</p>
            <div className="space-y-2.5">
              {items.map(({ name, number, emoji, from, to, glow }) => (
                <a key={number} href={`tel:${number}`}
                  className="card-solid flex items-center gap-4 p-4 active:scale-[0.98] transition-transform">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${from} ${to} flex items-center justify-center text-xl shadow-lg ${glow} shrink-0`}>
                    {emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">{name}</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white tracking-wide">{number}</p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <Phone size={17} className="text-white" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
