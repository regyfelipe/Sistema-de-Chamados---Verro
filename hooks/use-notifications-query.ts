"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/lib/notifications"
import { UserNotification } from "@/types"

/**
 * Hook otimizado para notificações
 */
export function useNotifications() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => getUserNotifications(userId || "", 50),
    enabled: !!userId,
    staleTime: 30 * 1000, 
    refetchInterval: 30 * 1000, 
  })
}

/**
 * Hook para contador de não lidas
 */
export function useUnreadCount() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  return useQuery({
    queryKey: ["notifications", "unread", userId],
    queryFn: () => getUnreadCount(userId || ""),
    enabled: !!userId,
    staleTime: 10 * 1000, 
    refetchInterval: 10 * 1000, 
  })
}

/**
 * Hook para marcar notificação como lida
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const userId = session?.user?.id

  return useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", userId],
      })
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread", userId],
      })
    },
  })
}

/**
 * Hook para marcar todas como lidas
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const userId = session?.user?.id

  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(userId || ""),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", userId],
      })
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread", userId],
      })
    },
  })
}

/**
 * Hook para deletar notificação
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const userId = session?.user?.id

  return useMutation({
    mutationFn: (notificationId: string) =>
      deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", userId],
      })
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread", userId],
      })
    },
  })
}

