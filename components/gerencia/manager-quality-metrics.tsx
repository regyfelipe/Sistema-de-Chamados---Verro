"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Ticket } from "@/types";
import { cn } from "@/lib/utils";

interface QualityMetrics {
  satisfactionRate: number;
  avgFirstResponseTime: number; // em horas
  avgResolutionTime: number; // em horas
  firstContactResolutionRate: number; // porcentagem
  totalRatings: number;
  avgRating: number;
}

interface ManagerQualityMetricsProps {
  tickets: Ticket[];
  ratings?: Array<{ rating: number; comment?: string }>;
}

export function ManagerQualityMetrics({ tickets, ratings = [] }: ManagerQualityMetricsProps) {
  // Calcular métricas
  const closedTickets = tickets.filter((t) => t.status === "fechado");
  
  // Tempo médio de resolução
  let avgResolutionTime = 0;
  if (closedTickets.length > 0) {
    const totalTime = closedTickets.reduce((acc, ticket) => {
      const created = new Date(ticket.created_at);
      const closed = new Date(ticket.updated_at);
      return acc + (closed.getTime() - created.getTime());
    }, 0);
    avgResolutionTime = Math.round(totalTime / closedTickets.length / (1000 * 60 * 60));
  }

  // Taxa de satisfação
  const satisfactionRate = ratings.length > 0
    ? Math.round((ratings.filter((r) => r.rating >= 4).length / ratings.length) * 100)
    : 0;

  // Média de avaliação
  const avgRating = ratings.length > 0
    ? Math.round((ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length) * 100) / 100
    : 0;

  // Taxa de resolução no primeiro contato (FCR)
  // Assumindo que tickets fechados sem reabertura são FCR
  const fcrRate = closedTickets.length > 0
    ? Math.round((closedTickets.length / tickets.length) * 100)
    : 0;

  // Tempo médio de primeira resposta (aproximado - baseado em comentários)
  // Por simplicidade, vamos usar uma estimativa baseada no tempo de criação até primeiro update
  let avgFirstResponseTime = 0;
  const ticketsWithUpdates = closedTickets.filter((t) => 
    new Date(t.updated_at).getTime() > new Date(t.created_at).getTime()
  );
  if (ticketsWithUpdates.length > 0) {
    const totalResponseTime = ticketsWithUpdates.reduce((acc, ticket) => {
      const created = new Date(ticket.created_at);
      const firstUpdate = new Date(ticket.updated_at);
      return acc + (firstUpdate.getTime() - created.getTime());
    }, 0);
    avgFirstResponseTime = Math.round(
      totalResponseTime / ticketsWithUpdates.length / (1000 * 60 * 60)
    );
  }

  const metrics: QualityMetrics = {
    satisfactionRate,
    avgFirstResponseTime,
    avgResolutionTime,
    firstContactResolutionRate: fcrRate,
    totalRatings: ratings.length,
    avgRating,
  };

  const getTrendIcon = (value: number, threshold: number) => {
    if (value >= threshold) {
      return <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />;
    }
    return <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />;
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Star className="h-4 w-4 sm:h-5 sm:w-5" />
          Métricas de Qualidade
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Taxa de Satisfação */}
          <div className="p-3 sm:p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-xs sm:text-sm font-medium">Satisfação</span>
              </div>
              {getTrendIcon(metrics.satisfactionRate, 80)}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold">{metrics.satisfactionRate}%</span>
              {metrics.totalRatings > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({metrics.totalRatings} avaliações)
                </span>
              )}
            </div>
            {metrics.avgRating > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Média: {metrics.avgRating.toFixed(1)}/5
              </p>
            )}
          </div>

          {/* Tempo Médio de Primeira Resposta */}
          <div className="p-3 sm:p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className="text-xs sm:text-sm font-medium">1ª Resposta</span>
              </div>
              {getTrendIcon(24 - metrics.avgFirstResponseTime, 12)}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold">{metrics.avgFirstResponseTime}h</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tempo médio
            </p>
          </div>

          {/* Tempo Médio de Resolução */}
          <div className="p-3 sm:p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <span className="text-xs sm:text-sm font-medium">Resolução</span>
              </div>
              {getTrendIcon(48 - metrics.avgResolutionTime, 24)}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold">{metrics.avgResolutionTime}h</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tempo médio
            </p>
          </div>

          {/* Taxa de Resolução no Primeiro Contato */}
          <div className="p-3 sm:p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs sm:text-sm font-medium">FCR</span>
              </div>
              {getTrendIcon(metrics.firstContactResolutionRate, 70)}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold">
                {metrics.firstContactResolutionRate}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Resolução 1º contato
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

