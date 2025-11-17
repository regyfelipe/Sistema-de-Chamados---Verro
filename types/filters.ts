export interface TicketFilters {
  search: string
  status: string
  priority: string
  sector_id: string
  created_by: string
  assigned_to: string
  dateFilterType: "created" | "updated" | "sla" | "none"
  dateFrom: string
  dateTo: string
  slaStatus: "all" | "ok" | "warning" | "overdue"
}

export interface SavedFilter {
  id: string
  name: string
  filters: TicketFilters
  created_at: string
}

export const defaultFilters: TicketFilters = {
  search: "",
  status: "all",
  priority: "all",
  sector_id: "all",
  created_by: "all",
  assigned_to: "all",
  dateFilterType: "none",
  dateFrom: "",
  dateTo: "",
  slaStatus: "all",
}

