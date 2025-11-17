import { hasPermission } from "./permissions"
import { User } from "@/types"

/**
 * Helpers para verificação de permissões comuns
 */

/**
 * Verifica se o usuário pode criar tickets
 */
export async function canCreateTicket(userId: string): Promise<boolean> {
  return hasPermission(userId, "ticket.create")
}

/**
 * Verifica se o usuário pode ver um ticket específico
 */
export async function canViewTicket(
  userId: string,
  ticket: { created_by: string; sector_id: string; assigned_to?: string },
  user?: User
): Promise<boolean> {
  // Se tem permissão para ver todos, pode ver
  if (await hasPermission(userId, "ticket.view_all")) {
    return true
  }

  // Se é o criador, pode ver
  if (ticket.created_by === userId) {
    return true
  }

  // Se está atribuído a ele, pode ver
  if (ticket.assigned_to === userId) {
    return true
  }

  // Se é atendente do setor do ticket
  if (
    user?.sector_id === ticket.sector_id &&
    (await hasPermission(userId, "ticket.read", ticket.sector_id))
  ) {
    return true
  }

  return false
}

/**
 * Verifica se o usuário pode editar um ticket
 */
export async function canEditTicket(
  userId: string,
  ticket: {
    created_by: string
    sector_id: string
    assigned_to?: string
    status: string
  },
  user?: User
): Promise<boolean> {
  // Se tem permissão para editar todos, pode editar
  if (await hasPermission(userId, "ticket.edit_all")) {
    return true
  }

  // Se é o criador e o ticket está aberto
  if (ticket.created_by === userId && ticket.status === "aberto") {
    return hasPermission(userId, "ticket.update")
  }

  // Se está atribuído a ele
  if (ticket.assigned_to === userId) {
    return hasPermission(userId, "ticket.update", ticket.sector_id)
  }

  // Se é atendente do setor
  if (user?.sector_id === ticket.sector_id) {
    return hasPermission(userId, "ticket.update", ticket.sector_id)
  }

  return false
}

/**
 * Verifica se o usuário pode deletar um ticket
 */
export async function canDeleteTicket(
  userId: string,
  ticket: { created_by: string; sector_id: string }
): Promise<boolean> {
  // Se tem permissão para deletar todos
  if (await hasPermission(userId, "ticket.delete")) {
    return true
  }

  // Se é o criador e o ticket está aberto
  return (
    ticket.created_by === userId &&
    (await hasPermission(userId, "ticket.delete"))
  )
}

/**
 * Verifica se o usuário pode atribuir tickets
 */
export async function canAssignTicket(
  userId: string,
  sectorId?: string
): Promise<boolean> {
  return hasPermission(userId, "ticket.assign", sectorId)
}

/**
 * Verifica se o usuário pode mudar o status de um ticket
 */
export async function canChangeTicketStatus(
  userId: string,
  ticket: { sector_id: string; assigned_to?: string },
  user?: User
): Promise<boolean> {
  // Se tem permissão geral
  if (await hasPermission(userId, "ticket.change_status")) {
    return true
  }

  // Se está atribuído a ele
  if (ticket.assigned_to === userId) {
    return hasPermission(userId, "ticket.change_status", ticket.sector_id)
  }

  // Se é atendente do setor
  if (user?.sector_id === ticket.sector_id) {
    return hasPermission(userId, "ticket.change_status", ticket.sector_id)
  }

  return false
}

/**
 * Verifica se o usuário pode mudar a prioridade de um ticket
 */
export async function canChangeTicketPriority(
  userId: string,
  ticket: { sector_id: string; assigned_to?: string },
  user?: User
): Promise<boolean> {
  // Se tem permissão geral
  if (await hasPermission(userId, "ticket.change_priority")) {
    return true
  }

  // Se está atribuído a ele
  if (ticket.assigned_to === userId) {
    return hasPermission(userId, "ticket.change_priority", ticket.sector_id)
  }

  // Se é atendente do setor
  if (user?.sector_id === ticket.sector_id) {
    return hasPermission(userId, "ticket.change_priority", ticket.sector_id)
  }

  return false
}

/**
 * Verifica se o usuário pode criar comentários
 */
export async function canCreateComment(
  userId: string,
  ticketId: string,
  isInternal: boolean = false
): Promise<boolean> {
  if (isInternal) {
    return hasPermission(userId, "comment.internal")
  }
  return hasPermission(userId, "comment.create")
}

/**
 * Verifica se o usuário pode deletar um comentário
 */
export async function canDeleteComment(
  userId: string,
  comment: { user_id: string }
): Promise<boolean> {
  // Se é o autor
  if (comment.user_id === userId) {
    return hasPermission(userId, "comment.delete")
  }

  // Se tem permissão para deletar qualquer comentário
  return hasPermission(userId, "comment.delete")
}

/**
 * Verifica se o usuário pode fazer upload de anexos
 */
export async function canUploadAttachment(
  userId: string,
  ticketId: string
): Promise<boolean> {
  return hasPermission(userId, "attachment.upload")
}

/**
 * Verifica se o usuário pode deletar um anexo
 */
export async function canDeleteAttachment(
  userId: string,
  attachment: { user_id: string }
): Promise<boolean> {
  // Se é o autor
  if (attachment.user_id === userId) {
    return hasPermission(userId, "attachment.delete")
  }

  // Se tem permissão para deletar qualquer anexo
  return hasPermission(userId, "attachment.delete")
}

/**
 * Verifica se o usuário pode gerenciar usuários
 */
export async function canManageUsers(userId: string): Promise<boolean> {
  return hasPermission(userId, "user.manage_permissions")
}

/**
 * Verifica se o usuário pode acessar o dashboard admin
 */
export async function canAccessAdminDashboard(userId: string): Promise<boolean> {
  return hasPermission(userId, "admin.dashboard")
}

