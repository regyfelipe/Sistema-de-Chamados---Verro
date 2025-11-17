import { supabase } from "./supabase"
import { getTicketsWithAccess } from "./ticket-access"

export interface TicketsBySector {
  sector_name: string
  count: number
}

export interface TicketsByPriority {
  priority: string
  count: number
}

export interface TicketsOverTime {
  date: string
  count: number
}

export interface SLAMetrics {
  total: number
  on_time: number
  late: number
  compliance_rate: number
}

export interface TopAttendant {
  user_id: string
  user_name: string
  tickets_closed: number
  avg_resolution_time: number
}

/**
 * Busca chamados agrupados por setor (com filtro de acesso)
 */
export async function getTicketsBySector(
  userId?: string,
  userRole?: string,
  userSectorId?: string
): Promise<TicketsBySector[]> {
  try {
    let tickets: any[] = []

    if (userId && userRole) {
      // Usar filtro de acesso
      tickets = await getTicketsWithAccess(userId, userRole, userSectorId)
    } else {
      // Sem filtro (admin)
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          sector_id,
          sector:sectors(name)
        `)

      if (error) {
        console.error("Erro ao buscar chamados por setor:", error)
        return []
      }

      tickets = data || []
    }

    const grouped = tickets.reduce((acc: Record<string, number>, ticket: any) => {
      const sectorName = ticket.sector?.name || "Sem setor"
      acc[sectorName] = (acc[sectorName] || 0) + 1
      return acc
    }, {})

    return Object.entries(grouped).map(([sector_name, count]) => ({
      sector_name,
      count: count as number,
    }))
  } catch (error) {
    console.error("Erro ao buscar chamados por setor:", error)
    return []
  }
}

/**
 * Busca chamados agrupados por prioridade (com filtro de acesso)
 */
export async function getTicketsByPriority(
  userId?: string,
  userRole?: string,
  userSectorId?: string
): Promise<TicketsByPriority[]> {
  try {
    let tickets: any[] = []

    if (userId && userRole) {
      // Usar filtro de acesso
      tickets = await getTicketsWithAccess(userId, userRole, userSectorId)
    } else {
      // Sem filtro (admin)
      const { data, error } = await supabase
        .from("tickets")
        .select("priority")

      if (error) {
        console.error("Erro ao buscar chamados por prioridade:", error)
        return []
      }

      tickets = data || []
    }

    const grouped = tickets.reduce((acc: Record<string, number>, ticket: any) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1
      return acc
    }, {})

    const priorityLabels: Record<string, string> = {
      baixa: "Baixa",
      media: "Média",
      alta: "Alta",
      critica: "Crítica",
    }

    return Object.entries(grouped).map(([priority, count]) => ({
      priority: priorityLabels[priority] || priority,
      count: count as number,
    }))
  } catch (error) {
    console.error("Erro ao buscar chamados por prioridade:", error)
    return []
  }
}

/**
 * Busca chamados ao longo do tempo (últimos 30 dias) (com filtro de acesso)
 */
export async function getTicketsOverTime(
  days: number = 30,
  userId?: string,
  userRole?: string,
  userSectorId?: string
): Promise<TicketsOverTime[]> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let tickets: any[] = []

    if (userId && userRole) {
      // Usar filtro de acesso e depois filtrar por data
      const allTickets = await getTicketsWithAccess(userId, userRole, userSectorId)
      tickets = allTickets.filter(t => new Date(t.created_at) >= startDate)
    } else {
      // Sem filtro (admin)
      const { data, error } = await supabase
        .from("tickets")
        .select("created_at")
        .gte("created_at", startDate.toISOString())

      if (error) {
        console.error("Erro ao buscar chamados ao longo do tempo:", error)
        return []
      }

      tickets = data || []
    }

    const grouped = tickets.reduce((acc: Record<string, number>, ticket: any) => {
      const date = new Date(ticket.created_at).toISOString().split("T")[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    // Preencher dias sem chamados com 0
    const result: TicketsOverTime[] = []
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (days - i - 1))
      const dateStr = date.toISOString().split("T")[0]
      result.push({
        date: dateStr,
        count: grouped[dateStr] || 0,
      })
    }

    return result
  } catch (error) {
    console.error("Erro ao buscar chamados ao longo do tempo:", error)
    return []
  }
}

/**
 * Calcula métricas de SLA (com filtro de acesso)
 */
export async function getSLAMetrics(
  userId?: string,
  userRole?: string,
  userSectorId?: string
): Promise<SLAMetrics> {
  try {
    let tickets: any[] = []

    if (userId && userRole) {
      // Usar filtro de acesso e depois filtrar por SLA
      const allTickets = await getTicketsWithAccess(userId, userRole, userSectorId)
      tickets = allTickets.filter(t => t.sla_due_date)
    } else {
      // Sem filtro (admin)
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id,
          status,
          sla_due_date,
          created_at,
          updated_at
        `)
        .not("sla_due_date", "is", null)

      if (error) {
        console.error("Erro ao buscar métricas de SLA:", error)
        return { total: 0, on_time: 0, late: 0, compliance_rate: 0 }
      }

      tickets = data || []
    }

    const now = new Date()
    let onTime = 0
    let late = 0

    tickets?.forEach((ticket) => {
      if (ticket.status === "fechado") {
        const closedAt = new Date(ticket.updated_at)
        const dueDate = new Date(ticket.sla_due_date)
        if (closedAt <= dueDate) {
          onTime++
        } else {
          late++
        }
      } else {
        // Chamados ainda abertos
        const dueDate = new Date(ticket.sla_due_date)
        if (now > dueDate) {
          late++
        } else {
          onTime++
        }
      }
    })

    const total = tickets?.length || 0
    const complianceRate = total > 0 ? (onTime / total) * 100 : 0

    return {
      total,
      on_time: onTime,
      late,
      compliance_rate: Math.round(complianceRate * 100) / 100,
    }
  } catch (error) {
    console.error("Erro ao calcular métricas de SLA:", error)
    return { total: 0, on_time: 0, late: 0, compliance_rate: 0 }
  }
}

/**
 * Busca top 5 atendentes mais produtivos (com filtro de acesso)
 */
export async function getTopAttendants(
  limit: number = 5,
  userId?: string,
  userRole?: string,
  userSectorId?: string
): Promise<TopAttendant[]> {
  try {
    let tickets: any[] = []

    if (userId && userRole) {
      // Usar filtro de acesso e depois filtrar por fechados
      const allTickets = await getTicketsWithAccess(userId, userRole, userSectorId)
      tickets = allTickets.filter(t => t.status === "fechado" && t.assigned_to)
    } else {
      // Sem filtro (admin)
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id,
          assigned_to,
          status,
          created_at,
          updated_at,
          assigned_to_user:users!tickets_assigned_to_fkey(id, name)
        `)
        .eq("status", "fechado")
        .not("assigned_to", "is", null)

      if (error) {
        console.error("Erro ao buscar top atendentes:", error)
        return []
      }

      tickets = data || []
    }

    const grouped = tickets.reduce((acc: Record<string, any>, ticket: any) => {
      const userId = ticket.assigned_to
      if (!userId) return acc

      if (!acc[userId]) {
        acc[userId] = {
          user_id: userId,
          user_name: ticket.assigned_to_user?.name || "Desconhecido",
          tickets_closed: 0,
          total_time: 0,
        }
      }

      acc[userId].tickets_closed++
      const created = new Date(ticket.created_at)
      const closed = new Date(ticket.updated_at)
      const timeDiff = closed.getTime() - created.getTime()
      acc[userId].total_time += timeDiff

      return acc
    }, {})

    const result: TopAttendant[] = Object.values(grouped)
      .map((item: any) => ({
        user_id: item.user_id,
        user_name: item.user_name,
        tickets_closed: item.tickets_closed,
        avg_resolution_time: item.tickets_closed > 0
          ? Math.round(item.total_time / item.tickets_closed / (1000 * 60 * 60)) // em horas
          : 0,
      }))
      .sort((a, b) => b.tickets_closed - a.tickets_closed)
      .slice(0, limit)

    return result
  } catch (error) {
    console.error("Erro ao buscar top atendentes:", error)
    return []
  }
}

