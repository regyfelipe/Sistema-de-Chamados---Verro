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
      supabase.from("users").select("id, name"),
      supabase.from("sectors").select("id, name"),
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros do Kanban
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={groupBy} onValueChange={onGroupByChange}>
              <SelectTrigger className="w-[180px]">
                <Layers className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Agrupar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem agrupamento</SelectItem>
                <SelectItem value="sector">Por Setor</SelectItem>
                <SelectItem value="priority">Por Prioridade</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Buscar por título ou descrição..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="col-span-full sm:col-span-1 lg:col-span-2"
          />

          <Select
            value={filters.priority}
            onValueChange={(value) => handleFilterChange("priority", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Prioridades</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="critica">Crítica</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sector_id}
            onValueChange={(value) => handleFilterChange("sector_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Setores</SelectItem>
              {sectors.map((sector) => (
                <SelectItem key={sector.id} value={sector.id}>
                  {sector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.assigned_to}
            onValueChange={(value) => handleFilterChange("assigned_to", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Atribuído a" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="none">Não Atribuído</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
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

