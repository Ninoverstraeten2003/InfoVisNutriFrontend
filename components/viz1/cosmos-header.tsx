'use client'

import { Nutrient, NUTRIENT_FAMILY_COLORS } from '@/lib/viz1-cosmos-model'

interface Props {
  nutrients: Nutrient[]
  history: string[]
  onNavigate: (id: string) => void
}

export default function CosmosHeader({ nutrients, history, onNavigate }: Props) {
  return (
    <header
      className="flex items-center px-4 h-11 gap-2 flex-shrink-0"
      style={{ background: 'color-mix(in srgb, var(--sidebar) 98%, transparent)', borderBottom: '1px solid var(--sidebar-border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <div className="relative w-5 h-5 flex-shrink-0">
          <div className="absolute inset-0 rounded-full bg-yellow-200 opacity-90" style={{ boxShadow: '0 0 8px var(--cosmos-sun)' }} />
          <div className="absolute inset-1 rounded-full bg-yellow-400 opacity-70" />
        </div>
        <span className="text-xs font-bold tracking-widest uppercase font-sans text-foreground/70">NutriCosmos</span>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1">
        {history.map((id, i) => {
          const n = nutrients.find(nu => nu.id === id)
          if (!n) return null
          const col = NUTRIENT_FAMILY_COLORS[n.family]
          const isLast = i === history.length - 1
          return (
            <div key={`${id}-${i}`} className="flex items-center gap-1.5 flex-shrink-0">
              {i > 0 && <span className="text-foreground/20 text-xs">›</span>}
              <button
                onClick={() => onNavigate(id)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono transition-all"
                style={{
                  background: isLast ? col + '20' : 'transparent',
                  color: isLast ? col : 'var(--muted-foreground)',
                  border: `1px solid ${isLast ? col + '60' : 'transparent'}`,
                  fontWeight: isLast ? 700 : 400,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: col, opacity: isLast ? 1 : 0.5 }}
                />
                {n.shortName}
              </button>
            </div>
          )
        })}
      </div>

      {/* Info */}
      <div className="text-xs font-mono text-muted-foreground flex-shrink-0 hidden sm:block">
        {nutrients.length} nutrients · cosmos view
      </div>
    </header>
  )
}
