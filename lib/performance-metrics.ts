import { supabase } from "./supabase"

export interface PerformanceMetrics {
  avgFirstResponseTime: number // em horas
  avgResolutionTime: number // em horas
  firstContactResolutionRate: number // porcentagem
  satisfactionRate: number // porcentagem
  ticketVolume: {
    today: number
    thisWeek: number
    thisMonth: number
    lastMonth: number
  }
  trends: {
    firstResponseTime: {
      current: number
      previous: number
      change: number // porcentagem
    }
    resolutionTime: {
      current: number
      previous: number
      change: number
    }
    fcrRate: {
      current: number
      previous: number
      change: number
    }
  }
}

/**
 * Calcula o tempo médio de primeira resposta para um período específico
 */
async function getAvgFirstResponseTimeForPeriod(startDays: number, endDays: number): Promise<number> {
  try {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - startDays)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - endDays)

    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select("id, created_at")
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString())
      .eq("status", "fechado")

    if (ticketsError || !tickets || tickets.length === 0) {
      return 0
    }

    let totalResponseTime = 0
    let ticketsWithResponse = 0

    for (const ticket of tickets) {
      const { data: comments, error: commentsError } = await supabase
        .from("comments")
        .select("*, user:users(*)")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true })
        .limit(1)

      if (commentsError || !comments || comments.length === 0) continue

      const firstComment = comments[0]
      if (firstComment.user?.role === "atendente" || 
          firstComment.user?.role === "admin" || 
          firstComment.user?.role === "super_admin") {
        const ticketCreated = new Date(ticket.created_at)
        const firstResponse = new Date(firstComment.created_at)
        const diffMs = firstResponse.getTime() - ticketCreated.getTime()
        const diffHours = diffMs / (1000 * 60 * 60)

        totalResponseTime += diffHours
        ticketsWithResponse++
      }
    }

    return ticketsWithResponse > 0 
      ? Math.round((totalResponseTime / ticketsWithResponse) * 100) / 100
      : 0
  } catch (error) {
    console.error("Erro ao calcular tempo médio de primeira resposta:", error)
    return 0
  }
}

/**
 * Calcula o tempo médio de primeira resposta
 * Tempo entre criação do ticket e primeiro comentário de um atendente
 */
export async function getAvgFirstResponseTime(days: number = 30): Promise<number> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Buscar tickets criados no período
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select("id, created_at")
      .gte("created_at", startDate.toISOString())
      .eq("status", "fechado") // Apenas tickets fechados para métrica precisa

    if (ticketsError || !tickets) {
      console.error("Erro ao buscar tickets:", ticketsError)
      return 0
    }

    if (tickets.length === 0) return 0

    let totalResponseTime = 0
    let ticketsWithResponse = 0

    // Para cada ticket, buscar o primeiro comentário de um atendente
    for (const ticket of tickets) {
      // Buscar primeiro comentário não-interno (ou primeiro comentário de atendente)
      const { data: comments, error: commentsError } = await supabase
        .from("comments")
        .select("*, user:users(*)")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true })
        .limit(1)

      if (commentsError || !comments || comments.length === 0) continue

      const firstComment = comments[0]
      // Verificar se é de um atendente (não do criador)
      if (firstComment.user?.role === "atendente" || 
          firstComment.user?.role === "admin" || 
          firstComment.user?.role === "super_admin") {
        const ticketCreated = new Date(ticket.created_at)
        const firstResponse = new Date(firstComment.created_at)
        const diffMs = firstResponse.getTime() - ticketCreated.getTime()
        const diffHours = diffMs / (1000 * 60 * 60)

        totalResponseTime += diffHours
        ticketsWithResponse++
      }
    }

    return ticketsWithResponse > 0 
      ? Math.round((totalResponseTime / ticketsWithResponse) * 100) / 100
      : 0
  } catch (error) {
    console.error("Erro ao calcular tempo médio de primeira resposta:", error)
    return 0
  }
}

/**
 * Calcula o tempo médio de resolução para um período específico
 */
async function getAvgResolutionTimeForPeriod(startDays: number, endDays: number): Promise<number> {
  try {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - startDays)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - endDays)

    const { data: tickets, error } = await supabase
      .from("tickets")
      .select("created_at, updated_at")
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString())
      .eq("status", "fechado")

    if (error || !tickets || tickets.length === 0) {
      return 0
    }

    let totalTime = 0
    for (const ticket of tickets) {
      const created = new Date(ticket.created_at)
      const closed = new Date(ticket.updated_at)
      const diffMs = closed.getTime() - created.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      totalTime += diffHours
    }

    return Math.round((totalTime / tickets.length) * 100) / 100
  } catch (error) {
    console.error("Erro ao calcular tempo médio de resolução:", error)
    return 0
  }
}

/**
 * Calcula o tempo médio de resolução
 * Tempo entre criação e fechamento do ticket
 */
export async function getAvgResolutionTime(days: number = 30): Promise<number> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: tickets, error } = await supabase
      .from("tickets")
      .select("created_at, updated_at")
      .gte("created_at", startDate.toISOString())
      .eq("status", "fechado")

    if (error || !tickets || tickets.length === 0) {
      return 0
    }

    let totalTime = 0
    for (const ticket of tickets) {
      const created = new Date(ticket.created_at)
      const closed = new Date(ticket.updated_at)
      const diffMs = closed.getTime() - created.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      totalTime += diffHours
    }

    return Math.round((totalTime / tickets.length) * 100) / 100
  } catch (error) {
    console.error("Erro ao calcular tempo médio de resolução:", error)
    return 0
  }
}

/**
 * Calcula a taxa de resolução na primeira interação para um período específico
 */
async function getFirstContactResolutionRateForPeriod(startDays: number, endDays: number): Promise<number> {
  try {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - startDays)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - endDays)

    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select("id")
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString())
      .eq("status", "fechado")

    if (ticketsError || !tickets || tickets.length === 0) {
      return 0
    }

    let ticketsWithFCR = 0

    for (const ticket of tickets) {
      const { data: comments, error: commentsError } = await supabase
        .from("comments")
        .select("id")
        .eq("ticket_id", ticket.id)

      if (commentsError) continue

      const commentCount = comments?.length || 0
      
      const { data: history } = await supabase
        .from("ticket_history")
        .select("created_at, action")
        .eq("ticket_id", ticket.id)
        .eq("action", "Status alterado")
        .eq("new_value", "fechado")
        .order("created_at", { ascending: false })
        .limit(1)

      if (commentCount <= 2) {
        ticketsWithFCR++
      } else if (history && history.length > 0) {
        const ticketData = await supabase
          .from("tickets")
          .select("created_at, updated_at")
          .eq("id", ticket.id)
          .single()

        if (ticketData.data) {
          const created = new Date(ticketData.data.created_at)
          const closed = new Date(ticketData.data.updated_at)
          const diffHours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60)
          
          if (diffHours < 4) {
            ticketsWithFCR++
          }
        }
      }
    }

    return tickets.length > 0
      ? Math.round((ticketsWithFCR / tickets.length) * 100 * 100) / 100
      : 0
  } catch (error) {
    console.error("Erro ao calcular taxa de FCR:", error)
    return 0
  }
}

/**
 * Calcula a taxa de resolução na primeira interação (FCR - First Contact Resolution)
 * Tickets fechados sem necessidade de múltiplas interações
 */
export async function getFirstContactResolutionRate(days: number = 30): Promise<number> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Buscar tickets fechados no período
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select("id")
      .gte("created_at", startDate.toISOString())
      .eq("status", "fechado")

    if (ticketsError || !tickets || tickets.length === 0) {
      return 0
    }

    let ticketsWithFCR = 0

    // Para cada ticket, verificar se foi resolvido na primeira interação
    // Consideramos FCR se o ticket foi fechado com 1 ou 2 comentários (primeira interação)
    for (const ticket of tickets) {
      const { data: comments, error: commentsError } = await supabase
        .from("comments")
        .select("id")
        .eq("ticket_id", ticket.id)

      if (commentsError) continue

      // Considerar FCR se tiver 2 ou menos comentários (criação + primeira resposta)
      // Ou se foi fechado rapidamente (menos de 4 horas) com poucos comentários
      const commentCount = comments?.length || 0
      
      // Buscar histórico para ver tempo de resolução
      const { data: history } = await supabase
        .from("ticket_history")
        .select("created_at, action")
        .eq("ticket_id", ticket.id)
        .eq("action", "Status alterado")
        .eq("new_value", "fechado")
        .order("created_at", { ascending: false })
        .limit(1)

      if (commentCount <= 2) {
        ticketsWithFCR++
      } else if (history && history.length > 0) {
        // Verificar se foi fechado rapidamente
        const ticketData = await supabase
          .from("tickets")
          .select("created_at, updated_at")
          .eq("id", ticket.id)
          .single()

        if (ticketData.data) {
          const created = new Date(ticketData.data.created_at)
          const closed = new Date(ticketData.data.updated_at)
          const diffHours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60)
          
          // Se fechado em menos de 4 horas, considerar FCR
          if (diffHours < 4) {
            ticketsWithFCR++
          }
        }
      }
    }

    return tickets.length > 0
      ? Math.round((ticketsWithFCR / tickets.length) * 100 * 100) / 100
      : 0
  } catch (error) {
    console.error("Erro ao calcular taxa de FCR:", error)
    return 0
  }
}

/**
 * Calcula a taxa de satisfação
 * Baseado nas avaliações dos tickets
 */
export async function getSatisfactionRate(days: number = 30): Promise<number> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Buscar avaliações no período
    const { data: ratings, error } = await supabase
      .from("ticket_ratings")
      .select("rating")
      .gte("created_at", startDate.toISOString())

    if (error || !ratings || ratings.length === 0) {
      return 0
    }

    // Considerar satisfeito: rating >= 4
    const satisfied = ratings.filter((r) => r.rating >= 4).length
    return Math.round((satisfied / ratings.length) * 100 * 100) / 100
  } catch (error) {
    console.error("Erro ao calcular taxa de satisfação:", error)
    return 0
  }
}

/**
 * Calcula o volume de chamados por período
 */
export async function getTicketVolume() {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay()) // Início da semana
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const [today, thisWeek, thisMonth, lastMonth] = await Promise.all([
      supabase
        .from("tickets")
        .select("id", { count: "exact" })
        .gte("created_at", todayStart.toISOString()),
      supabase
        .from("tickets")
        .select("id", { count: "exact" })
        .gte("created_at", weekStart.toISOString()),
      supabase
        .from("tickets")
        .select("id", { count: "exact" })
        .gte("created_at", monthStart.toISOString()),
      supabase
        .from("tickets")
        .select("id", { count: "exact" })
        .gte("created_at", lastMonthStart.toISOString())
        .lte("created_at", lastMonthEnd.toISOString()),
    ])

    return {
      today: today.count || 0,
      thisWeek: thisWeek.count || 0,
      thisMonth: thisMonth.count || 0,
      lastMonth: lastMonth.count || 0,
    }
  } catch (error) {
    console.error("Erro ao calcular volume de chamados:", error)
    return {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      lastMonth: 0,
    }
  }
}

/**
 * Calcula todas as métricas de performance
 */
export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  try {
    const [avgFirstResponse, avgResolution, fcrRate, satisfactionRate, volume] = await Promise.all([
      getAvgFirstResponseTime(30),
      getAvgResolutionTime(30),
      getFirstContactResolutionRate(30),
      getSatisfactionRate(30),
      getTicketVolume(),
    ])

    // Calcular tendências (comparar últimos 30 dias com 30 dias anteriores)
    // Período anterior: dias 31-60
    const [prevAvgFirstResponse, prevAvgResolution, prevFcrRate] = await Promise.all([
      getAvgFirstResponseTimeForPeriod(31, 60),
      getAvgResolutionTimeForPeriod(31, 60),
      getFirstContactResolutionRateForPeriod(31, 60),
    ])

    // Calcular mudança percentual
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0
      const change = ((current - previous) / previous) * 100
      return Math.round(change * 100) / 100
    }

    return {
      avgFirstResponseTime: avgFirstResponse,
      avgResolutionTime: avgResolution,
      firstContactResolutionRate: fcrRate,
      satisfactionRate: satisfactionRate,
      ticketVolume: volume,
      trends: {
        firstResponseTime: {
          current: avgFirstResponse,
          previous: prevAvgFirstResponse,
          change: calculateChange(avgFirstResponse, prevAvgFirstResponse),
        },
        resolutionTime: {
          current: avgResolution,
          previous: prevAvgResolution,
          change: calculateChange(avgResolution, prevAvgResolution),
        },
        fcrRate: {
          current: fcrRate,
          previous: prevFcrRate,
          change: calculateChange(fcrRate, prevFcrRate),
        },
      },
    }
  } catch (error) {
    console.error("Erro ao calcular métricas de performance:", error)
    return {
      avgFirstResponseTime: 0,
      avgResolutionTime: 0,
      firstContactResolutionRate: 0,
      satisfactionRate: 0,
      ticketVolume: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        lastMonth: 0,
      },
      trends: {
        firstResponseTime: { current: 0, previous: 0, change: 0 },
        resolutionTime: { current: 0, previous: 0, change: 0 },
        fcrRate: { current: 0, previous: 0, change: 0 },
      },
    }
  }
}

