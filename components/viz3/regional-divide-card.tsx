'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell } from 'recharts'
import { Globe2 } from 'lucide-react'
import { getDeficiencyColor } from '@/components/viz3/map-placeholder'

interface RegionalData {
  region: string
  latest_deficiency_value: number
  latest_deficiency_year: number
  latest_poverty_190: number
  latest_poverty_190_year: number
}

interface RegionalDivideCardProps {
  indicator: string
  regionalData: RegionalData[]
}

export function RegionalDivideCard({ indicator, regionalData }: RegionalDivideCardProps) {
  const chartData = regionalData.map((region) => ({
    region: region.region,
    poverty: region.latest_poverty_190,
    deficiency: region.latest_deficiency_value,
    size: 100,
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
          <p className="font-semibold text-foreground">{payload[0].payload.region}</p>
          <p className="text-sm text-muted-foreground">
            Poverty: {payload[0].payload.poverty.toFixed(2)}%
          </p>
          <p className="text-sm text-muted-foreground">
            {indicator}: {payload[0].payload.deficiency.toFixed(2)}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
      <CardHeader className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
            <Globe2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-2 flex-1">
            <CardTitle className="text-3xl font-bold text-balance">The Global Divide</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Regional comparison: poverty vs. {indicator}
            </CardDescription>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {regionalData.slice(0, 2).map((region) => (
            <div
              key={region.region}
              className="rounded-xl border border-border/50 bg-background/50 p-4"
            >
              <div className="text-xs text-muted-foreground mb-1">{region.region}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold" style={{ color: getDeficiencyColor(region.latest_deficiency_value) }}>
                  {region.latest_deficiency_value.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">{indicator}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Poverty: {region.latest_poverty_190.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis
                  type="number"
                  dataKey="poverty"
                  name="Poverty"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b' }}
                  label={{
                    value: 'Poverty Rate (%)',
                    position: 'insideBottom',
                    offset: -5,
                    style: { fill: '#64748b' },
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="deficiency"
                  name={indicator}
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b' }}
                  label={{
                    value: `${indicator} Rate (%)`,
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: '#64748b' },
                  }}
                />
                <ZAxis type="number" dataKey="size" range={[400, 400]} />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={chartData} strokeWidth={2}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getDeficiencyColor(entry.deficiency)}
                      stroke={getDeficiencyColor(entry.deficiency)}
                      fillOpacity={0.7}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {regionalData.slice(2).map((region) => (
              <div
                key={region.region}
                className="rounded-lg border border-border/30 bg-muted/20 p-3 text-center flex flex-col justify-center"
              >
                <div className="text-xs text-muted-foreground mb-1 line-clamp-1" title={region.region}>
                  {region.region}
                </div>
                <div className="text-sm font-semibold" style={{ color: getDeficiencyColor(region.latest_deficiency_value) }}>
                  {region.latest_deficiency_value.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
