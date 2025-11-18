"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TrendData {
  date: string;
  aberto: number;
  em_atendimento: number;
  fechado: number;
  total: number;
}

interface ManagerTrendsChartProps {
  data: TrendData[];
  period: "7" | "15" | "30";
}

export function ManagerTrendsChart({ data, period }: ManagerTrendsChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Evolução de Chamados</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-sm text-muted-foreground">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  const formattedData = data
    .filter((item) => item.date) // Filtrar itens sem data
    .map((item) => {
      try {
        return {
          ...item,
          formattedDate: format(parseISO(item.date), "dd/MM", { locale: ptBR }),
        };
      } catch (error) {
        // Se houver erro ao parsear a data, usar a data original
        return {
          ...item,
          formattedDate: item.date || "",
        };
      }
    });

  const periodLabel = {
    "7": "Últimos 7 dias",
    "15": "Últimos 15 dias",
    "30": "Últimos 30 dias",
  }[period];

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">Evolução de Chamados - {periodLabel}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="formattedDate"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
              stroke="#6b7280"
            />
            <YAxis stroke="#6b7280" />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length && payload[0]?.payload?.date) {
                  try {
                    const dateStr = format(parseISO(payload[0].payload.date), "dd 'de' MMMM", { locale: ptBR });
                    return (
                      <div className="rounded-lg border bg-white p-3 shadow-lg">
                        <div className="grid gap-2">
                          <div className="font-semibold text-sm">
                            {dateStr}
                          </div>
                          {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-xs sm:text-sm">
                                {entry.name}: <strong>{entry.value}</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  } catch (error) {
                    // Se houver erro ao formatar a data, mostrar data original
                    return (
                      <div className="rounded-lg border bg-white p-3 shadow-lg">
                        <div className="grid gap-2">
                          <div className="font-semibold text-sm">
                            {payload[0].payload.date || "Data inválida"}
                          </div>
                          {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-xs sm:text-sm">
                                {entry.name}: <strong>{entry.value}</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                }
                return null;
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="aberto"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Abertos"
            />
            <Line
              type="monotone"
              dataKey="em_atendimento"
              stroke="#eab308"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Em Atendimento"
            />
            <Line
              type="monotone"
              dataKey="fechado"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Fechados"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

