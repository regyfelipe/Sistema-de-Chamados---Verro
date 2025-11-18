"use client"

import { useState, useMemo } from "react"
import { Ticket } from "@/types"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core"
import { KanbanColumn } from "./kanban-column"
import { KanbanCard } from "./kanban-card"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { createNotification } from "@/lib/notifications"
import { TicketFilters } from "@/types/filters"
import { applyFilters } from "@/lib/filter-utils"
import { KanbanFilters } from "./kanban-filters"

interface KanbanBoardProps {
  initialTickets: Ticket[]
}

const statusColumns = [
  { id: "aberto", title: "Aberto", color: "bg-blue-50 dark:bg-blue-950/20" },
  { id: "em_atendimento", title: "Em Atendimento", color: "bg-yellow-50 dark:bg-yellow-950/20" },
  { id: "aguardando", title: "Aguardando", color: "bg-orange-50 dark:bg-orange-950/20" },
  { id: "fechado", title: "Fechado", color: "bg-green-50 dark:bg-green-950/20" },
]

type GroupBy = "none" | "sector" | "priority"

export function KanbanBoard({ initialTickets }: KanbanBoardProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [filters, setFilters] = useState<TicketFilters>({
    search: "",
    status: "all",
    priority: "all",
    sector_id: "all",
    assigned_to: "all",
    created_by: "all",
    slaStatus: "all",
    dateFilterType: "none",
    dateFrom: "",
    dateTo: "",
  })
  const [groupBy, setGroupBy] = useState<GroupBy>("none")

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Filtrar tickets
  const filteredTickets = useMemo(() => {
    return applyFilters(tickets, filters)
  }, [tickets, filters])

  // Agrupar tickets por status e opcionalmente por setor/prioridade
  const groupedTickets = useMemo(() => {
    const grouped: Record<string, Ticket[]> = {}

    filteredTickets.forEach((ticket) => {
      const status = ticket.status
      if (!grouped[status]) {
        grouped[status] = []
      }
      grouped[status].push(ticket)
    })

    // Se houver agrupamento adicional, reorganizar
    if (groupBy === "sector") {
      const reorganized: Record<string, Record<string, Ticket[]>> = {}
      Object.entries(grouped).forEach(([status, tickets]) => {
        reorganized[status] = {}
        tickets.forEach((ticket) => {
          const sectorId = ticket.sector_id || "none"
          if (!reorganized[status][sectorId]) {
            reorganized[status][sectorId] = []
          }
          reorganized[status][sectorId].push(ticket)
        })
      })
      // Retornar estrutura simplificada para colunas
      return grouped
    }

    if (groupBy === "priority") {
      const reorganized: Record<string, Record<string, Ticket[]>> = {}
      Object.entries(grouped).forEach(([status, tickets]) => {
        reorganized[status] = {}
        tickets.forEach((ticket) => {
          const priority = ticket.priority
          if (!reorganized[status][priority]) {
            reorganized[status][priority] = []
          }
          reorganized[status][priority].push(ticket)
        })
      })
      return grouped
    }

    return grouped
  }, [filteredTickets, groupBy])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const ticket = tickets.find((t) => t.id === active.id)
    setActiveTicket(ticket || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTicket(null)

    if (!over) return

    const ticketId = active.id as string
    const newStatus = over.id as string

    // Verificar se é uma coluna válida
    if (!statusColumns.find((col) => col.id === newStatus)) return

    // Verificar se o status mudou
    const ticket = tickets.find((t) => t.id === ticketId)
    if (!ticket || ticket.status === newStatus) return

    try {
      // Atualizar no banco
      const { error } = await supabase
        .from("tickets")
        .update({ status: newStatus })
        .eq("id", ticketId)

      if (error) throw error

      // Registrar no histórico
      await supabase.from("ticket_history").insert({
        ticket_id: ticketId,
        user_id: session?.user?.id || ticket.created_by,
        action: "Status alterado",
        old_value: ticket.status,
        new_value: newStatus,
      })

      // Notificar usuários relevantes
      const usersToNotify: string[] = []
      if (ticket.created_by !== ticket.assigned_to) {
        usersToNotify.push(ticket.created_by)
      }
      if (ticket.assigned_to && ticket.assigned_to !== ticket.created_by) {
        usersToNotify.push(ticket.assigned_to)
      }

      for (const userId of usersToNotify) {
        await createNotification({
          user_id: userId,
          type: "status_changed",
          title: "Status do chamado alterado",
          message: `O status do chamado "${ticket.title}" foi alterado para "${statusColumns.find((c) => c.id === newStatus)?.title || newStatus}"`,
          ticket_id: ticketId,
        })
      }

      // Atualizar estado local
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus as any } : t))
      )

      toast({
        title: "Sucesso",
        description: "Status do chamado atualizado",
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

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Filtros */}
      <KanbanFilters
        filters={filters}
        onFiltersChange={setFilters}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
      />

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto pb-2 sm:pb-3 md:pb-4 -mx-2 sm:-mx-3 md:-mx-4 px-2 sm:px-3 md:px-4">
          {statusColumns.map((column) => {
            const columnTickets = groupedTickets[column.id] || []
            return (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tickets={columnTickets}
                color={column.color}
              />
            )
          })}
        </div>

        <DragOverlay>
          {activeTicket ? <KanbanCard ticket={activeTicket} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

