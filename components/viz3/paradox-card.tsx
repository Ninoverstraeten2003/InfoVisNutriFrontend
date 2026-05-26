'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { Wheat } from 'lucide-react'

interface ProductionItem {
  food: string
  year: number
  tonnes: number
  mapped_food_id: number
}

interface ParadoxCardProps {
  countryName: string
  indicator: string
  deficiencyRate: number
  productionData: ProductionItem[]
  themeColor?: string
}

export function ParadoxCard({
  countryName,
  indicator,
  deficiencyRate,
  productionData,
  themeColor = 'var(--destructive)',
}: ParadoxCardProps) {
  const topProduction = productionData
    .slice(0, 10)
    .map((item) => ({
      name: item.food.length > 25 ? item.food.substring(0, 25) + '...' : item.food,
      tonnes: item.tonnes,
    }))
    .reverse()

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
      <CardHeader className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
            <Wheat className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-2 flex-1">
            <CardTitle className="text-3xl font-bold text-balance">The Production Paradox</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              What they produce vs. what they lack
            </CardDescription>
          </div>
        </div>

        <div 
          className="rounded-xl border p-4"
          style={{ 
            borderColor: `color-mix(in srgb, ${themeColor} 20%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${themeColor} 5%, transparent)`
          }}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-muted-foreground">Despite producing</span>
            <span className="text-2xl font-bold text-foreground">
              {(productionData.reduce((sum, item) => sum + item.tonnes, 0) / 1000000).toFixed(1)}M
            </span>
            <span className="text-sm text-muted-foreground">tonnes of food,</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold" style={{ color: themeColor }}>{deficiencyRate}%</span>
            <span className="text-sm text-muted-foreground">still suffer from {indicator}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Most Produced Foods</h4>
          <div className="h-96">
            <ResponsiveContainer width="100%" height={384}>
              <BarChart data={topProduction} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={120}
                  tick={{ fill: '#64748b' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                  }}
                  formatter={(value: ValueType | undefined) => [
                    `${(Number(value) / 1000).toFixed(0)}k tonnes`,
                    'Production',
                  ]}
                />
                <Bar
                  dataKey="tonnes"
                  fill={themeColor}
                  radius={[0, 8, 8, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
