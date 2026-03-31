'use client'

import { useState } from 'react'
import { Nutrient, NUTRIENT_FAMILY_COLORS, NUTRIENT_FAMILY_LABELS, NutrientFamily } from '@/lib/viz1-cosmos-model'

const FAMILIES: NutrientFamily[] = ['vitamin', 'mineral', 'other', 'macronutrient']

interface Props {
  nutrients: Nutrient[]
  selectedId: string
  onSelect: (id: string) => void
}

export default function NutrientSidebar({ nutrients, selectedId, onSelect }: Props) {
  const [filter, setFilter] = useState<NutrientFamily | 'all'>('all')

  const filtered = nutrients.filter(n => filter === 'all' || n.family === filter)

  return (
    <aside className="flex flex-col h-full overflow-hidden" style={{ background: 'rgba(10,15,46,0.95)', borderRight: '1px solid #1a2a5a' }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b" style={{ borderColor: '#1a2a5a' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-yellow-200 animate-pulse" />
          <h2 className="font-bold text-sm tracking-widest uppercase text-foreground/80 font-sans">
            NutriCosmos
          </h2>
        </div>
        <p className="text-xs opacity-40 font-mono">Select a nutrient to explore</p>
      </div>

      {/* Family filter chips */}
      <div className="px-3 py-2.5 flex flex-wrap gap-1.5 border-b" style={{ borderColor: '#1a2a5a' }}>
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-0.5 rounded-full text-xs font-mono transition-all ${filter === 'all' ? 'bg-primary/20 text-primary border border-primary/50' : 'text-foreground/40 border border-border/30 hover:border-border'}`}
        >
          All
        </button>
        {FAMILIES.map(fam => {
          const col = NUTRIENT_FAMILY_COLORS[fam]
          return (
            <button
              key={fam}
              onClick={() => setFilter(fam)}
              className="px-2.5 py-0.5 rounded-full text-xs font-mono transition-all"
              style={{
                background: filter === fam ? col + '25' : 'transparent',
                color: filter === fam ? col : 'rgba(232,234,246,0.4)',
                border: `1px solid ${filter === fam ? col + '80' : '#1a2a5a'}`,
              }}
            >
              {fam.charAt(0).toUpperCase() + fam.slice(1)}
            </button>
          )
        })}
      </div>

      {/* Nutrient list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin">
        {FAMILIES.filter(f => filter === 'all' || f === filter).map(family => {
          const group = filtered.filter(n => n.family === family)
          if (!group.length) return null
          const col = NUTRIENT_FAMILY_COLORS[family]
          return (
            <div key={family} className="mb-1">
              <div
                className="px-2 py-1 text-xs font-bold tracking-widest uppercase font-mono opacity-60"
                style={{ color: col }}
              >
                {NUTRIENT_FAMILY_LABELS[family]}
              </div>
              {group.map(n => {
                const isSelected = n.id === selectedId
                const linkCount = n.links.length
                const foodCount = n.links.reduce((s, l) => s + l.foods.length, 0)
                return (
                  <button
                    key={n.id}
                    onClick={() => onSelect(n.id)}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-all text-left group"
                    style={{
                      background: isSelected ? col + '18' : 'transparent',
                      border: `1px solid ${isSelected ? col + '50' : 'transparent'}`,
                    }}
                  >
                    {/* Color dot */}
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0 transition-all"
                      style={{
                        background: col,
                        boxShadow: isSelected ? `0 0 6px ${col}` : 'none',
                      }}
                    />
                    {/* Name */}
                    <span
                      className="flex-1 text-xs font-sans font-medium truncate"
                      style={{ color: isSelected ? col : 'rgba(232,234,246,0.75)' }}
                    >
                      {n.name}
                    </span>
                    {/* Stats */}
                    <span className="text-xs font-mono opacity-40 flex-shrink-0">
                      {linkCount}L
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="px-3 py-3 border-t space-y-2" style={{ borderColor: '#1a2a5a' }}>
        <div className="text-xs opacity-40 uppercase tracking-wider font-mono mb-1">Legend</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          {[
            { icon: '●', label: 'Nutrient' },
            { icon: '·', label: 'Dot size = amount' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1 opacity-50">
              <span className="font-mono text-primary">{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
