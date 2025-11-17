import { supabase } from "./supabase"
import { Ticket, User } from "@/types"
import { hasPermission } from "./permissions"

/**
 * Filtra tickets baseado no role e permissões do usuário
 */
export async function filterTicketsByAccess(
  tickets: Ticket[],
  userId: string,
  userRole: string,
  userSectorId?: string
): Promise<Ticket[]> {
  // Admin e Super Admin veem todos os tickets
  if (userRole === "admin" || userRole === "super_admin") {
    // Verificar se tem permissão para ver todos
    const canViewAll = await hasPermission(userId, "ticket.view_all")
    if (canViewAll) {
      return tickets
    }
  }

  // Atendente vê tickets do seu setor + atribuídos a ele + criados por ele
  if (userRole === "atendente") {
    return tickets.filter((ticket) => {
      // Se criou o ticket, pode ver
      if (ticket.created_by === userId) {
        return true
      }

      // Se está atribuído a ele
      if (ticket.assigned_to === userId) {
        return true
      }

      // Se é do mesmo setor
      if (userSectorId && ticket.sector_id === userSectorId) {
        return true
      }

      return false
    })
  }

  // Solicitante vê apenas seus próprios tickets
  if (userRole === "solicitante") {
    return tickets.filter((ticket) => ticket.created_by === userId)
  }

  // Por padrão, não retorna nada (segurança)
  return []
}

/**
 * Busca tickets com filtro de acesso aplicado
 */
export async function getTicketsWithAccess(
  userId: string,
  userRole: string,
  userSectorId?: string
): Promise<Ticket[]> {
  // Construir query baseada no role
  let query = supabase
    .from("tickets")
    .select(`
      *,
      sector:sectors(*),
      created_by_user:users!tickets_created_by_fkey(*),
      assigned_to_user:users!tickets_assigned_to_fkey(*)
    `)

  // Aplicar filtros baseados no role
  if (userRole === "solicitante") {
    // Solicitante: apenas seus próprios tickets
    query = query.eq("created_by", userId)
  } else if (userRole === "atendente") {
    // Atendente: tickets do seu setor OU atribuídos a ele OU criados por ele
    if (userSectorId) {
      // Usar filtro OR do Supabase corretamente
      // Formato: "campo1.eq.valor1,campo2.eq.valor2,campo3.eq.valor3"
      query = query.or(`sector_id.eq.${userSectorId},assigned_to.eq.${userId},created_by.eq.${userId}`)
    } else {
      // Se não tem setor, atribuídos a ele OU criados por ele
      query = query.or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
    }
  }
  // Admin e Super Admin: sem filtro (todos os tickets)
  // Mas verificar permissão ticket.view_all

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching tickets with access:", error)
    return []
  }

  return (data as Ticket[]) || []
}

/**
 * Verifica se o usuário pode acessar um ticket específico
 */
export async function canAccessTicket(
  ticket: Ticket,
  userId: string,
  userRole: string,
  userSectorId?: string
): Promise<boolean> {
  // Admin e Super Admin podem acessar todos
  if (userRole === "admin" || userRole === "super_admin") {
    const canViewAll = await hasPermission(userId, "ticket.view_all")
    return canViewAll
  }

  // Solicitante: apenas seus próprios tickets
  if (userRole === "solicitante") {
    return ticket.created_by === userId
  }

  // Atendente: tickets do seu setor, atribuídos a ele, ou criados por ele
  if (userRole === "atendente") {
    // Se criou o ticket, pode ver
    if (ticket.created_by === userId) {
      return true
    }

    // Se está atribuído a ele
    if (ticket.assigned_to === userId) {
      return true
    }

    // Se é do mesmo setor
    if (userSectorId && ticket.sector_id === userSectorId) {
      return true
    }

    return false
  }

  return false
}

