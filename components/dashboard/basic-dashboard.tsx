"use client"

import { Ticket } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Clock, AlertCircle, CheckCircle, Hourglass, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface BasicDashboardProps {
  tickets: Ticket[]
  userRole: string
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

export function BasicDashboard({ tickets, userRole }: BasicDashboardProps) {
  // Filtrar tickets abertos
  const openTickets = tickets.filter(t => t.status !== "fechado")
  const closedTickets = tickets.filter(t => t.status === "fechado")

  // Calcular tempo médio de espera
  const calculateAverageWaitTime = () => {
    if (openTickets.length === 0) return 0

    const now = new Date()
    const totalWaitTime = openTickets.reduce((acc, ticket) => {
      const created = new Date(ticket.created_at)
      const waitTime = now.getTime() - created.getTime()
      return acc + waitTime
    }, 0)

    return Math.round(totalWaitTime / openTickets.length / (1000 * 60 * 60)) 
  }

  const calculateAverageResolutionTime = () => {
    if (closedTickets.length === 0) return 0

    const totalTime = closedTickets.reduce((acc, ticket) => {
      const created = new Date(ticket.created_at)
      const closed = new Date(ticket.updated_at)
      const timeDiff = closed.getTime() - created.getTime()
      return acc + timeDiff
    }, 0)

    return Math.round(totalTime / closedTickets.length / (1000 * 60 * 60)) 
  }

  const ticketsByPriority = openTickets.reduce((acc, ticket) => {
    acc[ticket.priority] = (acc[ticket.priority] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const ticketsWithSLAWarning = openTickets.filter(ticket => {
    if (!ticket.sla_due_date) return false
    const dueDate = new Date(ticket.sla_due_date)
    const now = new Date()
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursUntilDue <= 24 && hoursUntilDue > 0 
  })

  const ticketsWithSLAExpired = openTickets.filter(ticket => {
    if (!ticket.sla_due_date) return false
    const dueDate = new Date(ticket.sla_due_date)
    const now = new Date()
    return now > dueDate
  })

  const avgWaitTime = calculateAverageWaitTime()
  const avgResolutionTime = calculateAverageResolutionTime()

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chamados Abertos</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets.length}</div>
            <p className="text-xs text-muted-foreground">
              {closedTickets.length} fechados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Espera</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgWaitTime > 0 ? `${avgWaitTime}h` : "0h"}
            </div>
            <p className="text-xs text-muted-foreground">
              Tempo médio desde criação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Resolução</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgResolutionTime > 0 ? `${avgResolutionTime}h` : "0h"}
            </div>
            <p className="text-xs text-muted-foreground">
              Para chamados fechados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas SLA</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {ticketsWithSLAWarning.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {ticketsWithSLAExpired.length} vencidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chamados por Prioridade */}
      <Card>
        <CardHeader>
          <CardTitle>Chamados Abertos por Prioridade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {Object.entries(ticketsByPriority).map(([priority, count]) => (
              <div key={priority} className="text-center">
                <Badge
                  variant="outline"
                  className={cn("text-sm mb-2", priorityColors[priority])}
                >
                  {priority}
                </Badge>
                <div className="text-2xl font-bold">{count}</div>
              </div>
            ))}
            {Object.keys(ticketsByPriority).length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full text-center">
                Nenhum chamado aberto
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chamados Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Meus Chamados Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {openTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum chamado aberto no momento
            </p>
          ) : (
            <div className="space-y-3">
              {openTickets.slice(0, 5).map((ticket) => {
                const created = new Date(ticket.created_at)
                const waitTime = formatDistanceToNow(created, {
                  addSuffix: false,
                  locale: ptBR,
                })

                return (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {ticket.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className={cn("text-xs shrink-0", priorityColors[ticket.priority])}
                          >
                            {ticket.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{ticket.sector?.name || "Sem setor"}</span>
                          <span>•</span>
                          <span>Criado há {waitTime}</span>
                          {ticket.sla_due_date && (
                            <>
                              <span>•</span>
                              <span className={cn(
                                new Date(ticket.sla_due_date) < new Date()
                                  ? "text-red-600"
                                  : "text-orange-600"
                              )}>
                                SLA: {format(new Date(ticket.sla_due_date), "dd/MM HH:mm", { locale: ptBR })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                )
              })}
              {openTickets.length > 5 && (
                <Link
                  href="/tickets"
                  className="block text-center text-sm text-primary hover:underline pt-2"
                >
                  Ver todos os {openTickets.length} chamados
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertas SLA */}
      {(ticketsWithSLAWarning.length > 0 || ticketsWithSLAExpired.length > 0) && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <AlertCircle className="h-5 w-5" />
              Alertas de SLA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ticketsWithSLAExpired.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-600 mb-2">
                    {ticketsWithSLAExpired.length} chamado(s) com SLA vencido:
                  </p>
                  <div className="space-y-1">
                    {ticketsWithSLAExpired.slice(0, 3).map((ticket) => (
                      <Link
                        key={ticket.id}
                        href={`/tickets/${ticket.id}`}
                        className="block text-sm text-red-700 hover:underline"
                      >
                        • {ticket.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {ticketsWithSLAWarning.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-orange-600 mb-2">
                    {ticketsWithSLAWarning.length} chamado(s) próximo(s) do vencimento:
                  </p>
                  <div className="space-y-1">
                    {ticketsWithSLAWarning.slice(0, 3).map((ticket) => (
                      <Link
                        key={ticket.id}
                        href={`/tickets/${ticket.id}`}
                        className="block text-sm text-orange-700 hover:underline"
                      >
                        • {ticket.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

