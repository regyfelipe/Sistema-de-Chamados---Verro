"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { getTicketsWithAccess } from "@/lib/ticket-access"
import { Ticket } from "@/types"
import { supabase } from "@/lib/supabase"

/**
 * Hook otimizado para buscar tickets com cache
 */
export function useTickets() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const userRole = session?.user?.role || "solicitante"

  return useQuery({
    queryKey: ["tickets", userId, userRole],
    queryFn: async () => {
      if (!userId) return []

      // Buscar sector_id do usuário
      const { data: userData } = await supabase
        .from("users")
        .select("sector_id")
        .eq("id", userId)
        .single()

      return getTicketsWithAccess(
        userId,
        userRole,
        userData?.sector_id
      )
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

/**
 * Hook para buscar um ticket específico
 */
export function useTicket(ticketId: string) {
  return useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select(
          `
          *,
          sector:sectors(*),
          created_by_user:users!tickets_created_by_fkey(*),
          assigned_to_user:users!tickets_assigned_to_fkey(*)
        `
        )
        .eq("id", ticketId)
        .single()

      if (error) throw error
      return data as Ticket
    },
    enabled: !!ticketId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  })
}

/**
 * Hook para atualizar um ticket
 */
export function useUpdateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      ticketId,
      updates,
    }: {
      ticketId: string
      updates: Partial<Ticket>
    }) => {
      const { data, error } = await supabase
        .from("tickets")
        .update(updates)
        .eq("id", ticketId)
        .select()
        .single()

      if (error) throw error
      return data as Ticket
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      queryClient.invalidateQueries({ queryKey: ["ticket", data.id] })
    },
  })
}

