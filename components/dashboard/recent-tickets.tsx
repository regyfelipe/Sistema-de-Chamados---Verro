import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Ticket } from "@/types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface RecentTicketsProps {
  tickets: Ticket[]
}

const statusLabels: Record<string, string> = {
  aberto: "Aberto",
  em_atendimento: "Em Atendimento",
  aguardando: "Aguardando",
  fechado: "Fechado",
}

const priorityColors: Record<string, string> = {
  baixa: "bg-gray-100 text-gray-800",
  media: "bg-blue-100 text-blue-800",
  alta: "bg-orange-100 text-orange-800",
  critica: "bg-red-100 text-red-800",
}

export function RecentTickets({ tickets }: RecentTicketsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chamados Recentes</CardTitle>
        <CardDescription>
          Últimos chamados criados no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum chamado encontrado
          </p>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{ticket.title}</h3>
                      <Badge
                        variant="outline"
                        className={priorityColors[ticket.priority]}
                      >
                        {ticket.priority}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {statusLabels[ticket.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {ticket.sector?.name || "Sem setor"}
                      </span>
                      <span>•</span>
                      <span>
                        {format(new Date(ticket.created_at), "dd MMM yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-6">
          <Link href="/tickets">
            <Button variant="outline" className="w-full">
              Ver todos os chamados
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

