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
 
  if (userRole === "admin" || userRole === "super_admin") {
   
    const canViewAll = await hasPermission(userId, "ticket.view_all")
    if (canViewAll) {
      return tickets
    }
  }

 
  if (userRole === "atendente") {
    return tickets.filter((ticket) => {
     
      if (ticket.created_by === userId) {
        return true
      }

     
      if (ticket.assigned_to === userId) {
        return true
      }

     
      if (userSectorId && ticket.sector_id === userSectorId) {
        return true
      }

      return false
    })
  }

 
  if (userRole === "solicitante") {
    return tickets.filter((ticket) => ticket.created_by === userId)
  }

 
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
 
  let query = supabase
    .from("tickets")
    .select(`
      *,
      sector:sectors(*),
      created_by_user:users!tickets_created_by_fkey(*),
      assigned_to_user:users!tickets_assigned_to_fkey(*)
    `)

 
  if (userRole === "solicitante") {
   
    query = query.eq("created_by", userId)
  } else if (userRole === "atendente") {
   
    if (userSectorId) {
     
     
      query = query.or(`sector_id.eq.${userSectorId},assigned_to.eq.${userId},created_by.eq.${userId}`)
    } else {
     
      query = query.or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
    }
  }
 
 

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
 
  if (userRole === "admin" || userRole === "super_admin") {
    const canViewAll = await hasPermission(userId, "ticket.view_all")
    return canViewAll
  }

 
  if (userRole === "solicitante") {
    return ticket.created_by === userId
  }

 
  if (userRole === "atendente") {
   
    if (ticket.created_by === userId) {
      return true
    }

   
    if (ticket.assigned_to === userId) {
      return true
    }

   
    if (userSectorId && ticket.sector_id === userSectorId) {
      return true
    }

    return false
  }

  return false
}

