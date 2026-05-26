'use client'

import { Nutrient, NUTRIENT_FAMILY_COLORS } from '@/lib/viz1-cosmos-model'
import Link from 'next/link'
import { IconChartBar, IconMap } from '@tabler/icons-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

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
      style={{ background: 'color-mix(in srgb, var(--sidebar) 95%, transparent)', borderLeft: '1px solid var(--sidebar-border)' }}
    >
      {/* Header */}
      <div className="pb-3 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
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
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono mb-2">Top Food Sources <span className="text-xs font-mono lowercase tracking-wider text-muted-foreground font-mono mb-2">per 100g</span></div>
        <div className="space-y-1">
          {topFoods.map((food, i) => (
            <Tooltip key={`${food.id}-${i}`}>
              <TooltipTrigger asChild>
                <div
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 cursor-default"
                  style={{ background: 'var(--sidebar-accent)', border: '1px solid var(--sidebar-border)' }}
                >
                  <span
                    className="text-xs font-mono font-bold w-5 shrink-0"
                    style={{ color: col }}
                  >
                    #{i + 1}
                  </span>
                  <span className="flex-1 text-xs font-medium text-foreground/80 line-clamp-2 leading-tight">{food.name}</span>
                  <span className="text-xs font-mono font-bold shrink-0" style={{ color: col }}>
                    {food.rawValue.toFixed(1) + ' '}<span className="text-muted-foreground font-normal">{food.unit}</span>
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[250px]">
                {food.name}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* App Links */}
      <div className="flex flex-col gap-2 mt-4 border-t pt-4" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono mb-1">Explore Further</div>
        <Link 
          href="/viz2"
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-foreground/10 transition-colors"
          style={{ background: 'var(--sidebar-accent)', border: '1px solid var(--sidebar-border)' }}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20 text-primary">
            <IconChartBar className="h-4 w-4" />
          </div>
          <span className="flex-1 text-xs font-medium text-foreground/80 leading-tight">
            Build a meal with these sources in Viz 2
          </span>
        </Link>
        <Link 
          href="/viz3"
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-foreground/10 transition-colors"
          style={{ background: 'var(--sidebar-accent)', border: '1px solid var(--sidebar-border)' }}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20 text-primary">
            <IconMap className="h-4 w-4" />
          </div>
          <span className="flex-1 text-xs font-medium text-foreground/80 leading-tight">
            See global health impacts in Viz 3
          </span>
        </Link>
      </div>

      {/* Hint */}
      <div className="mt-auto text-xs text-muted-foreground font-mono text-center pt-4">
        Hover planets to reveal foods<br/>Double-click a planet to navigate
      </div>
    </div>
  )
}
