"use client"

import { Ticket } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Clock, User, AlertCircle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getSLAStatus } from "@/lib/sla"

interface KanbanCardProps {
  ticket: Ticket
}

const priorityColors: Record<string, string> = {
  baixa: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200",
  media: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200",
  alta: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200",
  critica: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200",
}

export function KanbanCard({ ticket }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: ticket.id,
    data: {
      type: "ticket",
      ticket,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const slaStatus = ticket.sla_due_date ? getSLAStatus(ticket.sla_due_date) : null

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={`/tickets/${ticket.id}`}>
        <Card
          className={cn(
            "mb-2 sm:mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all",
            isDragging && "ring-2 ring-primary"
          )}
        >
          <CardContent className="p-2.5 sm:p-3 md:p-4 space-y-2 sm:space-y-3">
            {/* Título e Prioridade */}
            <div className="flex items-start justify-between gap-1.5 sm:gap-2">
              <h4 className="font-semibold text-xs sm:text-sm line-clamp-2 flex-1">
                {ticket.title}
              </h4>
              <Badge
                variant="outline"
                className={cn("text-[10px] sm:text-xs shrink-0", priorityColors[ticket.priority])}
              >
                {ticket.priority}
              </Badge>
            </div>

            {/* Descrição */}
            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
              {ticket.description}
            </p>

            {/* Informações */}
            <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs text-muted-foreground">
              {/* Setor */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-medium">Setor:</span>
                <span className="truncate">{ticket.sector?.name || "Sem setor"}</span>
              </div>

              {/* Atribuído a */}
              {ticket.assigned_to_user && (
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                  <span className="truncate">{ticket.assigned_to_user.name}</span>
                </div>
              )}

              {/* SLA */}
              {slaStatus && (
                <div
                  className={cn(
                    "flex items-center gap-1 sm:gap-1.5",
                    slaStatus === "expired" && "text-red-600 dark:text-red-400",
                    slaStatus === "warning" && "text-orange-600 dark:text-orange-400"
                  )}
                >
                  <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                  <span className="truncate">
                    {slaStatus === "expired" && "Vencido"}
                    {slaStatus === "warning" && "Próximo do vencimento"}
                    {slaStatus === "ok" && "No prazo"}
                  </span>
                </div>
              )}

              {/* Data */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="truncate">
                  {format(new Date(ticket.created_at), "dd MMM yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>

              {/* ID */}
              <div className="text-[10px] sm:text-xs font-mono text-muted-foreground/70">
                #{ticket.id.slice(0, 8)}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}

