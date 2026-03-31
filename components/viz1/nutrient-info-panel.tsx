'use client'

import { Nutrient, NUTRIENT_FAMILY_COLORS } from '@/lib/viz1-cosmos-model'

interface Props {
  nutrients: Nutrient[]
  selectedId: string
  onSelect: (id: string) => void
}

export default function NutrientInfoPanel({ nutrients, selectedId, onSelect }: Props) {
  const nutrient = nutrients.find(n => n.id === selectedId)
  if (!nutrient) return null

  const col = NUTRIENT_FAMILY_COLORS[nutrient.family]
  const totalFoods = nutrient.links.reduce((s, l) => s + l.foods.length, 0)

  // Top foods of selected Nutrient
  const topFoods = [...nutrient.foods].sort((a, b) => b.rawValue - a.rawValue).slice(0, 10)

  return (
    <div
      className="w-full h-full overflow-y-auto flex flex-col gap-3 p-4 font-sans"
      style={{ background: 'rgba(10,15,46,0.95)', borderLeft: '1px solid #1a2a5a' }}
    >
      {/* Header */}
      <div className="pb-3 border-b" style={{ borderColor: '#1a2a5a' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full" style={{ background: col, boxShadow: `0 0 8px ${col}` }} />
          <h2 className="font-bold text-base" style={{ color: col }}>{nutrient.name}</h2>
        </div>
        <span
          className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ background: col + '20', color: col, border: `1px solid ${col}50` }}
        >
          {nutrient.family}
        </span>
      </div>
      {/* Top food sources */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider opacity-50 font-mono mb-2">Top Food Sources <span className="text-xs font-mono lowercase tracking-wider opacity-70 font-mono mb-2">per 100g</span></div>
        <div className="space-y-1">
          {topFoods.map((food, i) => (
            <div
              key={`${food.id}-${i}`}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
              style={{ background: '#0a1228', border: '1px solid #1a2a5a' }}
            >
              <span
                className="text-xs font-mono font-bold w-4 opacity-50"
                style={{ color: col }}
              >
                #{i + 1}
              </span>
              <span className="flex-1 text-xs font-medium text-foreground/80 truncate">{food.name}</span>
              <span className="text-xs font-mono font-bold flex-shrink-0" style={{ color: col }}>
                {food.rawValue.toFixed(1) + ' '}<span className="opacity-50 font-normal">{food.unit}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hint */}
      <div className="mt-auto text-xs opacity-30 font-mono text-center pt-2">
        Hover planets to reveal foods<br/>Double-click a planet to navigate
      </div>
    </div>
  )
}
