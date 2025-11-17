"use client"

import dynamic from "next/dynamic"
import { ComponentType } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

// Lazy load dos gráficos (componentes pesados)
export const TicketsBySectorChart = dynamic(
  () => import("./tickets-by-sector-chart").then((mod) => mod.TicketsBySectorChart),
  {
    loading: () => (
      <Card className="animate-in fade-in">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    ),
    ssr: false, // Desabilitar SSR para componentes com Recharts
  }
)

export const TicketsByPriorityChart = dynamic(
  () => import("./tickets-by-priority-chart").then((mod) => mod.TicketsByPriorityChart),
  {
    loading: () => (
      <Card className="animate-in fade-in">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    ),
    ssr: false,
  }
)

export const TicketsOverTimeChart = dynamic(
  () => import("./tickets-over-time-chart").then((mod) => mod.TicketsOverTimeChart),
  {
    loading: () => (
      <Card className="animate-in fade-in">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    ),
    ssr: false,
  }
)

export const SLAMetricsCard = dynamic(
  () => import("./sla-metrics").then((mod) => mod.SLAMetricsCard),
  {
    loading: () => (
      <Card className="animate-in fade-in">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    ),
  }
)

export const SatisfactionStats = dynamic(
  () => import("./satisfaction-stats").then((mod) => mod.SatisfactionStats),
  {
    loading: () => (
      <Card className="animate-in fade-in">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    ),
  }
)

export const PerformanceMetricsCard = dynamic(
  () => import("./performance-metrics").then((mod) => mod.PerformanceMetricsCard),
  {
    loading: () => (
      <Card className="animate-in fade-in">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    ),
  }
)

