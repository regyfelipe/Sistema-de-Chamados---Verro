"use client"

import { useState, useMemo, useEffect } from "react"
import { Ticket } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { AdvancedFilters } from "./advanced-filters"
import { TicketFilters, defaultFilters } from "@/types/filters"
import { applyFilters, exportTicketsToCSV } from "@/lib/filter-utils"
import { LayoutGrid, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { TicketPreview } from "./ticket-preview"

interface TicketsListProps {
  initialTickets: Ticket[]
}

const statusLabels: Record<string, string> = {
  aberto: "Aberto",
  em_atendimento: "Em Atendimento",
  aguardando: "Aguardando",
  fechado: "Fechado",
}

const priorityColors: Record<string, string> = {
  baixa: "bg-gray-100 text-gray-800 border-gray-300",
  media: "bg-blue-100 text-blue-800 border-blue-300",
  alta: "bg-orange-100 text-orange-800 border-orange-300",
  critica: "bg-red-100 text-red-800 border-red-300",
}

export function TicketsList({ initialTickets }: TicketsListProps) {
  const [tickets] = useState<Ticket[]>(initialTickets)
  const [filters, setFilters] = useState<TicketFilters>(defaultFilters)
  const [isCompact, setIsCompact] = useState(false)

  // Carregar preferência do localStorage
  useEffect(() => {
    const saved = localStorage.getItem("tickets-view-mode")
    if (saved === "compact") {
      setIsCompact(true)
    }
  }, [])

  // Salvar preferência no localStorage
  const toggleViewMode = () => {
    const newMode = !isCompact
    setIsCompact(newMode)
    localStorage.setItem("tickets-view-mode", newMode ? "compact" : "normal")
  }

  const filteredTickets = useMemo(() => {
    return applyFilters(tickets, filters)
  }, [tickets, filters])

  const handleExport = () => {
    exportTicketsToCSV(filteredTickets)
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Filtros Avançados */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        onExport={handleExport}
      />

      {/* Controles de visualização */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        {/* Contador de resultados */}
        {filteredTickets.length > 0 && (
          <div className="text-xs sm:text-sm text-muted-foreground">
            Mostrando {filteredTickets.length} de {tickets.length} chamados
          </div>
        )}

        {/* Toggle de visualização */}
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">Visualização:</span>
          <div className="flex items-center border rounded-md">
            <Button
              variant={!isCompact ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                if (isCompact) toggleViewMode()
              }}
              className="rounded-r-none h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
            >
              <List className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Normal</span>
            </Button>
            <Button
              variant={isCompact ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                if (!isCompact) toggleViewMode()
              }}
              className="rounded-l-none h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
            >
              <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Compacta</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de tickets */}
      <div className={cn(
        isCompact ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" : "space-y-2"
      )}>
        {filteredTickets.length === 0 ? (
          <Card className={isCompact ? "col-span-full" : ""}>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {Object.values(filters).some(
                  (v) => v !== "all" && v !== "" && v !== "none"
                )
                  ? `Nenhum chamado encontrado com os filtros aplicados (${filteredTickets.length} de ${tickets.length})`
                  : "Nenhum chamado encontrado"}
              </p>
            </CardContent>
          </Card>
        ) : isCompact ? (
          // Visualização Compacta
          filteredTickets.map((ticket) => (
            <TicketPreview key={ticket.id} ticket={ticket}>
              <Link href={`/tickets/${ticket.id}`} className="block">
                <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm line-clamp-1 flex-1">
                          {ticket.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs shrink-0",
                            priorityColors[ticket.priority]
                          )}
                        >
                          {ticket.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {statusLabels[ticket.status]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {ticket.sector?.name || "Sem setor"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>#{ticket.id.slice(0, 8)}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(ticket.created_at), "dd MMM yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      {ticket.assigned_to_user && (
                        <div className="text-xs text-muted-foreground">
                          👤 {ticket.assigned_to_user.name}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </TicketPreview>
          ))
        ) : (
          // Visualização Normal
          filteredTickets.map((ticket) => (
            <TicketPreview key={ticket.id} ticket={ticket}>
              <Link href={`/tickets/${ticket.id}`} className="block">
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold">{ticket.title}</h3>
                          <Badge
                            variant="outline"
                            className={priorityColors[ticket.priority]}
                          >
                            {ticket.priority}
                          </Badge>
                          <Badge variant="outline">
                            {statusLabels[ticket.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>#{ticket.id.slice(0, 8)}</span>
                          <span>•</span>
                          <span>{ticket.sector?.name || "Sem setor"}</span>
                          <span>•</span>
                          <span>
                            {format(new Date(ticket.created_at), "dd MMM yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </span>
                          {ticket.assigned_to_user && (
                            <>
                              <span>•</span>
                              <span>Atribuído a: {ticket.assigned_to_user.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </TicketPreview>
          ))
        )}
      </div>
    </div>
  )
}

