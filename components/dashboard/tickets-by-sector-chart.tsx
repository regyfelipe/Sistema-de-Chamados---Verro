"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { TicketsBySector } from "@/lib/dashboard-stats"

interface TicketsBySectorChartProps {
  data: TicketsBySector[]
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--primary) / 0.8)",
  "hsl(var(--primary) / 0.6)",
  "hsl(var(--primary) / 0.4)",
  "hsl(var(--primary) / 0.2)",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
]

export function TicketsBySectorChart({ data }: TicketsBySectorChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chamados por Setor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    )
  }

  // Transformar dados para o formato esperado pelo Recharts
  const chartData = data.map((item) => ({
    name: item.sector_name,
    value: item.count,
    sector_name: item.sector_name,
    count: item.count,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chamados por Setor</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            {payload[0].payload.sector_name}
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {payload[0].value} chamados
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

