'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface TrendCardProps {
  countryName: string
  indicator: string
  latestValue: number
  latestYear: number
  trackStatus: string
  povertyRate: number | null
  povertyYear: number | null
  trendData: Record<string, number>
}

export function TrendCard({
  countryName,
  indicator,
  latestValue,
  latestYear,
  trackStatus,
  povertyRate,
  povertyYear,
  trendData,
}: TrendCardProps) {
  const chartData = Object.entries(trendData).map(([year, value]) => ({
    year,
    value,
  }))

  const getStatusColor = (status: string) => {
    if (status.toLowerCase().includes('on course') || status.toLowerCase().includes('progress')) {
      return 'bg-green-500/10 text-green-400 border-green-500/20'
    }
    return 'bg-destructive/10 text-destructive border-destructive/20'
  }

  const trend = chartData[chartData.length - 1]?.value > chartData[0]?.value

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <CardTitle className="text-3xl font-bold text-balance">The Hidden Hunger</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {countryName}&apos;s 20-year {indicator} trajectory
          </CardDescription>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-4 py-3">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Current Rate</span>
              <span className="text-2xl font-bold text-destructive">
                {latestValue.toFixed(1)}%
              </span>
            </div>
            {trend ? (
              <TrendingUp className="h-5 w-5 text-destructive" />
            ) : (
              <TrendingDown className="h-5 w-5 text-green-400" />
            )}
          </div>
          
          {povertyRate !== null && (
            <div className="flex flex-col rounded-xl border border-border/50 bg-background/50 px-4 py-3">
              <span className="text-xs text-muted-foreground">Poverty ($1.90/day)</span>
              <span className="text-2xl font-bold">
                {povertyRate.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        <Badge variant="outline" className={getStatusColor(trackStatus)}>
          SDG Track: {trackStatus}
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height={256}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.5} />
              <XAxis
                dataKey="year"
                stroke="#e5e5e5"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                tick={{ fill: '#e5e5e5' }}
                tickFormatter={(value) => {
                  const idx = chartData.findIndex((d) => d.year === value)
                  return idx % 4 === 0 ? value : ''
                }}
              />
              <YAxis
                stroke="#e5e5e5"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#e5e5e5' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: '#e5e5e5',
                }}
                labelStyle={{ color: '#e5e5e5' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#f97316"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#f97316' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
