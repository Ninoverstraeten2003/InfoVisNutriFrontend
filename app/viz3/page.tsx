'use client'

import { useState, useEffect } from 'react'
import { MapPlaceholder } from '@/components/viz3/map-placeholder'
import { TrendCard } from '@/components/viz3/trend-card'
import { ParadoxCard } from '@/components/viz3/paradox-card'
import { RegionalDivideCard } from '@/components/viz3/regional-divide-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { ISO3_TO_NUM } from '@/lib/iso-mapping'

const API_BASE = 'https://nutriverse-api.ninoverstraeten.com'

const INDICATORS = [
  { value: 'anaemia', label: 'Anaemia' },
  { value: 'stunting', label: 'Stunting' },
  { value: 'wasting', label: 'Wasting' },
]

const DEFAULT_COUNTRY = 'AFG'

export default function HomePage() {
  const [indicator, setIndicator] = useState('anaemia')
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY)
  const [selectedCountryName, setSelectedCountryName] = useState<string>('')
  const [countryData, setCountryData] = useState<any>(null)
  const [regionalData, setRegionalData] = useState<any[]>([])
  const [mapData, setMapData] = useState<Record<string, number>>({})
  const [countryOptions, setCountryOptions] = useState<{iso3: string, name: string}[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [countryRes, regionalRes, mapRes] = await Promise.all([
          fetch(`${API_BASE}/rpc/viz3_country_profiles?p_indicator=${indicator}&iso3=eq.${selectedCountry}`),
          fetch(`${API_BASE}/rpc/viz3_region_comparison?p_indicator=${indicator}`),
          fetch(`${API_BASE}/rpc/viz3_all_country_deficiencies?p_indicator=${indicator}`)
        ])

        if (!countryRes.ok || !regionalRes.ok || !mapRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const countryJson = await countryRes.json()
        const regionalJson = await regionalRes.json()
        const mapDataJson = await mapRes.json()

        const country = countryJson[0] || null
        setCountryData(country)
        setRegionalData(regionalJson)
        if (country) {
          setSelectedCountryName(country.country_name)
        }
        
        // Compute Map Data and Dropdown Options
        const latestValues: Record<string, { year: number; value: number; disaggregation: string; iso3: string; name: string }> = {}
        const PREFERRED_DISAGGREGATIONS = ['Both', 'Total', 'All women']
        const getPriorityRank = (disagg: string) => {
          const index = PREFERRED_DISAGGREGATIONS.indexOf(disagg)
          return index === -1 ? 999 : index
        }
        
        mapDataJson.forEach((row: any) => {
          const numId = ISO3_TO_NUM[row.iso3]
          if (numId) {
            const existing = latestValues[numId]
            const isNewerYear = !existing || row.year > existing.year
            const isSameYearBetterDisaggregation = 
              existing && 
              row.year === existing.year && 
              getPriorityRank(row.disaggregation) < getPriorityRank(existing.disaggregation)

            if (isNewerYear || isSameYearBetterDisaggregation) {
              latestValues[numId] = { 
                year: row.year, 
                value: row.value,
                disaggregation: row.disaggregation,
                iso3: row.iso3,
                name: row.country_name
              }
            }
          }
        })
        
        const newMapData: Record<string, number> = {}
        const options: {iso3: string, name: string}[] = []
        Object.entries(latestValues).forEach(([numId, info]) => {
          newMapData[numId] = info.value
          if (!options.find(o => o.iso3 === info.iso3)) {
            options.push({ iso3: info.iso3, name: info.name })
          }
        })
        
        options.sort((a, b) => a.name.localeCompare(b.name))
        setMapData(newMapData)
        setCountryOptions(options)

      } catch (error) {
        console.error('[v0] Error fetching data:', error)
        setCountryData(null)
        setRegionalData([])
        setMapData({})
        setCountryOptions([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [indicator, selectedCountry])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10">
              <span className="text-lg font-bold text-accent">N</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">Nutriverse</h1>
              <p className="text-xs text-muted-foreground">What the World Is Missing</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm text-muted-foreground">Deficiency Indicator:</label>
            <Select value={indicator} onValueChange={setIndicator}>
              <SelectTrigger className="w-40 border-border/50 bg-card/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDICATORS.map((ind) => (
                  <SelectItem key={ind.value} value={ind.value}>
                    {ind.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Side - Sticky Map */}
        <div className="hidden w-1/2 lg:block">
          <div className="sticky top-16 h-[calc(100vh-4rem)] p-6">
            <MapPlaceholder 
              data={mapData}
              selectedIso3={selectedCountry}
              onCountryClick={(iso3) => {
                if (iso3) setSelectedCountry(iso3)
              }}
            />
          </div>
        </div>

        {/* Right Side - Scrollable Content */}
        <div className="w-full lg:w-1/2">
          <div className="space-y-6 p-6">
            {/* Mobile Map - shown only on smaller screens */}
            <div className="lg:hidden">
              <div className="h-96">
                <MapPlaceholder 
                  data={mapData}
                  selectedIso3={selectedCountry}
                  onCountryClick={(iso3) => {
                    if (iso3) setSelectedCountry(iso3)
                  }}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex h-96 items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-accent" />
                  <p className="text-sm text-muted-foreground">Loading data...</p>
                </div>
              </div>
            ) : countryData ? (
              <>
                {/* Section 1: The Hidden Hunger */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <TrendCard
                    countryName={countryData.country_name}
                    indicator={indicator}
                    latestValue={countryData.latest_value}
                    latestYear={countryData.latest_year}
                    trackStatus={countryData.track_status}
                    povertyRate={countryData.poverty_190}
                    povertyYear={countryData.poverty_190_year}
                    trendData={countryData.trend_data}
                  />
                </div>

                {/* Section 2: The Production Paradox */}
                {countryData.production_data && countryData.production_data.length > 0 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                    <ParadoxCard
                      countryName={countryData.country_name}
                      indicator={indicator}
                      deficiencyRate={countryData.latest_value}
                      productionData={countryData.production_data}
                    />
                  </div>
                )}

                {/* Section 3: Global Divide */}
                {regionalData.length > 0 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    <RegionalDivideCard indicator={indicator} regionalData={regionalData} />
                  </div>
                )}

              </>
            ) : (
              <div className="flex h-96 flex-col items-center justify-center gap-2">
                <p className="text-muted-foreground">No data available for the selected indicator in this country.</p>
              </div>
            )}

            {/* Country Selector - Always visible when not loading so users can recover from empty data states */}
            {!loading && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-xl">
                  <h3 className="mb-4 text-lg font-semibold">Explore Other Countries</h3>
                  <div className="flex gap-2">
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger className="flex-1 border-border/50 bg-background/50">
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countryOptions.map(c => (
                          <SelectItem key={c.iso3} value={c.iso3}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => setSelectedCountry(DEFAULT_COUNTRY)}>
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
