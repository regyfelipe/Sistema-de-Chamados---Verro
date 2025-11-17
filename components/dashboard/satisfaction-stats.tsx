"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RatingStats } from "@/types/ratings"
import { Star, TrendingUp, Users, MessageSquare } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { cn } from "@/lib/utils"

interface SatisfactionStatsProps {
  stats: RatingStats
}

const COLORS = {
  "1": "#ef4444",
  "2": "#f97316",
  "3": "#eab308",
  "4": "#84cc16",
  "5": "#22c55e",
}

export function SatisfactionStats({ stats }: SatisfactionStatsProps) {
  const chartData = Object.entries(stats.distribution)
    .reverse()
    .map(([rating, count]) => ({
      rating: `${rating} estrela${rating !== "1" ? "s" : ""}`,
      count,
      value: count,
      ratingNum: parseInt(rating),
    }))

  const getNPSColor = (score: number) => {
    if (score >= 50) return "text-green-600 dark:text-green-400"
    if (score >= 0) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getNPSLabel = (score: number) => {
    if (score >= 50) return "Excelente"
    if (score >= 0) return "Bom"
    return "Precisa Melhorar"
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Métricas Principais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Satisfação Geral
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{stats.average.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Média de {stats.total} avaliações</p>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-6 w-6",
                    star <= Math.round(stats.average)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Distribuição */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Distribuição de Avaliações</p>
            {Object.entries(stats.distribution)
              .reverse()
              .map(([rating, count]) => {
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
                return (
                  <div key={rating} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{rating} estrela{rating !== "1" ? "s" : ""}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </div>
                      <span className="text-muted-foreground">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* NPS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Net Promoter Score (NPS)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className={cn("text-5xl font-bold", getNPSColor(stats.nps.score))}>
              {stats.nps.score > 0 ? "+" : ""}
              {stats.nps.score.toFixed(0)}
            </p>
            <p className={cn("text-sm font-medium mt-2", getNPSColor(stats.nps.score))}>
              {getNPSLabel(stats.nps.score)}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm">Promotores (9-10)</span>
              </div>
              <span className="text-sm font-medium">
                {stats.nps.promoters} ({stats.total > 0 ? ((stats.nps.promoters / stats.total) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-sm">Neutros (7-8)</span>
              </div>
              <span className="text-sm font-medium">
                {stats.nps.passives} ({stats.total > 0 ? ((stats.nps.passives / stats.total) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm">Detratores (0-6)</span>
              </div>
              <span className="text-sm font-medium">
                {stats.nps.detractors} ({stats.total > 0 ? ((stats.nps.detractors / stats.total) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>

          {/* Gráfico de Distribuição */}
          <div className="pt-4">
            <p className="text-sm font-medium mb-3">Distribuição por Avaliação</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.ratingNum.toString() as keyof typeof COLORS]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

