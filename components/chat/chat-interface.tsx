"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useChat } from "@/hooks/use-chat"
import { ChatMessage } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Send, Edit2, Trash2, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInterfaceProps {
  ticketId?: string | null
  title?: string
  compact?: boolean
}

export function ChatInterface({ ticketId, title, compact = false }: ChatInterfaceProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [message, setMessage] = useState("")
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null)
  const [editText, setEditText] = useState("")
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    messagesEndRef,
    scrollToBottom,
  } = useChat({ ticketId, autoMarkAsRead: true })

  const userId = session?.user?.id
  const userRole = session?.user?.role

  // Scroll automático quando novas mensagens chegam
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    try {
      await sendMessage(message)
      setMessage("")
    } catch (err) {
      // Erro já é tratado no hook
    }
  }

  const handleEdit = async () => {
    if (!editingMessage || !editText.trim()) return

    try {
      await editMessage(editingMessage.id, editText)
      setEditingMessage(null)
      setEditText("")
      toast({
        title: "Sucesso",
        description: "Mensagem editada com sucesso",
      })
    } catch (err) {
      // Erro já é tratado no hook
    }
  }

  const handleDelete = async (messageId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta mensagem?")) return

    try {
      await deleteMessage(messageId)
      toast({
        title: "Sucesso",
        description: "Mensagem deletada com sucesso",
      })
    } catch (err) {
      // Erro já é tratado no hook
    }
  }

  const startEditing = (msg: ChatMessage) => {
    setEditingMessage(msg)
    setEditText(msg.message)
  }

  const cancelEditing = () => {
    setEditingMessage(null)
    setEditText("")
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return format(date, "HH:mm", { locale: ptBR })
    } else if (diffInHours < 168) {
      return format(date, "EEE 'às' HH:mm", { locale: ptBR })
    } else {
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    }
  }

  const isOwnMessage = (msg: ChatMessage) => msg.user_id === userId
  const canEdit = (msg: ChatMessage) =>
    isOwnMessage(msg) || userRole === "admin" || userRole === "super_admin"
  const canDelete = (msg: ChatMessage) =>
    isOwnMessage(msg) || userRole === "admin" || userRole === "super_admin"

  return (
    <div className={cn("flex flex-col h-full", !compact && "border rounded-lg")}>
      {title && !compact && (
        <div className="border-b p-4">
          <h3 className="text-lg font-semibold">
            {title}
          </h3>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Área de mensagens */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {loading && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Carregando mensagens...
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Nenhuma mensagem ainda. Seja o primeiro a enviar!
            </div>
          )}

          {messages.map((msg) => {
            const own = isOwnMessage(msg)
            const isEditing = editingMessage?.id === msg.id

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 group",
                  own && "flex-row-reverse"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                    own
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {msg.user?.name?.charAt(0).toUpperCase() || "?"}
                </div>

                {/* Mensagem */}
                <div className={cn("flex-1 space-y-1", own && "items-end")}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {msg.user?.name || "Usuário"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(msg.created_at)}
                    </span>
                    {msg.is_edited && (
                      <span className="text-xs text-muted-foreground italic">
                        (editado)
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleEdit()
                          } else if (e.key === "Escape") {
                            cancelEditing()
                          }
                        }}
                        autoFocus
                        className="w-full"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleEdit}
                          disabled={!editText.trim()}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2 max-w-[70%] break-words",
                        own
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  )}

                  {/* Ações (aparecem no hover) */}
                  {!isEditing && canEdit(msg) && (
                    <div
                      className={cn(
                        "flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
                        own && "justify-end"
                      )}
                    >
                      {canEdit(msg) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2"
                          onClick={() => startEditing(msg)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                      {canDelete(msg) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(msg.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Erro */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Input de mensagem */}
        <div className="border-t p-4">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={sending || !userId}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e)
                }
              }}
            />
            <Button type="submit" disabled={sending || !message.trim() || !userId}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

