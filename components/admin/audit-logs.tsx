"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AuditLog,
  AuditActionType,
  AuditEntityType,
  AuditSeverity,
  AuditFilters,
} from "@/types/audit"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Search, Download, Filter, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { exportAuditLogsToCSV } from "@/lib/audit"

const actionTypeLabels: Record<AuditActionType, string> = {
  create: "Criar",
  update: "Atualizar",
  delete: "Deletar",
  view: "Visualizar",
  login: "Login",
  logout: "Logout",
  export: "Exportar",
  import: "Importar",
  assign: "Atribuir",
  unassign: "Desatribuir",
  status_change: "Mudar Status",
  priority_change: "Mudar Prioridade",
  comment: "Comentar",
  attachment_upload: "Upload Anexo",
  attachment_delete: "Deletar Anexo",
  user_create: "Criar Usuário",
  user_update: "Atualizar Usuário",
  user_delete: "Deletar Usuário",
  sector_create: "Criar Setor",
  sector_update: "Atualizar Setor",
  sector_delete: "Deletar Setor",
  config_change: "Mudar Config",
  bulk_operation: "Operação em Massa",
}

const severityColors: Record<AuditSeverity, string> = {
  info: "bg-blue-100 text-blue-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
}

export function AuditLogs() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<AuditFilters>({})
  const [showFilters, setShowFilters] = useState(false)

  const limit = 50

  useEffect(() => {
    loadLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/audit/logs?${new URLSearchParams({
          ...Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v !== undefined && v !== "")
          ),
          page: page.toString(),
          limit: limit.toString(),
        })}`
      )
      const data = await response.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar logs de auditoria",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const csv = await exportAuditLogsToCSV(filters)
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `audit-logs-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Sucesso",
        description: "Logs exportados com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar logs",
        variant: "destructive",
      })
    }
  }

  const clearFilters = () => {
    setFilters({})
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Logs de Auditoria</h2>
          <p className="text-muted-foreground">
            Registro completo de todas as ações no sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar em descrição..."
                    value={filters.search || ""}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Ação</label>
                <Select
                  value={filters.action_type || "all"}
                  onValueChange={(v) =>
                    setFilters({ ...filters, action_type: v === "all" ? undefined : (v as AuditActionType) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(actionTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Severidade</label>
                <Select
                  value={filters.severity || "all"}
                  onValueChange={(v) =>
                    setFilters({ ...filters, severity: v === "all" ? undefined : (v as AuditSeverity) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data Inicial</label>
                <Input
                  type="date"
                  value={filters.date_from || ""}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data Final</label>
                <Input
                  type="date"
                  value={filters.date_to || ""}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                />
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Logs ({total} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum log encontrado
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Severidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell>
                          {log.user?.name || log.user?.email || "Sistema"}
                        </TableCell>
                        <TableCell>{actionTypeLabels[log.action_type] || log.action_type}</TableCell>
                        <TableCell>{log.entity_type}</TableCell>
                        <TableCell className="max-w-md truncate">{log.description}</TableCell>
                        <TableCell>
                          <Badge className={severityColors[log.severity]}>
                            {log.severity}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * limit >= total}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

