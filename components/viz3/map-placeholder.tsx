'use client'


import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { NUM_TO_ISO3 } from '@/lib/iso-mapping'

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface MapPlaceholderProps {
  data: Record<string, number>
  selectedIso3?: string
  onCountryClick?: (iso3: string) => void
}

export function MapPlaceholder({ data, selectedIso3, onCountryClick }: MapPlaceholderProps) {
  const getCountryColor = (countryId: string) => {
    const rate = data[countryId]
    if (!rate) return 'oklch(0.25 0 0)'
    
    // Color scale from low (blue) to high (crimson accent) - brighter for visibility
    if (rate < 10) return 'oklch(0.60 0.15 250)'
    if (rate < 20) return 'oklch(0.65 0.18 200)'
    if (rate < 30) return 'oklch(0.68 0.18 60)'
    if (rate < 40) return 'oklch(0.70 0.20 30)'
    return 'oklch(0.75 0.22 12)' // High deficiency - bright accent color
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
      
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 140,
        }}
        className="h-full w-full"
      >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const numericId = String(geo.id).padStart(3, '0')
                const activeIso3 = NUM_TO_ISO3[numericId]
                const isSelected = activeIso3 && activeIso3 === selectedIso3
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isSelected ? 'oklch(0.98 0 0)' : getCountryColor(numericId)}
                    stroke="oklch(0.12 0 0)"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: {
                        fill: 'oklch(0.85 0.10 220)',
                        outline: 'none',
                        cursor: 'pointer',
                      },
                      pressed: { outline: 'none' },
                    }}
                    onClick={() => {
                      if (activeIso3 && onCountryClick) {
                        onCountryClick(activeIso3)
                      }
                    }}
                  />
                )
              })
            }
          </Geographies>
      </ComposableMap>
      
      {/* Legend */}
      <div className="absolute bottom-6 left-6 rounded-lg border border-border bg-card/90 backdrop-blur-sm p-4">
        <div className="text-xs font-medium text-foreground mb-2">Deficiency Rate (%)</div>
        <div className="flex gap-1">
          {[
            { label: '<10', color: 'oklch(0.60 0.15 250)' },
            { label: '10-20', color: 'oklch(0.65 0.18 200)' },
            { label: '20-30', color: 'oklch(0.68 0.18 60)' },
            { label: '30-40', color: 'oklch(0.70 0.20 30)' },
            { label: '40+', color: 'oklch(0.75 0.22 12)' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <div
                className="h-4 w-8 rounded"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
