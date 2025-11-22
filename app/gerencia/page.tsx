"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Ticket, User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Ticket as TicketIcon,
  Clock,
  UserCheck,
  CheckCircle2,
  Users,
  AlertCircle,
  TrendingUp,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TicketDetailModal } from "@/components/gerencia/ticket-detail-modal";
import { ManagerTrendsChart } from "@/components/gerencia/manager-trends-chart";
import { ManagerSLAAlerts } from "@/components/gerencia/manager-sla-alerts";
import { ManagerSectorPerformance } from "@/components/gerencia/manager-sector-performance";
import { ManagerQualityMetrics } from "@/components/gerencia/manager-quality-metrics";
import { ManagerTopAttendants } from "@/components/gerencia/manager-top-attendants";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { getAllRatings } from "@/lib/ratings";

interface ManagerDashboardStats {
  aberto: number;
  em_atendimento: number;
  aguardando: number;
  fechado: number;
  total: number;
}

interface ActiveAttendant {
  user_id: string;
  user_name: string;
  sector_name: string;
  tickets_count: number;
  priority_high: number;
}

interface PriorityStats {
  baixa: number;
  media: number;
  alta: number;
  critica: number;
}

export default function GerenciaPage() {
  const [stats, setStats] = useState<ManagerDashboardStats>({
    aberto: 0,
    em_atendimento: 0,
    aguardando: 0,
    fechado: 0,
    total: 0,
  });
  const [activeAttendants, setActiveAttendants] = useState<ActiveAttendant[]>(
    []
  );
  const [priorityStats, setPriorityStats] = useState<PriorityStats>({
    baixa: 0,
    media: 0,
    alta: 0,
    critica: 0,
  });
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [period, setPeriod] = useState<"7" | "15" | "30">("30");
  const [ratings, setRatings] = useState<Array<{ rating: number; comment?: string }>>([]);
  const [trendsData, setTrendsData] = useState<Array<{
    date: string;
    aberto: number;
    em_atendimento: number;
    fechado: number;
    total: number;
  }>>([]);


  const fetchDashboardData = async () => {
    try {

      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select(
          `
          *,
          created_by_user:users!tickets_created_by_fkey(id, name),
          assigned_to_user:users!tickets_assigned_to_fkey(id, name, sector_id),
          sector:sectors(id, name)
        `
        )
        .order("created_at", { ascending: false });


      const attendantIds = Array.from(
        new Set(
          tickets
            ?.filter((t: any) => t.assigned_to)
            .map((t: any) => t.assigned_to) || []
        )
      );

      const attendantsWithSectors: Record<string, any> = {};
      if (attendantIds.length > 0) {
        const { data: attendantsData } = await supabase
          .from("users")
          .select(
            `
            id,
            name,
            sector_id,
            sector:sectors(id, name)
          `
          )
          .in("id", attendantIds);

        attendantsData?.forEach((attendant: any) => {
          attendantsWithSectors[attendant.id] = attendant;
        });
      }

      if (ticketsError) {
        console.error("Erro ao buscar tickets:", ticketsError);
        return;
      }


      const newStats: ManagerDashboardStats = {
        aberto: tickets?.filter((t: any) => t.status === "aberto").length || 0,
        em_atendimento:
          tickets?.filter((t: any) => t.status === "em_atendimento").length ||
          0,
        aguardando:
          tickets?.filter((t: any) => t.status === "aguardando").length || 0,
        fechado:
          tickets?.filter((t: any) => t.status === "fechado").length || 0,
        total: tickets?.length || 0,
      };


      const newPriorityStats: PriorityStats = {
        baixa: tickets?.filter((t: any) => t.priority === "baixa").length || 0,
        media: tickets?.filter((t: any) => t.priority === "media").length || 0,
        alta: tickets?.filter((t: any) => t.priority === "alta").length || 0,
        critica:
          tickets?.filter((t: any) => t.priority === "critica").length || 0,
      };


      const activeTickets =
        tickets?.filter(
          (t: any) => t.status === "em_atendimento" && t.assigned_to
        ) || [];

      const attendantsMap = new Map<string, ActiveAttendant>();

      activeTickets.forEach((ticket: any) => {
        const userId = ticket.assigned_to;
        if (!userId) return;

        if (!attendantsMap.has(userId)) {

          const attendantData =
            attendantsWithSectors[userId] || ticket.assigned_to_user;
          const attendantSector =
            attendantData?.sector?.name || ticket.sector?.name || "Sem setor";

          attendantsMap.set(userId, {
            user_id: userId,
            user_name:
              attendantData?.name ||
              ticket.assigned_to_user?.name ||
              "Desconhecido",
            sector_name: attendantSector,
            tickets_count: 0,
            priority_high: 0,
          });
        }

        const attendant = attendantsMap.get(userId)!;
        attendant.tickets_count++;
        if (ticket.priority === "alta" || ticket.priority === "critica") {
          attendant.priority_high++;
        }
      });

      const newActiveAttendants = Array.from(attendantsMap.values()).sort(
        (a, b) => b.tickets_count - a.tickets_count
      );


      const newRecentTickets = tickets?.slice(0, 10) || [];


      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const trendsMap = new Map<string, { aberto: number; em_atendimento: number; fechado: number; total: number }>();
      
      tickets?.forEach((ticket: any) => {
        
        
        const ticketDate = new Date(ticket.created_at);
        
        
        if (ticketDate >= startDate) {
          const isoString = ticketDate.toISOString();
          
          
          const dateStr = isoString.split("T")[0];
          
          
          if (!trendsMap.has(dateStr)) {
            trendsMap.set(dateStr, { aberto: 0, em_atendimento: 0, fechado: 0, total: 0 });
          }
          const dayData = trendsMap.get(dateStr)!;
          dayData.total++;
          if (ticket.status === "aberto") dayData.aberto++;
          else if (ticket.status === "em_atendimento") dayData.em_atendimento++;
          else if (ticket.status === "fechado") dayData.fechado++;
        }
      });


      const trendsArray: Array<{ date: string; aberto: number; em_atendimento: number; fechado: number; total: number }> = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        const dateStr = date.toISOString().split("T")[0];
        const existingData = trendsMap.get(dateStr);
        trendsArray.push({
          date: dateStr,
          aberto: existingData?.aberto || 0,
          em_atendimento: existingData?.em_atendimento || 0,
          fechado: existingData?.fechado || 0,
          total: existingData?.total || 0,
        });
      }


      const ratingsData = await getAllRatings(1000);
      const ratingsArray = ratingsData.map((r) => ({ rating: r.rating, comment: r.comment || undefined }));

      setStats(newStats);
      setPriorityStats(newPriorityStats);
      setActiveAttendants(newActiveAttendants);
      setRecentTickets(newRecentTickets);
      setAllTickets(tickets || []);
      setTrendsData(trendsArray);
      setRatings(ratingsArray);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchDashboardData();


    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);

  }, [period]);


  useEffect(() => {
    const channel = supabase
      .channel("manager-dashboard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
        },
        () => {

          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critica":
        return "bg-red-500 text-white";
      case "alta":
        return "bg-orange-500 text-white";
      case "media":
        return "bg-yellow-500 text-white";
      case "baixa":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "critica":
        return "Crítica";
      case "alta":
        return "Alta";
      case "media":
        return "Média";
      case "baixa":
        return "Baixa";
      default:
        return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto":
        return "bg-blue-100 text-blue-800";
      case "em_atendimento":
        return "bg-yellow-100 text-yellow-800";
      case "aguardando":
        return "bg-orange-100 text-orange-800";
      case "fechado":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard Gerencial
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Acompanhamento em tempo real dos chamados
            </p>
          </div>
          <div className="text-left md:text-right">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className="relative">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 animate-pulse" />
                <span className="absolute top-0 right-0 h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-500 rounded-full animate-ping" />
              </div>
              <span className="font-medium">
                Atualizado: {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
              Atualização automática a cada 30s • Tempo real ativo
            </p>
          </div>
        </div>

        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Período:</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={period === "7" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod("7")}
                  className="text-xs sm:text-sm"
                >
                  7 dias
                </Button>
                <Button
                  variant={period === "15" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod("15")}
                  className="text-xs sm:text-sm"
                >
                  15 dias
                </Button>
                <Button
                  variant={period === "30" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod("30")}
                  className="text-xs sm:text-sm"
                >
                  30 dias
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
              <TicketIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                chamados no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Abertos</CardTitle>
              <div className="rounded-full p-1.5 sm:p-2 bg-blue-50">
                <TicketIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {stats.aberto}
              </div>
              <p className="text-xs text-muted-foreground">
                aguardando atendimento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Em Atendimento
              </CardTitle>
              <div className="rounded-full p-1.5 sm:p-2 bg-yellow-50">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                {stats.em_atendimento}
              </div>
              <p className="text-xs text-muted-foreground">sendo trabalhados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Aguardando</CardTitle>
              <div className="rounded-full p-1.5 sm:p-2 bg-orange-50">
                <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">
                {stats.aguardando}
              </div>
              <p className="text-xs text-muted-foreground">
                aguardando resposta
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Fechados</CardTitle>
              <div className="rounded-full p-1.5 sm:p-2 bg-green-50">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {stats.fechado}
              </div>
              <p className="text-xs text-muted-foreground">resolvidos</p>
            </CardContent>
          </Card>
        </div>

        
        <ManagerSLAAlerts tickets={allTickets} />

        
        <ManagerQualityMetrics tickets={allTickets} ratings={ratings} />

        
        <ManagerTrendsChart data={trendsData} period={period} />

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          
          <ManagerSectorPerformance tickets={allTickets} />

          
          <ManagerTopAttendants tickets={allTickets} limit={10} />
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                Atendentes Ativos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {activeAttendants.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {activeAttendants.map((attendant) => (
                    <div
                      key={attendant.user_id}
                      className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-card"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">{attendant.user_name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {attendant.sector_name}
                        </p>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="text-lg sm:text-2xl font-bold">
                            {attendant.tickets_count}
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">
                            chamados
                          </span>
                        </div>
                        {attendant.priority_high > 0 && (
                          <Badge variant="destructive" className="mt-1 text-xs">
                            {attendant.priority_high} alta/crítica
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm sm:text-base">
                  Nenhum atendente ativo no momento
                </p>
              )}
            </CardContent>
          </Card>

          
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                Distribuição por Prioridade
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-2 sm:space-y-3">
                {Object.entries(priorityStats).map(([priority, count]) => (
                  <div
                    key={priority}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <Badge
                        className={cn(
                          "w-16 sm:w-20 justify-center text-xs",
                          getPriorityColor(priority)
                        )}
                      >
                        {getPriorityLabel(priority)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-0">
                        <div
                          className={cn(
                            "h-2 rounded-full",
                            getPriorityColor(priority)
                          )}
                          style={{
                            width: `${
                              stats.total > 0 ? (count / stats.total) * 100 : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-base sm:text-lg font-bold w-8 sm:w-12 text-right flex-shrink-0">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              Chamados Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {recentTickets.length > 0 ? (
              <div className="space-y-2">
                {recentTickets.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-medium text-sm sm:text-base truncate flex-1 min-w-0">{ticket.title}</p>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <Badge className={cn("text-xs", getStatusColor(ticket.status))}>
                            {ticket.status}
                          </Badge>
                          <Badge
                            className={cn("text-xs", getPriorityColor(ticket.priority))}
                          >
                            {getPriorityLabel(ticket.priority)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-xs sm:text-sm text-muted-foreground gap-1">
                        <span className="truncate">
                          Por: {ticket.created_by_user?.name || "Desconhecido"}
                        </span>
                        {ticket.assigned_to_user && (
                          <span className="truncate">
                            Atendido: {ticket.assigned_to_user.name}
                          </span>
                        )}
                        {ticket.sector && (
                          <span className="truncate">Setor: {ticket.sector.name}</span>
                        )}
                        <span className="truncate">
                          {format(
                            new Date(ticket.created_at),
                            "dd/MM/yyyy HH:mm",
                            {
                              locale: ptBR,
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm sm:text-base">
                Nenhum chamado recente
              </p>
            )}
          </CardContent>
        </Card>

        
        <TicketDetailModal
          ticketId={selectedTicketId}
          open={!!selectedTicketId}
          onOpenChange={(open) => {
            if (!open) setSelectedTicketId(null);
          }}
        />
      </div>
    </div>
  );
}
