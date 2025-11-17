"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { TicketsOverTime } from "@/lib/dashboard-stats"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TicketsOverTimeChartProps {
  data: TicketsOverTime[]
}

export function TicketsOverTimeChart({ data }: TicketsOverTimeChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chamados ao Longo do Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    )
  }

  const formattedData = data.map((item) => ({
    ...item,
    formattedDate: format(parseISO(item.date), "dd/MM", { locale: ptBR }),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chamados ao Longo do Tempo (Últimos 30 dias)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="formattedDate"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            {format(parseISO(payload[0].payload.date), "dd 'de' MMMM", { locale: ptBR })}
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
            <Line
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

