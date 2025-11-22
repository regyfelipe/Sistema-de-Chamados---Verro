"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Filter,
  X,
  Calendar,
  User,
  Download,
  Star,
  Trash2,
  Search,
} from "lucide-react"
import { TicketFilters, defaultFilters } from "@/types/filters"
import { supabase } from "@/lib/supabase"
import { User as UserType, Sector } from "@/types"
import {
  saveFilterToFavorites,
  getSavedFilters,
  removeSavedFilter,
  applySavedFilter,
} from "@/lib/filter-utils"
import { saveSearchToHistory } from "@/lib/search-history"
import { useToast } from "@/components/ui/use-toast"

interface AdvancedFiltersProps {
  filters: TicketFilters
  onFiltersChange: (filters: TicketFilters) => void
  onExport?: () => void
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  onExport,
}: AdvancedFiltersProps) {
  const { toast } = useToast()
  const [isExpanded, setIsExpanded] = useState(false)
  const [sectors, setSectors] = useState<Sector[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [savedFilters, setSavedFilters] = useState(getSavedFilters())
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [filterName, setFilterName] = useState("")

  useEffect(() => {
    loadSectors()
    loadUsers()
  }, [])

  const loadSectors = async () => {
    const { data } = await supabase.from("sectors").select("*").order("name")
    if (data) setSectors(data)
  }

  const loadUsers = async () => {
    const { data } = await supabase.from("users").select("*").order("name")
    if (data) setUsers(data)
  }

  const updateFilter = (key: keyof TicketFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const resetFilters = () => {
    onFiltersChange(defaultFilters)
    toast({
      title: "Filtros resetados",
      description: "Todos os filtros foram limpos",
    })
  }

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para o filtro",
        variant: "destructive",
      })
      return
    }

    saveFilterToFavorites(filterName, filters)
    setSavedFilters(getSavedFilters())
    setFilterName("")
    setSaveDialogOpen(false)
    toast({
      title: "Filtro salvo",
      description: `Filtro "${filterName}" foi salvo com sucesso`,
    })
  }

  const handleLoadFilter = (id: string) => {
    const savedFilter = applySavedFilter(id)
    if (savedFilter) {
      onFiltersChange(savedFilter)
      toast({
        title: "Filtro aplicado",
        description: "Filtro favorito foi aplicado",
      })
    }
  }

  const handleDeleteFilter = (id: string) => {
    removeSavedFilter(id)
    setSavedFilters(getSavedFilters())
    toast({
      title: "Filtro removido",
      description: "Filtro favorito foi removido",
    })
  }

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "dateFilterType") return value !== "none"
    if (key === "dateFrom" || key === "dateTo") return false
    return value !== "all" && value !== ""
  }).length

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Filtros Avançados</span>
            <span className="sm:hidden">Filtros</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">{activeFiltersCount}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            {savedFilters.length > 0 && (
              <Select
                value=""
                onValueChange={(value) => {
                  if (value.startsWith("load:")) {
                    handleLoadFilter(value.replace("load:", ""))
                  } else if (value.startsWith("delete:")) {
                    handleDeleteFilter(value.replace("delete:", ""))
                  }
                }}
              >
                <SelectTrigger className="w-[140px] sm:w-[180px] h-8 sm:h-9 text-xs sm:text-sm">
                  <Star className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <SelectValue placeholder="Filtros salvos" />
                </SelectTrigger>
                <SelectContent>
                  {savedFilters.map((saved) => (
                    <SelectItem key={`load-${saved.id}`} value={`load:${saved.id}`}>
                      {saved.name}
                    </SelectItem>
                  ))}
                  {savedFilters.length > 0 && savedFilters.map((saved) => (
                    <SelectItem
                      key={`delete-${saved.id}`}
                      value={`delete:${saved.id}`}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4 inline" />
                      Excluir: {saved.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
                  <Star className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Salvar Filtro</span>
                  <span className="sm:hidden">Salvar</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:w-full max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">Salvar Filtro Favorito</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Digite um nome para salvar este conjunto de filtros
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="filter-name" className="text-xs sm:text-sm">Nome do Filtro</Label>
                    <Input
                      id="filter-name"
                      placeholder="Ex: Chamados críticos do mês"
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)} className="w-full sm:w-auto text-xs sm:text-sm">
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveFilter} className="w-full sm:w-auto text-xs sm:text-sm">Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport} className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
                <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Exportar</span>
                <span className="sm:hidden">Exp</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
              <X className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Limpar</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
            >
              {isExpanded ? (
                <>
                  <span className="hidden sm:inline">Recolher</span>
                  <span className="sm:hidden">Rec</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Expandir</span>
                  <span className="sm:hidden">Exp</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
       
        <div className="relative">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, descrição, ID, setor..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-8 sm:pl-10 text-xs sm:text-sm h-8 sm:h-9"
          />
        </div>

       
        <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
          <div className="space-y-1 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Status</Label>
            <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
              <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                <SelectItem value="aguardando">Aguardando</SelectItem>
                <SelectItem value="fechado">Fechado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Prioridade</Label>
            <Select
              value={filters.priority}
              onValueChange={(v) => updateFilter("priority", v)}
            >
              <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Setor</Label>
            <Select
              value={filters.sector_id}
              onValueChange={(v) => updateFilter("sector_id", v)}
            >
              <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {sectors.map((sector) => (
                  <SelectItem key={sector.id} value={sector.id}>
                    {sector.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label className="text-xs sm:text-sm">SLA</Label>
            <Select
              value={filters.slaStatus}
              onValueChange={(v) => updateFilter("slaStatus", v as any)}
            >
              <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ok">No Prazo</SelectItem>
                <SelectItem value="warning">Atenção</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

       
        {isExpanded && (
          <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t">
            <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Criado por</Label>
                <Select
                  value={filters.created_by}
                  onValueChange={(v) => updateFilter("created_by", v)}
                >
                  <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Atribuído a</Label>
                <Select
                  value={filters.assigned_to}
                  onValueChange={(v) => updateFilter("assigned_to", v)}
                >
                  <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="unassigned">Não atribuído</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

           
            <div className="space-y-1 sm:space-y-2">
              <Label className="flex items-center gap-2 text-xs sm:text-sm">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Filtrar por Data
              </Label>
              <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
                <Select
                  value={filters.dateFilterType}
                  onValueChange={(v) => updateFilter("dateFilterType", v as any)}
                >
                  <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não filtrar</SelectItem>
                    <SelectItem value="created">Data de Criação</SelectItem>
                    <SelectItem value="updated">Data de Atualização</SelectItem>
                    <SelectItem value="sla">Prazo SLA</SelectItem>
                  </SelectContent>
                </Select>
                {filters.dateFilterType !== "none" && (
                  <>
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => updateFilter("dateFrom", e.target.value)}
                      placeholder="Data inicial"
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    />
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => updateFilter("dateTo", e.target.value)}
                      placeholder="Data final"
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

