"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, User } from "lucide-react";
import { Ticket } from "@/types";
import { cn } from "@/lib/utils";

interface AttendantPerformance {
  user_id: string;
  user_name: string;
  sector_name: string;
  tickets_closed: number;
  tickets_in_progress: number;
  avg_resolution_time: number; // em horas
  high_priority_count: number;
}

interface ManagerTopAttendantsProps {
  tickets: Ticket[];
  limit?: number;
}

export function ManagerTopAttendants({ tickets, limit = 10 }: ManagerTopAttendantsProps) {
  // Agrupar por atendente
  const attendantMap = new Map<string, AttendantPerformance>();

  tickets.forEach((ticket) => {
    if (!ticket.assigned_to) return;

    const userId = ticket.assigned_to;
    const userName = ticket.assigned_to_user?.name || "Desconhecido";
    const sectorName = ticket.sector?.name || "Sem setor";

    if (!attendantMap.has(userId)) {
      attendantMap.set(userId, {
        user_id: userId,
        user_name: userName,
        sector_name: sectorName,
        tickets_closed: 0,
        tickets_in_progress: 0,
        avg_resolution_time: 0,
        high_priority_count: 0,
      });
    }

    const attendant = attendantMap.get(userId)!;

    if (ticket.status === "fechado") {
      attendant.tickets_closed++;
      
      // Calcular tempo de resolução
      const created = new Date(ticket.created_at);
      const closed = new Date(ticket.updated_at);
      const resolutionTime = (closed.getTime() - created.getTime()) / (1000 * 60 * 60);
      
      if (attendant.avg_resolution_time === 0) {
        attendant.avg_resolution_time = resolutionTime;
      } else {
        attendant.avg_resolution_time = 
          (attendant.avg_resolution_time + resolutionTime) / 2;
      }
    } else if (ticket.status === "em_atendimento") {
      attendant.tickets_in_progress++;
    }

    if (ticket.priority === "alta" || ticket.priority === "critica") {
      attendant.high_priority_count++;
    }
  });

  // Converter para array e ordenar
  const attendants = Array.from(attendantMap.values())
    .map((attendant) => ({
      ...attendant,
      avg_resolution_time: Math.round(attendant.avg_resolution_time),
    }))
    .sort((a, b) => {
      // Ordenar por: tickets fechados primeiro, depois por tempo médio
      if (b.tickets_closed !== a.tickets_closed) {
        return b.tickets_closed - a.tickets_closed;
      }
      return a.avg_resolution_time - b.avg_resolution_time;
    })
    .slice(0, limit);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />;
    return <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />;
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  if (attendants.length === 0) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
            Ranking de Atendentes
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
          <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
          Top {limit} Atendentes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-2 sm:space-y-3">
          {attendants.map((attendant, index) => (
            <div
              key={attendant.user_id}
              className={cn(
                "p-3 sm:p-4 rounded-lg border transition-shadow",
                index < 3 ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200" : "bg-card"
              )}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  {getRankIcon(index)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm sm:text-base truncate">
                      {attendant.user_name}
                    </span>
                    <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">
                      {getRankBadge(index)}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {attendant.sector_name}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-lg sm:text-xl font-bold text-primary">
                      {attendant.tickets_closed}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Fechados</p>
                  </div>
                  {attendant.tickets_in_progress > 0 && (
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-semibold text-yellow-600">
                        {attendant.tickets_in_progress}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Em andamento</p>
                    </div>
                  )}
                  {attendant.avg_resolution_time > 0 && (
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-semibold">
                        {attendant.avg_resolution_time}h
                      </div>
                      <p className="text-[10px] text-muted-foreground">Média</p>
                    </div>
                  )}
                </div>
              </div>
              {attendant.high_priority_count > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <Badge variant="destructive" className="text-[10px] sm:text-xs">
                    {attendant.high_priority_count} alta/crítica
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

