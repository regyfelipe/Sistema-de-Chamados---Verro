"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Filter, X, Layers } from "lucide-react"
import { TicketFilters } from "@/types/filters"
import { supabase } from "@/lib/supabase"
import { User, Sector } from "@/types"
import { Badge } from "@/components/ui/badge"

interface KanbanFiltersProps {
  filters: TicketFilters
  onFiltersChange: (filters: TicketFilters) => void
  groupBy: "none" | "sector" | "priority"
  onGroupByChange: (groupBy: "none" | "sector" | "priority") => void
}

export function KanbanFilters({
  filters,
  onFiltersChange,
  groupBy,
  onGroupByChange,
}: KanbanFiltersProps) {
  const [users, setUsers] = useState<User[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])

  useEffect(() => {
    fetchUsersAndSectors()
  }, [])

  const fetchUsersAndSectors = async () => {
    const [{ data: usersData }, { data: sectorsData }] = await Promise.all([
      supabase.from("users").select("*"),
      supabase.from("sectors").select("*"),
    ])
    setUsers(usersData || [])
    setSectors(sectorsData || [])
  }

  const handleFilterChange = (key: keyof TicketFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const handleClearFilters = () => {
    onFiltersChange({
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
  }

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "dateFilterType") return value !== "none"
    if (key === "dateFrom" || key === "dateTo") return false
    return value !== "all" && value !== "" && value !== "none"
  }).length

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Filtros do Kanban</span>
            <span className="sm:hidden">Filtros</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <Select value={groupBy} onValueChange={onGroupByChange}>
              <SelectTrigger className="w-full sm:w-[140px] md:w-[180px] h-8 sm:h-10 text-xs sm:text-sm">
                <Layers className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <SelectValue placeholder="Agrupar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-sm">Sem agrupamento</SelectItem>
                <SelectItem value="sector" className="text-sm">Por Setor</SelectItem>
                <SelectItem value="priority" className="text-sm">Por Prioridade</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearFilters}
              className="h-8 sm:h-10 text-xs sm:text-sm px-2 sm:px-3"
            >
              <X className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Limpar</span>
              <span className="sm:hidden">X</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        <div className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Buscar por título ou descrição..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="col-span-full sm:col-span-1 lg:col-span-2 h-8 sm:h-10 text-xs sm:text-sm"
          />

          <Select
            value={filters.priority}
            onValueChange={(value) => handleFilterChange("priority", value)}
          >
            <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-sm">Todas as Prioridades</SelectItem>
              <SelectItem value="baixa" className="text-sm">Baixa</SelectItem>
              <SelectItem value="media" className="text-sm">Média</SelectItem>
              <SelectItem value="alta" className="text-sm">Alta</SelectItem>
              <SelectItem value="critica" className="text-sm">Crítica</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sector_id}
            onValueChange={(value) => handleFilterChange("sector_id", value)}
          >
            <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-sm">Todos os Setores</SelectItem>
              {sectors.map((sector) => (
                <SelectItem key={sector.id} value={sector.id} className="text-sm">
                  {sector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.assigned_to}
            onValueChange={(value) => handleFilterChange("assigned_to", value)}
          >
            <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Atribuído a" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-sm">Todos</SelectItem>
              <SelectItem value="none" className="text-sm">Não Atribuído</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id} className="text-sm">
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

