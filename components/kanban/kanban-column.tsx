"use client"

import { Ticket } from "@/types"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanCard } from "./kanban-card"
import { cn } from "@/lib/utils"

interface KanbanColumnProps {
  id: string
  title: string
  tickets: Ticket[]
  color?: string
}

export function KanbanColumn({ id, title, tickets, color }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "column",
      status: id,
    },
  })

  return (
    <div className="flex flex-col h-full min-w-[300px] max-w-[350px]">
      {/* Header */}
      <div
        className={cn(
          "sticky top-0 z-10 p-4 rounded-t-lg border-b",
          color || "bg-muted/50"
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{title}</h3>
          <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-full">
            {tickets.length}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-3 overflow-y-auto space-y-2 min-h-[200px]",
          isOver && "bg-primary/5 border-2 border-dashed border-primary rounded-lg"
        )}
      >
        <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              Nenhum chamado
            </div>
          ) : (
            tickets.map((ticket) => <KanbanCard key={ticket.id} ticket={ticket} />)
          )}
        </SortableContext>
      </div>
    </div>
  )
}

