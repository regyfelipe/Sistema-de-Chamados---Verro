"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SLAMetrics } from "@/lib/dashboard-stats"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface SLAMetricsProps {
  metrics: SLAMetrics
}

export function SLAMetricsCard({ metrics }: SLAMetricsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas de SLA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <AlertCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total com SLA</p>
              <p className="text-2xl font-bold">{metrics.total}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">No Prazo</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {metrics.on_time}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Atrasados</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {metrics.late}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Taxa de Cumprimento</span>
            <span className="font-semibold">{metrics.compliance_rate}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${metrics.compliance_rate}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

