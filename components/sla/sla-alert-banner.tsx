"use client"

import { Ticket } from "@/types"
import { checkSLAStatus, formatSLATime } from "@/lib/sla"
import { AlertTriangle, Clock, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface SLAAlertBannerProps {
  ticket: Ticket
}

export function SLAAlertBanner({ ticket }: SLAAlertBannerProps) {
  const slaStatus = checkSLAStatus(ticket)

  if (slaStatus.status === "ok") {
    return null
  }

  if (slaStatus.status === "overdue") {
    return (
      <Alert variant="destructive" className="mb-4">
        <XCircle className="h-4 w-4" />
        <AlertTitle>SLA Vencido</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            Este chamado está {formatSLATime(slaStatus.hoursOverdue || 0)} atrasado
            do prazo de SLA.
          </span>
          <Link href={`/tickets/${ticket.id}`}>
            <Button variant="outline" size="sm">
              Ver Chamado
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  if (slaStatus.status === "warning") {
    return (
      <Alert className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <AlertTitle className="text-yellow-800 dark:text-yellow-200">
          SLA Próximo do Vencimento
        </AlertTitle>
        <AlertDescription className="flex items-center justify-between text-yellow-700 dark:text-yellow-300">
          <span>
            Restam {formatSLATime(slaStatus.hoursRemaining || 0)} para o prazo de SLA
            ({slaStatus.percentage?.toFixed(0)}% restante).
          </span>
          <Link href={`/tickets/${ticket.id}`}>
            <Button variant="outline" size="sm">
              Ver Chamado
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}

