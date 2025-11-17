"use client"

import { useState } from "react"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ChatInterface } from "./chat-interface"
import { Badge } from "@/components/ui/badge"
import { getUnreadChatCount } from "@/lib/chat"
import { useSession } from "next-auth/react"
import { useEffect } from "react"

interface ChatSheetProps {
  ticketId?: string | null
  ticketTitle?: string
}

export function ChatSheet({ ticketId, ticketTitle }: ChatSheetProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!session?.user?.id || !open) return

    const loadUnreadCount = async () => {
      const count = await getUnreadChatCount(session.user.id, ticketId)
      setUnreadCount(count)
    }

    loadUnreadCount()

    // Atualizar contador a cada 10 segundos
    const interval = setInterval(loadUnreadCount, 10000)

    return () => clearInterval(interval)
  }, [session?.user?.id, ticketId, open])

  const title = ticketId
    ? `Chat: ${ticketTitle || "Chamado"}`
    : "Chat Geral"

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Chat em Tempo Real
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {ticketId
              ? "Converse em tempo real sobre este chamado"
              : "Converse com todos os usuários do sistema"}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-hidden flex flex-col">
          <ChatInterface
            ticketId={ticketId}
            compact={true}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

