"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Ticket } from "@/types";
import { cn } from "@/lib/utils";

interface SectorPerformance {
  sector_id: string;
  sector_name: string;
  total: number;
  aberto: number;
  em_atendimento: number;
  fechado: number;
  avgResolutionTime: number; 
  slaCompliance: number; 
}

interface ManagerSectorPerformanceProps {
  tickets: Ticket[];
}

export function ManagerSectorPerformance({ tickets }: ManagerSectorPerformanceProps) {
  
  const sectorMap = new Map<string, SectorPerformance>();

  tickets.forEach((ticket) => {
    const sectorId = ticket.sector_id || "none";
    const sectorName = ticket.sector?.name || "Sem setor";

    if (!sectorMap.has(sectorId)) {
      sectorMap.set(sectorId, {
        sector_id: sectorId,
        sector_name: sectorName,
        total: 0,
        aberto: 0,
        em_atendimento: 0,
        fechado: 0,
        avgResolutionTime: 0,
        slaCompliance: 0,
      });
    }

    const sector = sectorMap.get(sectorId)!;
    sector.total++;
    
    if (ticket.status === "aberto") sector.aberto++;
    else if (ticket.status === "em_atendimento") sector.em_atendimento++;
    else if (ticket.status === "fechado") sector.fechado++;
  });

  
  const sectors = Array.from(sectorMap.values()).map((sector) => {
    const sectorTickets = tickets.filter(
      (t) => (t.sector_id || "none") === sector.sector_id
    );

    
    const closedTickets = sectorTickets.filter((t) => t.status === "fechado");
    if (closedTickets.length > 0) {
      const totalTime = closedTickets.reduce((acc, ticket) => {
        const created = new Date(ticket.created_at);
        const closed = new Date(ticket.updated_at);
        return acc + (closed.getTime() - created.getTime());
      }, 0);
      sector.avgResolutionTime = Math.round(
        totalTime / closedTickets.length / (1000 * 60 * 60)
      );
    }

    
    const ticketsWithSLA = sectorTickets.filter((t) => t.sla_due_date);
    if (ticketsWithSLA.length > 0) {
      const now = new Date();
      const compliant = ticketsWithSLA.filter((ticket) => {
        if (ticket.status === "fechado") {
          return new Date(ticket.updated_at) <= new Date(ticket.sla_due_date!);
        }
        return now <= new Date(ticket.sla_due_date!);
      }).length;
      sector.slaCompliance = Math.round((compliant / ticketsWithSLA.length) * 100);
    }

    return sector;
  });

  
  sectors.sort((a, b) => b.total - a.total);

  if (sectors.length === 0) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
            Desempenho por Setor
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhum dado disponível
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
          Desempenho por Setor
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-3 sm:space-y-4">
          {sectors.map((sector) => {
            const slaStatus =
              sector.slaCompliance >= 90
                ? "excellent"
                : sector.slaCompliance >= 70
                ? "good"
                : sector.slaCompliance >= 50
                ? "warning"
                : "critical";

            return (
              <div
                key={sector.sector_id}
                className="p-3 sm:p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base mb-1 truncate">
                      {sector.sector_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <span>Total: <strong>{sector.total}</strong></span>
                      <span>•</span>
                      <span className="text-blue-600">Abertos: {sector.aberto}</span>
                      <span>•</span>
                      <span className="text-yellow-600">Atendimento: {sector.em_atendimento}</span>
                      <span>•</span>
                      <span className="text-green-600">Fechados: {sector.fechado}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        slaStatus === "excellent" && "border-green-500 text-green-700",
                        slaStatus === "good" && "border-blue-500 text-blue-700",
                        slaStatus === "warning" && "border-orange-500 text-orange-700",
                        slaStatus === "critical" && "border-red-500 text-red-700"
                      )}
                    >
                      SLA: {sector.slaCompliance}%
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div>
                    <p className="text-muted-foreground">Tempo Médio</p>
                    <p className="font-semibold">{sector.avgResolutionTime}h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Taxa de Fechamento</p>
                    <p className="font-semibold">
                      {sector.total > 0
                        ? Math.round((sector.fechado / sector.total) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-muted-foreground">Taxa de Ocupação</p>
                    <p className="font-semibold">
                      {sector.total > 0
                        ? Math.round(
                            ((sector.em_atendimento + sector.aberto) / sector.total) * 100
                          )
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

