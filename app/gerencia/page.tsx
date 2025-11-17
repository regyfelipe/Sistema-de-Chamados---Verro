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
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Função para buscar todos os dados
  const fetchDashboardData = async () => {
    try {
      // Buscar todos os tickets
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

      // Buscar setores dos atendentes separadamente
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

      // Calcular estatísticas
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

      // Calcular estatísticas de prioridade
      const newPriorityStats: PriorityStats = {
        baixa: tickets?.filter((t: any) => t.priority === "baixa").length || 0,
        media: tickets?.filter((t: any) => t.priority === "media").length || 0,
        alta: tickets?.filter((t: any) => t.priority === "alta").length || 0,
        critica:
          tickets?.filter((t: any) => t.priority === "critica").length || 0,
      };

      // Buscar atendentes ativos (com tickets em atendimento)
      const activeTickets =
        tickets?.filter(
          (t: any) => t.status === "em_atendimento" && t.assigned_to
        ) || [];

      const attendantsMap = new Map<string, ActiveAttendant>();

      activeTickets.forEach((ticket: any) => {
        const userId = ticket.assigned_to;
        if (!userId) return;

        if (!attendantsMap.has(userId)) {
          // Buscar setor do atendente
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

      // Tickets recentes (últimos 10)
      const newRecentTickets = tickets?.slice(0, 10) || [];

      setStats(newStats);
      setPriorityStats(newPriorityStats);
      setActiveAttendants(newActiveAttendants);
      setRecentTickets(newRecentTickets);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchDashboardData();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, []);

  // Escutar mudanças em tempo real
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
          // Atualizar dados quando houver mudança
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-lg shadow-sm border">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard Gerencial
            </h1>
            <p className="text-muted-foreground mt-1">
              Acompanhamento em tempo real dos chamados
            </p>
          </div>
          <div className="text-left md:text-right">
            <div className="flex items-center gap-2 text-sm">
              <div className="relative">
                <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-green-500 rounded-full animate-ping" />
              </div>
              <span className="font-medium">
                Atualizado: {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Atualização automática a cada 30s • Tempo real ativo
            </p>
          </div>
        </div>

        {/* Estatísticas Principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <TicketIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                chamados no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abertos</CardTitle>
              <div className="rounded-full p-2 bg-blue-50">
                <TicketIcon className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.aberto}
              </div>
              <p className="text-xs text-muted-foreground">
                aguardando atendimento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Em Atendimento
              </CardTitle>
              <div className="rounded-full p-2 bg-yellow-50">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.em_atendimento}
              </div>
              <p className="text-xs text-muted-foreground">sendo trabalhados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
              <div className="rounded-full p-2 bg-orange-50">
                <UserCheck className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.aguardando}
              </div>
              <p className="text-xs text-muted-foreground">
                aguardando resposta
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fechados</CardTitle>
              <div className="rounded-full p-2 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.fechado}
              </div>
              <p className="text-xs text-muted-foreground">resolvidos</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Atendentes Ativos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Atendentes Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeAttendants.length > 0 ? (
                <div className="space-y-3">
                  {activeAttendants.map((attendant) => (
                    <div
                      key={attendant.user_id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{attendant.user_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {attendant.sector_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">
                            {attendant.tickets_count}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            chamados
                          </span>
                        </div>
                        {attendant.priority_high > 0 && (
                          <Badge variant="destructive" className="mt-1">
                            {attendant.priority_high} alta/crítica
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum atendente ativo no momento
                </p>
              )}
            </CardContent>
          </Card>

          {/* Distribuição por Prioridade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Distribuição por Prioridade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(priorityStats).map(([priority, count]) => (
                  <div
                    key={priority}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        className={cn(
                          "w-20 justify-center",
                          getPriorityColor(priority)
                        )}
                      >
                        {getPriorityLabel(priority)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
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
                      <span className="text-lg font-bold w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chamados Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Chamados Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTickets.length > 0 ? (
              <div className="space-y-2">
                {recentTickets.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{ticket.title}</p>
                        <Badge className={cn(getStatusColor(ticket.status))}>
                          {ticket.status}
                        </Badge>
                        <Badge
                          className={cn(getPriorityColor(ticket.priority))}
                        >
                          {getPriorityLabel(ticket.priority)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Criado por:{" "}
                          {ticket.created_by_user?.name || "Desconhecido"}
                        </span>
                        {ticket.assigned_to_user && (
                          <span>
                            Atendido por: {ticket.assigned_to_user.name}
                          </span>
                        )}
                        {ticket.sector && (
                          <span>Setor: {ticket.sector.name}</span>
                        )}
                        <span>
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
              <p className="text-center text-muted-foreground py-8">
                Nenhum chamado recente
              </p>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes do Chamado */}
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
