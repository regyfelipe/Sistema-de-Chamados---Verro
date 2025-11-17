"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TopAttendant } from "@/lib/dashboard-stats"
import { Trophy, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TopAttendantsProps {
  attendants: TopAttendant[]
}

export function TopAttendants({ attendants }: TopAttendantsProps) {
  if (attendants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Atendentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    )
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return "🥇"
    if (index === 1) return "🥈"
    if (index === 2) return "🥉"
    return `${index + 1}º`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Top 5 Atendentes Mais Produtivos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {attendants.map((attendant, index) => (
            <div
              key={attendant.user_id}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold">
                  {getRankIcon(index)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">{attendant.user_name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tempo médio: {attendant.avg_resolution_time}h
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-sm">
                {attendant.tickets_closed} chamados
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

