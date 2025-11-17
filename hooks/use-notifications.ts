"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { supabase } from "@/lib/supabase"
import { UserNotification } from "@/types"
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/notifications"

export function useNotifications() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const userId = session?.user?.id

  // Carregar notificações iniciais
  useEffect(() => {
    if (!userId) return

    loadNotifications()
    loadUnreadCount()

    // Configurar subscription para notificações em tempo real
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("🔔 [Notifications] Mudança detectada:", payload.eventType)

          if (payload.eventType === "INSERT") {
            const newNotification = payload.new as UserNotification
            setNotifications((prev) => [newNotification, ...prev])
            setUnreadCount((prev) => prev + 1)

            // Mostrar notificação push no navegador
            if (typeof window !== "undefined" && "Notification" in window) {
              const BrowserNotification = window.Notification
              if (BrowserNotification && BrowserNotification.permission === "granted") {
                new BrowserNotification(newNotification.title, {
                  body: newNotification.message,
                  icon: "/favicon.ico",
                  tag: newNotification.id,
                })
              }
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedNotification = payload.new as UserNotification
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === updatedNotification.id ? updatedNotification : n
              )
            )
            if (updatedNotification.is_read) {
              setUnreadCount((prev) => Math.max(0, prev - 1))
            }
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id
            setNotifications((prev) => prev.filter((n) => n.id !== deletedId))
          }

          // Recarregar contador
          loadUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const loadNotifications = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const data = await getUserNotifications(userId)
      setNotifications(data)
    } catch (error) {
      console.error("Erro ao carregar notificações:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    if (!userId) return

    try {
      const count = await getUnreadCount(userId)
      setUnreadCount(count)
    } catch (error) {
      console.error("Erro ao carregar contador:", error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    const success = await markNotificationAsRead(notificationId)
    if (success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    return success
  }

  const markAllAsRead = async () => {
    if (!userId) return false

    const success = await markAllNotificationsAsRead(userId)
    if (success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    }
    return success
  }

  const refresh = () => {
    loadNotifications()
    loadUnreadCount()
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh,
  }
}

/**
 * Solicita permissão para notificações push
 */
export function requestNotificationPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false)
      return
    }

    if (!("Notification" in window)) {
      resolve(false)
      return
    }

    const BrowserNotification = window.Notification
    if (!BrowserNotification) {
      resolve(false)
      return
    }

    if (BrowserNotification.permission === "granted") {
      resolve(true)
      return
    }

    if (BrowserNotification.permission === "denied") {
      resolve(false)
      return
    }

    BrowserNotification.requestPermission().then((permission) => {
      resolve(permission === "granted")
    }).catch(() => {
      resolve(false)
    })
  })
}

