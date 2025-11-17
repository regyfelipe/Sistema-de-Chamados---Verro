import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, XCircle, Clock } from "lucide-react"
import { getTicketsWithSLAAlerts, formatSLATime } from "@/lib/sla"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export async function SLAAlerts() {
  const session = await getServerSession(authOptions)
  
  // Buscar dados do usuário para filtro de acesso
  let userId: string | undefined
  let userRole: string | undefined
  let userSectorId: string | undefined

  if (session?.user) {
    userId = session.user.id
    userRole = session.user.role || "solicitante"
    
    const { data: userData } = await supabase
      .from("users")
      .select("sector_id")
      .eq("id", userId)
      .single()
    
    userSectorId = userData?.sector_id
  }

  const alerts = await getTicketsWithSLAAlerts(userId, userRole, userSectorId)

  if (alerts.length === 0) {
    return null
  }

  const overdue = alerts.filter((a) => a.slaStatus.status === "overdue")
  const warnings = alerts.filter((a) => a.slaStatus.status === "warning")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          Alertas de SLA
        </CardTitle>
        <CardDescription>
          {alerts.length} chamado{alerts.length !== 1 ? "s" : ""} com SLA próximo ou vencido
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {overdue.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-destructive mb-2">
              Vencidos ({overdue.length})
            </h4>
            <div className="space-y-2">
              {overdue.map(({ ticket, slaStatus }) => (
                <Alert key={ticket.id} variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle className="text-sm">
                    #{ticket.id.slice(0, 8)} - {ticket.title}
                  </AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    <span className="text-xs">
                      {formatSLATime(slaStatus.hoursOverdue || 0)} atrasado
                    </span>
                    <Link href={`/tickets/${ticket.id}`}>
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </Link>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-yellow-600 mb-2">
              Avisos ({warnings.length})
            </h4>
            <div className="space-y-2">
              {warnings.map(({ ticket, slaStatus }) => (
                <Alert
                  key={ticket.id}
                  className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
                >
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-sm text-yellow-800 dark:text-yellow-200">
                    #{ticket.id.slice(0, 8)} - {ticket.title}
                  </AlertTitle>
                  <AlertDescription className="flex items-center justify-between text-yellow-700 dark:text-yellow-300">
                    <span className="text-xs">
                      {formatSLATime(slaStatus.hoursRemaining || 0)} restantes (
                      {slaStatus.percentage?.toFixed(0)}%)
                    </span>
                    <Link href={`/tickets/${ticket.id}`}>
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </Link>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

