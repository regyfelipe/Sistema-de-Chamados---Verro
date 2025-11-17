"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { supabase } from "@/lib/supabase"
import { ChatMessage } from "@/types"
import {
  getChatMessages,
  sendChatMessage,
  editChatMessage,
  deleteChatMessage,
  markChatAsRead,
} from "@/lib/chat"

interface UseChatOptions {
  ticketId?: string | null
  autoMarkAsRead?: boolean
}

export function useChat({ ticketId, autoMarkAsRead = true }: UseChatOptions = {}) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  const userId = session?.user?.id

  // Carregar mensagens iniciais
  useEffect(() => {
    if (!userId) return

    loadMessages()

    // Configurar subscription para mensagens em tempo real
    const channelName = ticketId ? `chat-ticket-${ticketId}` : "chat-general"
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: ticketId
            ? `ticket_id=eq.${ticketId}`
            : "ticket_id=is.null",
        },
        (payload) => {
          console.log("💬 [Chat] Mudança detectada:", payload.eventType)

          if (payload.eventType === "INSERT") {
            const newMessage = payload.new as any
            // Buscar dados do usuário e ticket se necessário
            const fetchPromises = [
              supabase
                .from("users")
                .select("id, name, email, role")
                .eq("id", newMessage.user_id)
                .single(),
            ]

            if (newMessage.ticket_id) {
              fetchPromises.push(
                supabase
                  .from("tickets")
                  .select("id, title")
                  .eq("id", newMessage.ticket_id)
                  .single()
              )
            }

            Promise.all(fetchPromises).then((results) => {
              const userResult = results[0]
              const ticketResult = results[1]
              const chatMessage: ChatMessage = {
                ...newMessage,
                user: userResult.data || undefined,
                ticket: ticketResult?.data || undefined,
              }
              setMessages((prev) => [...prev, chatMessage])
              scrollToBottom()
              // Marcar como lida automaticamente se for mensagem de outro usuário
              if (autoMarkAsRead && newMessage.user_id !== userId) {
                markChatAsRead(userId || "", ticketId)
              }
            })
          } else if (payload.eventType === "UPDATE") {
            const updatedMessage = payload.new as ChatMessage
            setMessages((prev) =>
              prev.map((m) =>
                m.id === updatedMessage.id ? updatedMessage : m
              )
            )
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id
            setMessages((prev) => prev.filter((m) => m.id !== deletedId))
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [userId, ticketId, autoMarkAsRead])

  const loadMessages = async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const loadedMessages = await getChatMessages(ticketId)
      setMessages(loadedMessages)
      scrollToBottom()

      // Marcar como lida após carregar
      if (autoMarkAsRead) {
        await markChatAsRead(userId, ticketId)
      }
    } catch (err: any) {
      setError(err.message || "Erro ao carregar mensagens")
      console.error("Erro ao carregar mensagens:", err)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = useCallback(
    async (message: string) => {
      if (!userId || !message.trim() || sending) return

      setSending(true)
      setError(null)

      try {
        await sendChatMessage(userId, message, ticketId)
        // A mensagem será adicionada via Realtime subscription
        scrollToBottom()
      } catch (err: any) {
        setError(err.message || "Erro ao enviar mensagem")
        console.error("Erro ao enviar mensagem:", err)
      } finally {
        setSending(false)
      }
    },
    [userId, ticketId, sending]
  )

  const editMessage = useCallback(
    async (messageId: string, newMessage: string) => {
      if (!userId || !newMessage.trim()) return

      setError(null)

      try {
        await editChatMessage(messageId, userId, newMessage)
        // A mensagem será atualizada via Realtime subscription
      } catch (err: any) {
        setError(err.message || "Erro ao editar mensagem")
        console.error("Erro ao editar mensagem:", err)
        throw err
      }
    },
    [userId]
  )

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!userId) return

      setError(null)

      try {
        await deleteChatMessage(messageId, userId)
        // A mensagem será removida via Realtime subscription
      } catch (err: any) {
        setError(err.message || "Erro ao deletar mensagem")
        console.error("Erro ao deletar mensagem:", err)
        throw err
      }
    },
    [userId]
  )

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    reloadMessages: loadMessages,
    messagesEndRef,
    scrollToBottom,
  }
}

