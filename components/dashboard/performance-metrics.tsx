"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PerformanceMetrics } from "@/lib/performance-metrics"
import { Clock, CheckCircle2, TrendingUp, TrendingDown, BarChart3, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

interface PerformanceMetricsProps {
  metrics: PerformanceMetrics
}

export function PerformanceMetricsCard({ metrics }: PerformanceMetricsProps) {
  const formatTime = (hours: number): string => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60)
      return `${minutes} min`
    } else if (hours < 24) {
      return `${Math.round(hours * 100) / 100}h`
    } else {
      const days = Math.floor(hours / 24)
      const remainingHours = Math.round(hours % 24)
      return `${days}d ${remainingHours}h`
    }
  }

  const formatPercentage = (value: number): string => {
    return `${Math.round(value * 100) / 100}%`
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-red-500" />
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-green-500" />
    }
    return null
  }

  const getTrendColor = (change: number, isTime: boolean = false) => {
    
    if (isTime) {
      return change < 0 ? "text-green-600" : change > 0 ? "text-red-600" : "text-muted-foreground"
    } else {
      return change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Métricas de Performance</h2>
        <p className="text-muted-foreground">
          Indicadores de desempenho do time de atendimento
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primeira Resposta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(metrics.avgFirstResponseTime)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {getTrendIcon(metrics.trends.firstResponseTime.change)}
              <span className={cn(getTrendColor(metrics.trends.firstResponseTime.change, true))}>
                {metrics.trends.firstResponseTime.change > 0 ? "+" : ""}
                {formatPercentage(Math.abs(metrics.trends.firstResponseTime.change))}
              </span>
              <span>vs período anterior</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tempo médio até primeira resposta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Resolução</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(metrics.avgResolutionTime)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {getTrendIcon(metrics.trends.resolutionTime.change)}
              <span className={cn(getTrendColor(metrics.trends.resolutionTime.change, true))}>
                {metrics.trends.resolutionTime.change > 0 ? "+" : ""}
                {formatPercentage(Math.abs(metrics.trends.resolutionTime.change))}
              </span>
              <span>vs período anterior</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tempo médio até resolução
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FCR Rate</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(metrics.firstContactResolutionRate)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {getTrendIcon(metrics.trends.fcrRate.change)}
              <span className={cn(getTrendColor(metrics.trends.fcrRate.change))}>
                {metrics.trends.fcrRate.change > 0 ? "+" : ""}
                {formatPercentage(Math.abs(metrics.trends.fcrRate.change))}
              </span>
              <span>vs período anterior</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Resolução na primeira interação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfação</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(metrics.satisfactionRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Taxa de satisfação (rating ≥ 4)
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Volume de Chamados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Hoje</p>
              <p className="text-2xl font-bold">{metrics.ticketVolume.today}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Esta Semana</p>
              <p className="text-2xl font-bold">{metrics.ticketVolume.thisWeek}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Este Mês</p>
              <p className="text-2xl font-bold">{metrics.ticketVolume.thisMonth}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Mês Anterior</p>
              <p className="text-2xl font-bold">{metrics.ticketVolume.lastMonth}</p>
              {metrics.ticketVolume.lastMonth > 0 && (
                <p className="text-xs text-muted-foreground">
                  {metrics.ticketVolume.thisMonth > metrics.ticketVolume.lastMonth ? (
                    <span className="text-green-600">
                      +{Math.round(((metrics.ticketVolume.thisMonth - metrics.ticketVolume.lastMonth) / metrics.ticketVolume.lastMonth) * 100)}%
                    </span>
                  ) : (
                    <span className="text-red-600">
                      {Math.round(((metrics.ticketVolume.thisMonth - metrics.ticketVolume.lastMonth) / metrics.ticketVolume.lastMonth) * 100)}%
                    </span>
                  )}
                  {" "}vs mês anterior
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

