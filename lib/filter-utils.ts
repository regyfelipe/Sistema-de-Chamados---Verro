import { Ticket } from "@/types"
import { TicketFilters } from "@/types/filters"
import { checkSLAStatus } from "./sla"
import { fuzzySearchTickets } from "./fuzzy-search"

/**
 * Aplica todos os filtros aos tickets
 */
export function applyFilters(tickets: Ticket[], filters: TicketFilters): Ticket[] {
  return tickets.filter((ticket) => {
    // Busca por palavras-chave (com fuzzy search)
    if (filters.search) {
      // Usa busca fuzzy para melhor tolerância a erros
      const searchResults = fuzzySearchTickets([ticket], filters.search)
      if (searchResults.length === 0) return false
    }

    // Filtro por status
    if (filters.status !== "all" && ticket.status !== filters.status) {
      return false
    }

    // Filtro por prioridade
    if (filters.priority !== "all" && ticket.priority !== filters.priority) {
      return false
    }

    // Filtro por setor
    if (filters.sector_id !== "all" && ticket.sector_id !== filters.sector_id) {
      return false
    }

    // Filtro por criador
    if (filters.created_by !== "all" && ticket.created_by !== filters.created_by) {
      return false
    }

    // Filtro por responsável
    if (filters.assigned_to !== "all") {
      if (filters.assigned_to === "unassigned") {
        if (ticket.assigned_to) return false
      } else {
        if (ticket.assigned_to !== filters.assigned_to) return false
      }
    }

    // Filtro por data
    if (filters.dateFilterType !== "none") {
      if (!filters.dateFrom || !filters.dateTo) return true

      const fromDate = new Date(filters.dateFrom)
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999) // Fim do dia

      let ticketDate: Date

      switch (filters.dateFilterType) {
        case "created":
          ticketDate = new Date(ticket.created_at)
          break
        case "updated":
          ticketDate = new Date(ticket.updated_at)
          break
        case "sla":
          if (!ticket.sla_due_date) return false
          ticketDate = new Date(ticket.sla_due_date)
          break
        default:
          return true
      }

      if (ticketDate < fromDate || ticketDate > toDate) {
        return false
      }
    }

    // Filtro por status de SLA
    if (filters.slaStatus !== "all" && ticket.sla_due_date) {
      const slaStatus = checkSLAStatus(ticket)
      if (slaStatus.status !== filters.slaStatus) {
        return false
      }
    }

    return true
  })
}

/**
 * Exporta tickets para CSV
 */
export function exportTicketsToCSV(tickets: Ticket[]): void {
  if (tickets.length === 0) {
    alert("Nenhum chamado para exportar")
    return
  }

  const headers = [
    "ID",
    "Título",
    "Descrição",
    "Setor",
    "Status",
    "Prioridade",
    "Criado por",
    "Atribuído a",
    "Data de Criação",
    "Data de Atualização",
    "SLA",
  ]

  const rows = tickets.map((ticket) => [
    ticket.id,
    ticket.title,
    ticket.description.replace(/\n/g, " "),
    ticket.sector?.name || "Sem setor",
    ticket.status,
    ticket.priority,
    ticket.created_by_user?.name || "Desconhecido",
    ticket.assigned_to_user?.name || "Não atribuído",
    new Date(ticket.created_at).toLocaleString("pt-BR"),
    new Date(ticket.updated_at).toLocaleString("pt-BR"),
    ticket.sla_due_date
      ? new Date(ticket.sla_due_date).toLocaleString("pt-BR")
      : "Sem SLA",
  ])

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n")

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `chamados_${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Salva filtro favorito no localStorage
 */
export function saveFilterToFavorites(name: string, filters: TicketFilters): void {
  const saved = getSavedFilters()
  const newFilter = {
    id: Date.now().toString(),
    name,
    filters,
    created_at: new Date().toISOString(),
  }
  saved.push(newFilter)
  localStorage.setItem("ticket_filters_favorites", JSON.stringify(saved))
}

/**
 * Busca filtros favoritos do localStorage
 */
export function getSavedFilters(): Array<{
  id: string
  name: string
  filters: TicketFilters
  created_at: string
}> {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem("ticket_filters_favorites")
  return stored ? JSON.parse(stored) : []
}

/**
 * Remove filtro favorito
 */
export function removeSavedFilter(id: string): void {
  const saved = getSavedFilters()
  const filtered = saved.filter((f) => f.id !== id)
  localStorage.setItem("ticket_filters_favorites", JSON.stringify(filtered))
}

/**
 * Aplica filtro favorito
 */
export function applySavedFilter(id: string): TicketFilters | null {
  const saved = getSavedFilters()
  const filter = saved.find((f) => f.id === id)
  return filter ? filter.filters : null
}

