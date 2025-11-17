"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useNotifications, requestNotificationPermission } from "@/hooks/use-notifications"
import { UserNotification } from "@/types"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { deleteNotification } from "@/lib/notifications"

const getNotificationIcon = (type: UserNotification["type"]) => {
  switch (type) {
    case "ticket_assigned":
      return "🎫"
    case "ticket_created":
      return "✨"
    case "comment_added":
      return "💬"
    case "status_changed":
      return "🔄"
    case "sla_warning":
      return "⚠️"
    case "sla_expired":
      return "🚨"
    case "mention":
      return "👤"
    default:
      return "🔔"
  }
}

const getNotificationColor = (type: UserNotification["type"]) => {
  switch (type) {
    case "sla_expired":
      return "text-destructive"
    case "sla_warning":
      return "text-orange-500"
    case "ticket_assigned":
      return "text-blue-500"
    default:
      return "text-muted-foreground"
  }
}

export function NotificationCenter() {
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications()
  const [permissionRequested, setPermissionRequested] = useState(false)

  useEffect(() => {
    // Solicitar permissão de notificações na primeira renderização
    if (!permissionRequested && typeof window !== "undefined" && "Notification" in window) {
      requestNotificationPermission().then((granted) => {
        if (granted) {
          console.log("✅ Permissão de notificações concedida")
        } else {
          console.log("❌ Permissão de notificações negada")
        }
        setPermissionRequested(true)
      })
    }
  }, [permissionRequested])

  const handleNotificationClick = async (notification: UserNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }

    if (notification.ticket_id) {
      router.push(`/tickets/${notification.ticket_id}`)
    }
  }

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    await deleteNotification(notificationId)
    refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={async (e) => {
                e.stopPropagation()
                await markAllAsRead()
              }}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 cursor-pointer",
                  !notification.is_read && "bg-muted/50"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-lg flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          !notification.is_read && "font-semibold",
                          getNotificationColor(notification.type)
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={async (e) => {
                          e.stopPropagation()
                          await markAsRead(notification.id)
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDelete(e, notification.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-sm text-muted-foreground cursor-pointer"
              onClick={() => router.push("/notifications")}
            >
              Ver todas as notificações
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

