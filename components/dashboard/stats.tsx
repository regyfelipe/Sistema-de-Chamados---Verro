import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Ticket, Clock, UserCheck, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsProps {
  stats: {
    aberto: number
    em_atendimento: number
    aguardando: number
    fechado: number
  }
}

const statCards = [
  {
    label: "Abertos",
    value: "aberto",
    icon: Ticket,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    label: "Em Atendimento",
    value: "em_atendimento",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  {
    label: "Aguardando",
    value: "aguardando",
    icon: UserCheck,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    label: "Fechados",
    value: "fechado",
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
]

export function DashboardStats({ stats }: StatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => {
        const Icon = card.icon
        const count = stats[card.value as keyof typeof stats]
        
        return (
          <Card key={card.value}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.label}
              </CardTitle>
              <div className={cn("rounded-full p-2", card.bgColor)}>
                <Icon className={cn("h-4 w-4", card.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
              <p className="text-xs text-muted-foreground">
                chamados {card.value === "fechado" ? "resolvidos" : "neste status"}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

