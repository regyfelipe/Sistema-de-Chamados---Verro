"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Ticket, Comment, TicketHistory, Attachment } from "@/types"
import { TicketRating } from "@/types/ratings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, Send, Clock } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { SLAAlertBanner } from "@/components/sla/sla-alert-banner"
import { AttachmentUpload } from "./attachment-upload"
import { AttachmentList } from "./attachment-list"
import { TemplateSelector } from "./template-selector"
import { RatingDialog } from "./rating-dialog"
import { TicketRatingDisplay } from "./ticket-rating-display"
import { createNotification } from "@/lib/notifications"
import { getRatingByTicketAndUser } from "@/lib/ratings"
import { Sector } from "@/types"
import { ChatSheet } from "@/components/chat/chat-sheet"

interface TicketDetailProps {
  ticket: Ticket & { 
    comments: Comment[]
    history: TicketHistory[]
    attachments: Attachment[]
    rating?: TicketRating | null
  }
  currentUser: any
}

const statusLabels: Record<string, string> = {
  aberto: "Aberto",
  em_atendimento: "Em Atendimento",
  aguardando: "Aguardando",
  fechado: "Fechado",
}

const priorityColors: Record<string, string> = {
  baixa: "bg-gray-100 text-gray-800",
  media: "bg-blue-100 text-blue-800",
  alta: "bg-orange-100 text-orange-800",
  critica: "bg-red-100 text-red-800",
}

export function TicketDetail({ ticket, currentUser }: TicketDetailProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [comment, setComment] = useState("")
  const [isInternal, setIsInternal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ticketState, setTicketState] = useState(ticket)
  const [attachments, setAttachments] = useState<Attachment[]>(ticket.attachments || [])
  const [rating, setRating] = useState<TicketRating | null>(ticket.rating || null)
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false)
  const [sectors, setSectors] = useState<Sector[]>([])


  useEffect(() => {
    if (
      ticketState.status === "fechado" &&
      ticketState.created_by === session?.user?.id &&
      !rating
    ) {
    
      const timer = setTimeout(() => {
        setRatingDialogOpen(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [ticketState.status, ticketState.created_by, rating, session?.user?.id])

  const canEdit = 
    session?.user?.role === "admin" ||
    session?.user?.role === "super_admin" ||
    session?.user?.role === "atendente" ||
    ticketState.created_by === session?.user?.id


  const canChangePriorityAndSector = 
    session?.user?.role === "admin" ||
    session?.user?.role === "super_admin"


  useEffect(() => {
    if (canChangePriorityAndSector) {
      supabase
        .from("sectors")
        .select("*")
        .order("name")
        .then(({ data, error }) => {
          if (!error && data) {
            setSectors(data)
          }
        })
    }
  }, [canChangePriorityAndSector])

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: newStatus })
        .eq("id", ticket.id)

      if (error) throw error

    
      await supabase.from("ticket_history").insert({
        ticket_id: ticket.id,
        user_id: session?.user?.id || "",
        action: "Status alterado",
        old_value: ticketState.status,
        new_value: newStatus,
      })

    
      const usersToNotify: string[] = []

    
      if (ticket.created_by !== session?.user?.id) {
        usersToNotify.push(ticket.created_by)
      }

    
      if (ticket.assigned_to && ticket.assigned_to !== session?.user?.id) {
        if (!usersToNotify.includes(ticket.assigned_to)) {
          usersToNotify.push(ticket.assigned_to)
        }
      }

    
      const statusLabels: Record<string, string> = {
        aberto: "Aberto",
        em_atendimento: "Em Atendimento",
        aguardando: "Aguardando",
        fechado: "Fechado",
      }

      for (const userId of usersToNotify) {
        await createNotification({
          user_id: userId,
          type: "status_changed",
          title: "Status do chamado alterado",
          message: `O status do chamado "${ticket.title}" foi alterado para "${statusLabels[newStatus] || newStatus}"`,
          ticket_id: ticket.id,
        })
      }

      setTicketState({ ...ticketState, status: newStatus as any })

    
      const updatedTicket = { ...ticketState, status: newStatus }
      const { triggerAutomations } = await import("@/lib/automation-engine")
      await triggerAutomations("status_changed", updatedTicket as any)

    
      if (newStatus === "fechado" && ticket.created_by === session?.user?.id && !rating) {
      
        setTimeout(() => {
          setRatingDialogOpen(true)
        }, 500)
      }

      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso",
      })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar status",
        variant: "destructive",
      })
    }
  }

  const handlePriorityChange = async (newPriority: string) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ priority: newPriority as any })
        .eq("id", ticket.id)

      if (error) throw error

    
      await supabase.from("ticket_history").insert({
        ticket_id: ticket.id,
        user_id: session?.user?.id || "",
        action: "Prioridade alterada",
        old_value: ticketState.priority,
        new_value: newPriority,
      })

    
      const usersToNotify: string[] = []

      if (ticket.created_by !== session?.user?.id) {
        usersToNotify.push(ticket.created_by)
      }

      if (ticket.assigned_to && ticket.assigned_to !== session?.user?.id) {
        if (!usersToNotify.includes(ticket.assigned_to)) {
          usersToNotify.push(ticket.assigned_to)
        }
      }

      const priorityLabels: Record<string, string> = {
        baixa: "Baixa",
        media: "Média",
        alta: "Alta",
        critica: "Crítica",
      }

      for (const userId of usersToNotify) {
        await createNotification({
          user_id: userId,
          type: "priority_changed",
          title: "Prioridade do chamado alterada",
          message: `A prioridade do chamado "${ticket.title}" foi alterada para "${priorityLabels[newPriority] || newPriority}"`,
          ticket_id: ticket.id,
        })
      }

      setTicketState({ ...ticketState, priority: newPriority as any })

      toast({
        title: "Sucesso",
        description: "Prioridade atualizada com sucesso",
      })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar prioridade",
        variant: "destructive",
      })
    }
  }

  const handleSectorChange = async (newSectorId: string) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ sector_id: newSectorId === "none" ? null : newSectorId })
        .eq("id", ticket.id)

      if (error) throw error

    
      const oldSectorName = ticketState.sector?.name || "Sem setor"
      const newSector = sectors.find((s) => s.id === newSectorId)
      const newSectorName = newSector?.name || "Sem setor"

    
      await supabase.from("ticket_history").insert({
        ticket_id: ticket.id,
        user_id: session?.user?.id || "",
        action: "Setor alterado",
        old_value: oldSectorName,
        new_value: newSectorName,
      })

    
      const usersToNotify: string[] = []

      if (ticket.created_by !== session?.user?.id) {
        usersToNotify.push(ticket.created_by)
      }

      if (ticket.assigned_to && ticket.assigned_to !== session?.user?.id) {
        if (!usersToNotify.includes(ticket.assigned_to)) {
          usersToNotify.push(ticket.assigned_to)
        }
      }

      for (const userId of usersToNotify) {
        await createNotification({
          user_id: userId,
          type: "sector_changed",
          title: "Setor do chamado alterado",
          message: `O setor do chamado "${ticket.title}" foi alterado de "${oldSectorName}" para "${newSectorName}"`,
          ticket_id: ticket.id,
        })
      }

    
      setTicketState({
        ...ticketState,
        sector_id: newSectorId === "none" ? null : newSectorId,
        sector: newSector || null,
      })

      toast({
        title: "Sucesso",
        description: "Setor atualizado com sucesso",
      })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar setor",
        variant: "destructive",
      })
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase.from("comments").insert({
        ticket_id: ticket.id,
        user_id: session?.user?.id || "",
        content: comment,
        is_internal: isInternal,
      })

      if (error) throw error

    
      const { data: comments } = await supabase
        .from("comments")
        .select("id")
        .eq("ticket_id", ticket.id)
        .eq("user_id", session?.user?.id || "")
        .order("created_at", { ascending: false })
        .limit(1)

      const commentId = comments && comments.length > 0 ? comments[0].id : undefined

    
      await supabase.from("ticket_history").insert({
        ticket_id: ticket.id,
        user_id: session?.user?.id || "",
        action: isInternal ? "Comentário interno adicionado" : "Comentário adicionado",
      })

    
      const usersToNotify: string[] = []

    
      if (ticket.created_by !== session?.user?.id) {
        usersToNotify.push(ticket.created_by)
      }

    
      if (ticket.assigned_to && ticket.assigned_to !== session?.user?.id) {
        if (!usersToNotify.includes(ticket.assigned_to)) {
          usersToNotify.push(ticket.assigned_to)
        }
      }

    
      for (const userId of usersToNotify) {
        await createNotification({
          user_id: userId,
          type: "comment_added",
          title: isInternal ? "Comentário interno adicionado" : "Novo comentário",
          message: `${session?.user?.name || "Alguém"} comentou no chamado "${ticket.title}"`,
          ticket_id: ticket.id,
          comment_id: commentId,
        })
      }

      toast({
        title: "Sucesso",
        description: "Comentário adicionado com sucesso",
      })

      setComment("")
      setIsInternal(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar comentário",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <Link href="/tickets">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight truncate">
              {ticketState.title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Criado em{" "}
              {format(new Date(ticketState.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <ChatSheet
            ticketId={ticketState.id}
            ticketTitle={ticketState.title}
          />
        </div>
      </div>

      <SLAAlertBanner ticket={ticketState} />

      {/* Mostrar avaliação se existir */}
      {rating && (
        <TicketRatingDisplay rating={rating} />
      )}

      {/* Dialog de avaliação */}
      {ticketState.status === "fechado" && ticketState.created_by === session?.user?.id && !rating && (
        <RatingDialog
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          ticket={ticketState}
          userId={session?.user?.id || ""}
          onRatingSubmitted={async () => {
          
            const newRating = await getRatingByTicketAndUser(
              ticketState.id,
              session?.user?.id || ""
            )
            if (newRating) {
              setRating(newRating)
            }
            router.refresh()
          }}
        />
      )}

      <div className="grid gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3">
        {/* Sidebar - aparece primeiro no mobile */}
        <div className="lg:order-2 space-y-3 sm:space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-base sm:text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 pt-0">
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">Status</label>
                {canEdit ? (
                  <Select
                    value={ticketState.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="mt-1 h-8 sm:h-10 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aberto" className="text-sm">Aberto</SelectItem>
                      <SelectItem value="em_atendimento" className="text-sm">Em Atendimento</SelectItem>
                      <SelectItem value="aguardando" className="text-sm">Aguardando</SelectItem>
                      <SelectItem value="fechado" className="text-sm">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      {statusLabels[ticketState.status]}
                    </Badge>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">Prioridade</label>
                {canChangePriorityAndSector ? (
                  <Select
                    value={ticketState.priority}
                    onValueChange={handlePriorityChange}
                  >
                    <SelectTrigger className="mt-1 h-8 sm:h-10 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa" className="text-sm">Baixa</SelectItem>
                      <SelectItem value="media" className="text-sm">Média</SelectItem>
                      <SelectItem value="alta" className="text-sm">Alta</SelectItem>
                      <SelectItem value="critica" className="text-sm">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={`text-xs sm:text-sm ${priorityColors[ticketState.priority]}`}
                    >
                      {ticketState.priority}
                    </Badge>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">Setor</label>
                {canChangePriorityAndSector ? (
                  <Select
                    value={ticketState.sector_id || "none"}
                    onValueChange={handleSectorChange}
                  >
                    <SelectTrigger className="mt-1 h-8 sm:h-10 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-sm">Sem setor</SelectItem>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id} className="text-sm">
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1 text-xs sm:text-sm">{ticketState.sector?.name || "Sem setor"}</p>
                )}
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">Criado por</label>
                <p className="mt-1 text-xs sm:text-sm">{ticketState.created_by_user?.name || "Usuário"}</p>
              </div>

              {ticketState.assigned_to_user && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Atribuído a
                  </label>
                  <p className="mt-1 text-xs sm:text-sm">{ticketState.assigned_to_user.name}</p>
                </div>
              )}

              {ticketState.sla_due_date && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">SLA</label>
                  <p className="mt-1 text-xs sm:text-sm">
                    {format(new Date(ticketState.sla_due_date), "dd MMM yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo principal */}
        <div className="lg:col-span-2 lg:order-1 space-y-3 sm:space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-base sm:text-lg">Descrição</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 pt-0">
              <p className="text-sm sm:text-base whitespace-pre-wrap">{ticketState.description}</p>
              {attachments.length > 0 && (
                <AttachmentList
                  attachments={attachments}
                  ticketId={ticketState.id}
                  onDelete={() => {
                    router.refresh()
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Comentários */}
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-base sm:text-lg">Comentários</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 pt-0">
              {ticketState.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-2 sm:p-3 md:p-4 rounded-lg border ${
                    comment.is_internal ? "bg-yellow-50 border-yellow-200" : "bg-background"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-medium">{comment.user?.name || "Usuário"}</span>
                      {comment.is_internal && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs">
                          Interno
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), "dd MMM yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}

              {canEdit && (
                <form onSubmit={handleCommentSubmit} className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <TemplateSelector
                      ticket={ticketState}
                      onSelect={setComment}
                      currentComment={comment}
                    />
                  </div>
                  <Textarea
                    placeholder="Adicione um comentário... (Use templates ou digite diretamente)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="text-sm sm:text-base resize-none min-h-[80px] sm:min-h-[100px]"
                  />
                  <AttachmentUpload
                    ticketId={ticketState.id}
                    userId={session?.user?.id || ""}
                    onUploadComplete={(attachment) => {
                      setAttachments((prev) => [attachment, ...prev])
                      router.refresh()
                    }}
                  />
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <label className="flex items-center gap-2 text-xs sm:text-sm">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded"
                      />
                      <span>Comentário interno (apenas atendentes)</span>
                    </label>
                    <Button 
                      type="submit" 
                      disabled={loading || !comment.trim()}
                      className="w-full sm:w-auto h-8 sm:h-10 text-xs sm:text-sm"
                    >
                      <Send className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Enviar
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Histórico Aprimorado */}
          {ticketState.history.length > 0 && (
            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="text-base sm:text-lg">Histórico Completo</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Todas as alterações e eventos deste chamado
                </p>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {ticketState.history.map((item, index) => {
                    const isLast = index === ticketState.history.length - 1
                    return (
                      <div key={item.id} className="relative flex gap-2 sm:gap-4">
                        {/* Linha vertical */}
                        {!isLast && (
                          <div className="absolute left-2 sm:left-2 top-6 bottom-0 w-0.5 bg-border" />
                        )}
                        {/* Ícone */}
                        <div className="relative z-10 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-muted flex-shrink-0">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        </div>
                        {/* Conteúdo */}
                        <div className="flex-1 space-y-1 pb-3 sm:pb-4 min-w-0">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                            <span className="font-medium text-xs sm:text-sm">
                              {item.user?.name || "Sistema"}
                            </span>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              {item.action}
                            </span>
                          </div>
                          {item.old_value && item.new_value && (
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                              <span className="line-through">{item.old_value}</span>
                              <span>→</span>
                              <span className="font-medium">{item.new_value}</span>
                            </div>
                          )}
                          {!item.old_value && item.new_value && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              {item.new_value}
                            </p>
                          )}
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {format(new Date(item.created_at), "dd MMM yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

