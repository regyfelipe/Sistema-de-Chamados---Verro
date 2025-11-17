import { supabase } from "./supabase"
import { UserNotification, NotificationType } from "@/types"

/**
 * Cria uma nova notificação
 */
export async function createNotification(data: {
  user_id: string
  type: NotificationType
  title: string
  message: string
  ticket_id?: string
  comment_id?: string
}): Promise<UserNotification | null> {
  try {
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert([data])
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar notificação:", error)
      return null
    }

    return notification
  } catch (error) {
    console.error("Erro ao criar notificação:", error)
    return null
  }
}

/**
 * Cria notificações para múltiplos usuários
 */
export async function createNotificationsForUsers(
  user_ids: string[],
  data: {
    type: NotificationType
    title: string
    message: string
    ticket_id?: string
    comment_id?: string
  }
): Promise<void> {
  try {
    const notifications = user_ids.map((user_id) => ({
      ...data,
      user_id,
    }))

    const { error } = await supabase
      .from("notifications")
      .insert(notifications)

    if (error) {
      console.error("Erro ao criar notificações:", error)
    }
  } catch (error) {
    console.error("Erro ao criar notificações:", error)
  }
}

/**
 * Marca notificação como lida
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)

    if (error) {
      console.error("Erro ao marcar notificação como lida:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error)
    return false
  }
}

/**
 * Marca todas as notificações do usuário como lidas
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) {
      console.error("Erro ao marcar todas como lidas:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao marcar todas como lidas:", error)
    return false
  }
}

/**
 * Busca notificações do usuário
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 50
): Promise<UserNotification[]> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select(`
        *,
        ticket:tickets(id, title, status)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Erro ao buscar notificações:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Erro ao buscar notificações:", error)
    return []
  }
}

/**
 * Conta notificações não lidas
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) {
      console.error("Erro ao contar notificações:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Erro ao contar notificações:", error)
    return 0
  }
}

/**
 * Deleta notificação
 */
export async function deleteNotification(
  notificationId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)

    if (error) {
      console.error("Erro ao deletar notificação:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao deletar notificação:", error)
    return false
  }
}

