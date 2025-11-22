import { supabase } from "@/lib/supabase"
import { ChatMessage, ChatReadStatus } from "@/types"

/**
 * Busca mensagens de chat
 */
export async function getChatMessages(
  ticketId?: string | null,
  limit: number = 100
): Promise<ChatMessage[]> {
  try {
    let query = supabase
      .from("chat_messages")
      .select(
        `
        *,
        user:users(id, name, email, role),
        ticket:tickets(id, title)
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit)

    if (ticketId) {
      query = query.eq("ticket_id", ticketId)
    } else {
      query = query.is("ticket_id", null)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).reverse() as ChatMessage[]
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error)
    return []
  }
}

/**
 * Envia uma mensagem de chat
 */
export async function sendChatMessage(
  userId: string,
  message: string,
  ticketId?: string | null
): Promise<ChatMessage | null> {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        user_id: userId,
        message: message.trim(),
        ticket_id: ticketId || null,
      })
      .select(
        `
        *,
        user:users(id, name, email, role),
        ticket:tickets(id, title)
      `
      )
      .single()

    if (error) throw error

    return data as ChatMessage
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error)
    throw error
  }
}

/**
 * Edita uma mensagem de chat
 */
export async function editChatMessage(
  messageId: string,
  userId: string,
  newMessage: string
): Promise<ChatMessage | null> {
  try {
   
    const { data: existingMessage, error: fetchError } = await supabase
      .from("chat_messages")
      .select("user_id")
      .eq("id", messageId)
      .single()

    if (fetchError) throw fetchError

    if (existingMessage.user_id !== userId) {
      throw new Error("Você não tem permissão para editar esta mensagem")
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .update({
        message: newMessage.trim(),
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq("id", messageId)
      .select(
        `
        *,
        user:users(id, name, email, role),
        ticket:tickets(id, title)
      `
      )
      .single()

    if (error) throw error

    return data as ChatMessage
  } catch (error) {
    console.error("Erro ao editar mensagem:", error)
    throw error
  }
}

/**
 * Deleta uma mensagem de chat
 */
export async function deleteChatMessage(
  messageId: string,
  userId: string
): Promise<boolean> {
  try {
   
    const { data: existingMessage, error: fetchError } = await supabase
      .from("chat_messages")
      .select("user_id, user:users(role)")
      .eq("id", messageId)
      .single()

    if (fetchError) throw fetchError

    const userRole = (existingMessage as any).user?.role
    const canDelete =
      existingMessage.user_id === userId ||
      userRole === "admin" ||
      userRole === "super_admin"

    if (!canDelete) {
      throw new Error("Você não tem permissão para deletar esta mensagem")
    }

    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", messageId)

    if (error) throw error

    return true
  } catch (error) {
    console.error("Erro ao deletar mensagem:", error)
    throw error
  }
}

/**
 * Marca mensagens como lidas
 */
export async function markChatAsRead(
  userId: string,
  ticketId?: string | null
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("chat_read_status")
      .upsert(
        {
          user_id: userId,
          ticket_id: ticketId || null,
          last_read_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,ticket_id",
        }
      )

    if (error) throw error

    return true
  } catch (error) {
    console.error("Erro ao marcar como lida:", error)
    return false
  }
}

/**
 * Busca status de leitura
 */
export async function getChatReadStatus(
  userId: string,
  ticketId?: string | null
): Promise<ChatReadStatus | null> {
  try {
    const { data, error } = await supabase
      .from("chat_read_status")
      .select("*")
      .eq("user_id", userId)
      .is("ticket_id", ticketId ? ticketId : null)
      .single()

    if (error && error.code !== "PGRST116") throw error

    return data as ChatReadStatus | null
  } catch (error) {
    console.error("Erro ao buscar status de leitura:", error)
    return null
  }
}

/**
 * Conta mensagens não lidas
 */
export async function getUnreadChatCount(
  userId: string,
  ticketId?: string | null
): Promise<number> {
  try {
    const readStatus = await getChatReadStatus(userId, ticketId)
    const lastReadAt = readStatus?.last_read_at

    let query = supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .neq("user_id", userId)

    if (ticketId) {
      query = query.eq("ticket_id", ticketId)
    } else {
      query = query.is("ticket_id", null)
    }

    if (lastReadAt) {
      query = query.gt("created_at", lastReadAt)
    }

    const { count, error } = await query

    if (error) throw error

    return count || 0
  } catch (error) {
    console.error("Erro ao contar mensagens não lidas:", error)
    return 0
  }
}

