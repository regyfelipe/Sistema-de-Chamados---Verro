"use client"

import { Ticket } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Calendar,
  ArrowRight,
  UserPlus,
  MessageSquare
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { createNotification } from "@/lib/notifications"
import { useToast } from "@/components/ui/use-toast"

interface TicketPreviewProps {
  ticket: Ticket
  children: React.ReactNode
}

const statusLabels: Record<string, string> = {
  aberto: "Aberto",
  em_atendimento: "Em Atendimento",
  aguardando: "Aguardando",
  fechado: "Fechado",
}

const statusIcons: Record<string, React.ReactNode> = {
  aberto: <AlertCircle className="h-4 w-4" />,
  em_atendimento: <Clock className="h-4 w-4" />,
  aguardando: <Clock className="h-4 w-4" />,
  fechado: <CheckCircle2 className="h-4 w-4" />,
}

const priorityColors: Record<string, string> = {
  baixa: "bg-gray-100 text-gray-800 border-gray-300",
  media: "bg-blue-100 text-blue-800 border-blue-300",
  alta: "bg-orange-100 text-orange-800 border-orange-300",
  critica: "bg-red-100 text-red-800 border-red-300",
}

export function TicketPreview({ ticket, children }: TicketPreviewProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const canEdit = 
    session?.user?.role === "admin" || 
    session?.user?.role === "atendente" ||
    ticket.created_by === session?.user?.id

  const handleQuickStatusChange = async (newStatus: string) => {
    if (!canEdit) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: newStatus as any })
        .eq("id", ticket.id)

      if (error) throw error

     
      await supabase.from("ticket_history").insert({
        ticket_id: ticket.id,
        user_id: session?.user?.id || "",
        action: "Status alterado",
        old_value: ticket.status,
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

      for (const userId of usersToNotify) {
        await createNotification({
          user_id: userId,
          type: "status_changed",
          title: "Status do chamado alterado",
          message: `O status do chamado "${ticket.title}" foi alterado para "${statusLabels[newStatus] || newStatus}"`,
          ticket_id: ticket.id,
        })
      }

      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso",
      })

      setIsOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar status",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAssignToMe = async () => {
    if (!session?.user?.id) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ assigned_to: session.user.id })
        .eq("id", ticket.id)

      if (error) throw error

     
      await supabase.from("ticket_history").insert({
        ticket_id: ticket.id,
        user_id: session.user.id,
        action: "Atribuído",
        new_value: session.user.id,
      })

     
      if (ticket.created_by !== session.user.id) {
        await createNotification({
          user_id: ticket.created_by,
          type: "ticket_assigned",
          title: "Chamado atribuído",
          message: `O chamado "${ticket.title}" foi atribuído a ${session.user.name}`,
          ticket_id: ticket.id,
        })
      }

      toast({
        title: "Sucesso",
        description: "Chamado atribuído a você",
      })

      setIsOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atribuir chamado",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getSLAStatus = () => {
    if (!ticket.sla_due_date) return null

    const now = new Date()
    const dueDate = new Date(ticket.sla_due_date)
    const diffMs = dueDate.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffHours < 0) {
      return { status: "overdue", hours: Math.abs(diffHours) }
    } else if (diffHours < 2) {
      return { status: "warning", hours: diffHours }
    }
    return { status: "ok", hours: diffHours }
  }

  const slaStatus = getSLAStatus()

  return (
    <div
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      className="relative"
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div>{children}</div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-96 p-0" 
          side="right"
          align="start"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm leading-tight">{ticket.title}</h3>
              <Badge
                variant="outline"
                className={cn("text-xs shrink-0", priorityColors[ticket.priority])}
              >
                {ticket.priority}
              </Badge>
            </div>
            
            {/* Status */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {statusIcons[ticket.status]}
                <span>{statusLabels[ticket.status]}</span>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <p className="text-sm text-muted-foreground line-clamp-3">
            {ticket.description}
          </p>

          {/* Informações */}
          <div className="space-y-2 text-xs text-muted-foreground border-t pt-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Criado em {format(new Date(ticket.created_at), "dd MMM yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </span>
            </div>
            
            {ticket.sector && (
              <div className="flex items-center gap-2">
                <span>Setor: {ticket.sector.name}</span>
              </div>
            )}

            {ticket.assigned_to_user && (
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                <span>Atribuído a: {ticket.assigned_to_user.name}</span>
              </div>
            )}

            {slaStatus && (
              <div className={cn(
                "flex items-center gap-2",
                slaStatus.status === "overdue" && "text-red-600 font-medium",
                slaStatus.status === "warning" && "text-orange-600 font-medium"
              )}>
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {slaStatus.status === "overdue" && `SLA vencido há ${Math.floor(slaStatus.hours)}h`}
                  {slaStatus.status === "warning" && `SLA em ${Math.floor(slaStatus.hours)}h`}
                  {slaStatus.status === "ok" && `SLA: ${Math.floor(slaStatus.hours)}h restantes`}
                </span>
              </div>
            )}
          </div>

          {/* Ações Rápidas */}
          {canEdit && (
            <div className="space-y-2 border-t pt-3">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Ações Rápidas
              </div>
              
              {/* Mudar Status */}
              {ticket.status !== "fechado" && (
                <div className="flex flex-wrap gap-1.5">
                  {ticket.status !== "em_atendimento" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => handleQuickStatusChange("em_atendimento")}
                      disabled={loading}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Em Atendimento
                    </Button>
                  )}
                  {ticket.status !== "aguardando" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => handleQuickStatusChange("aguardando")}
                      disabled={loading}
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Aguardando
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => handleQuickStatusChange("fechado")}
                    disabled={loading}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Fechar
                  </Button>
                </div>
              )}

              {/* Atribuir a mim */}
              {ticket.assigned_to !== session?.user?.id && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs h-7"
                  onClick={handleAssignToMe}
                  disabled={loading}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Atribuir a mim
                </Button>
              )}

              {/* Ver detalhes */}
              <Button
                size="sm"
                variant="default"
                className="w-full text-xs h-7"
                onClick={() => {
                  setIsOpen(false)
                  router.push(`/tickets/${ticket.id}`)
                }}
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Ver detalhes completos
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
      </Popover>
    </div>
  )
}

