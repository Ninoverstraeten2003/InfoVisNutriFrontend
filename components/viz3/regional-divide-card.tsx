'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts'
import { Globe2 } from 'lucide-react'

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
        <div className="rounded-lg border border-[#444] bg-[#1a1a1a] p-3 shadow-xl">
          <p className="font-semibold text-[#e5e5e5]">{payload[0].payload.region}</p>
          <p className="text-sm text-[#a3a3a3]">
            Poverty: {payload[0].payload.poverty.toFixed(2)}%
          </p>
          <p className="text-sm text-[#a3a3a3]">
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
          <div className="rounded-xl border border-chart-2/20 bg-chart-2/10 p-3">
            <Globe2 className="h-6 w-6 text-chart-2" />
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
                <span className="text-lg font-bold text-destructive">
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
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.5} />
                <XAxis
                  type="number"
                  dataKey="poverty"
                  name="Poverty"
                  stroke="#e5e5e5"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#e5e5e5' }}
                  label={{
                    value: 'Poverty Rate (%)',
                    position: 'insideBottom',
                    offset: -5,
                    style: { fill: '#e5e5e5' },
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="deficiency"
                  name={indicator}
                  stroke="#e5e5e5"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#e5e5e5' }}
                  label={{
                    value: `${indicator} Rate (%)`,
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: '#e5e5e5' },
                  }}
                />
                <ZAxis type="number" dataKey="size" range={[400, 400]} />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter
                  data={chartData}
                  fill="#f97316"
                  fillOpacity={0.7}
                  stroke="#f97316"
                  strokeWidth={2}
                />
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
                <div className="text-sm font-semibold text-destructive">
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
