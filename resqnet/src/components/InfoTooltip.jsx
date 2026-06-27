import React from 'react'

export default function InfoTooltip({ text }) {
  return (
    <div className="group relative inline-block ml-1.5 z-50">
      <span className="cursor-help text-blue-500 dark:text-blue-400 text-[10px] font-black bg-blue-500/10 dark:bg-blue-400/10 rounded-full w-4 h-4 inline-flex items-center justify-center border border-blue-500/20 shadow-sm">
        ?
      </span>
      <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-slate-900 text-white text-[11px] p-3 rounded-xl shadow-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[9999] text-center font-normal normal-case leading-relaxed">
        {text}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900" />
      </div>
    </div>
  )
}
