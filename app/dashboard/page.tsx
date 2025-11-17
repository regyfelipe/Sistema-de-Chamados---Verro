import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { DashboardStats } from "@/components/dashboard/stats"
import { RecentTickets } from "@/components/dashboard/recent-tickets"
import { SLAAlerts } from "@/components/dashboard/sla-alerts"
import {
  TicketsBySectorChart,
  TicketsByPriorityChart,
  TicketsOverTimeChart,
  SLAMetricsCard,
  SatisfactionStats,
  PerformanceMetricsCard,
} from "@/components/dashboard/lazy-charts"
import { TopAttendants } from "@/components/dashboard/top-attendants"
import { supabase } from "@/lib/supabase"
import {
  getTicketsBySector,
  getTicketsByPriority,
  getTicketsOverTime,
  getSLAMetrics,
  getTopAttendants,
} from "@/lib/dashboard-stats"
import { getRatingStats } from "@/lib/ratings"
import { getPerformanceMetrics } from "@/lib/performance-metrics"
import { getTicketsWithAccess } from "@/lib/ticket-access"
import { BasicDashboard } from "@/components/dashboard/basic-dashboard"

async function getDashboardData(
  userId: string,
  userRole: string,
  userSectorId?: string
) {
  // Buscar tickets com filtro de acesso (todos os tickets, não apenas os recentes)
  const allTickets = await getTicketsWithAccess(userId, userRole, userSectorId)

  // Contar tickets por status (apenas os que o usuário tem acesso)
  const stats = {
    aberto: allTickets.filter(t => t.status === "aberto").length || 0,
    em_atendimento: allTickets.filter(t => t.status === "em_atendimento").length || 0,
    aguardando: allTickets.filter(t => t.status === "aguardando").length || 0,
    fechado: allTickets.filter(t => t.status === "fechado").length || 0,
  }

  // Limitar a 10 tickets mais recentes para o componente RecentTickets (apenas para admin)
  const recentTickets = allTickets.slice(0, 10)

  // Se for Solicitante ou Atendente, não buscar métricas avançadas
  const isAdmin = userRole === "admin" || userRole === "super_admin"

  // Buscar dados para gráficos (apenas para admin)
  const [
    ticketsBySector,
    ticketsByPriority,
    ticketsOverTime,
    slaMetrics,
    topAttendants,
    ratingStats,
    performanceMetrics,
  ] = await Promise.all([
    isAdmin ? getTicketsBySector() : getTicketsBySector(userId, userRole, userSectorId),
    isAdmin ? getTicketsByPriority() : getTicketsByPriority(userId, userRole, userSectorId),
    isAdmin ? getTicketsOverTime(30) : getTicketsOverTime(30, userId, userRole, userSectorId),
    isAdmin ? getSLAMetrics() : getSLAMetrics(userId, userRole, userSectorId),
    isAdmin ? getTopAttendants(5) : getTopAttendants(5, userId, userRole, userSectorId),
    getRatingStats(),
    isAdmin ? getPerformanceMetrics() : null,
  ])

  return {
    tickets: recentTickets || [],
    allTickets: allTickets || [], // Todos os tickets para BasicDashboard
    stats,
    ticketsBySector,
    ticketsByPriority,
    ticketsOverTime,
    slaMetrics,
    topAttendants,
    ratingStats,
    performanceMetrics,
    isAdmin,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  // Buscar dados completos do usuário para obter sector_id
  const { data: userData } = await supabase
    .from("users")
    .select("sector_id")
    .eq("id", session.user.id)
    .single()

  const {
    tickets,
    allTickets,
    stats,
    ticketsBySector,
    ticketsByPriority,
    ticketsOverTime,
    slaMetrics,
    topAttendants,
    ratingStats,
    performanceMetrics,
    isAdmin,
  } = await getDashboardData(
    session.user.id,
    session.user.role || "solicitante",
    userData?.sector_id
  )

  // Dashboard simplificado para Solicitante/Atendente
  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meu Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Visão geral dos seus chamados
            </p>
          </div>

          <BasicDashboard
            tickets={allTickets}
            userRole={session.user.role || "solicitante"}
          />
        </div>
      </MainLayout>
    )
  }

  // Dashboard completo para Admin
  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Visão geral do sistema de chamados
          </p>
        </div>

        <DashboardStats stats={stats} />
        <SLAAlerts />

        {/* Métricas de Performance */}
        {performanceMetrics && (
          <PerformanceMetricsCard metrics={performanceMetrics} />
        )}

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-2">
          <TicketsBySectorChart data={ticketsBySector} />
          <TicketsByPriorityChart data={ticketsByPriority} />
        </div>

        <TicketsOverTimeChart data={ticketsOverTime} />

        <div className="grid gap-6 md:grid-cols-2">
          <SLAMetricsCard metrics={slaMetrics} />
          <TopAttendants attendants={topAttendants} />
        </div>

        {/* Dashboard de Satisfação */}
        {ratingStats.total > 0 && (
          <SatisfactionStats stats={ratingStats} />
        )}

        <RecentTickets tickets={tickets} />
      </div>
    </MainLayout>
  )
}

