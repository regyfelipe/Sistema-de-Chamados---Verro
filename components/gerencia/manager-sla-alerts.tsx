"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { Ticket } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ManagerSLAAlertsProps {
  tickets: Ticket[];
}

export function ManagerSLAAlerts({ tickets }: ManagerSLAAlertsProps) {
  const now = new Date();
  
  // Chamados vencidos
  const overdue = tickets.filter((ticket) => {
    if (!ticket.sla_due_date || ticket.status === "fechado") return false;
    return new Date(ticket.sla_due_date) < now;
  });

  // Chamados próximos do vencimento (próximas 2 horas)
  const warning = tickets.filter((ticket) => {
    if (!ticket.sla_due_date || ticket.status === "fechado") return false;
    const dueDate = new Date(ticket.sla_due_date);
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilDue > 0 && hoursUntilDue <= 2;
  });

  // Chamados críticos sem atendente
  const criticalUnassigned = tickets.filter(
    (ticket) =>
      (ticket.priority === "critica" || ticket.priority === "alta") &&
      ticket.status === "aberto" &&
      !ticket.assigned_to
  );

  if (overdue.length === 0 && warning.length === 0 && criticalUnassigned.length === 0) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            Alertas e Ações Prioritárias
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="text-center py-6 sm:py-8">
            <CheckCircle2 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-green-500 mb-3" />
            <p className="text-sm sm:text-base text-muted-foreground">
              Nenhum alerta crítico no momento
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
          Alertas e Ações Prioritárias
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
        {/* Chamados Vencidos */}
        {overdue.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <h3 className="font-semibold text-sm sm:text-base text-red-600">
                Chamados Vencidos ({overdue.length})
              </h3>
            </div>
            <div className="space-y-2">
              {overdue.slice(0, 5).map((ticket) => {
                const hoursOverdue = Math.round(
                  (now.getTime() - new Date(ticket.sla_due_date!).getTime()) / (1000 * 60 * 60)
                );
                return (
                  <div
                    key={ticket.id}
                    className="p-2 sm:p-3 rounded-lg border border-red-200 bg-red-50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{ticket.title}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Setor: {ticket.sector?.name || "Sem setor"}
                        </p>
                      </div>
                      <Badge variant="destructive" className="text-[10px] sm:text-xs shrink-0">
                        {hoursOverdue}h atrasado
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {overdue.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{overdue.length - 5} chamados vencidos
                </p>
              )}
            </div>
          </div>
        )}

        {/* Chamados Próximos do Vencimento */}
        {warning.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <h3 className="font-semibold text-sm sm:text-base text-orange-600">
                Próximos do Vencimento ({warning.length})
              </h3>
            </div>
            <div className="space-y-2">
              {warning.slice(0, 5).map((ticket) => {
                const hoursUntilDue = Math.round(
                  (new Date(ticket.sla_due_date!).getTime() - now.getTime()) / (1000 * 60 * 60)
                );
                return (
                  <div
                    key={ticket.id}
                    className="p-2 sm:p-3 rounded-lg border border-orange-200 bg-orange-50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{ticket.title}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Setor: {ticket.sector?.name || "Sem setor"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] sm:text-xs border-orange-300 text-orange-700 shrink-0">
                        {hoursUntilDue}h restantes
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {warning.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{warning.length - 5} chamados próximos do vencimento
                </p>
              )}
            </div>
          </div>
        )}

        {/* Chamados Críticos sem Atendente */}
        {criticalUnassigned.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <h3 className="font-semibold text-sm sm:text-base text-red-600">
                Críticos sem Atendente ({criticalUnassigned.length})
              </h3>
            </div>
            <div className="space-y-2">
              {criticalUnassigned.slice(0, 5).map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-2 sm:p-3 rounded-lg border border-red-200 bg-red-50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{ticket.title}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Setor: {ticket.sector?.name || "Sem setor"}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "text-[10px] sm:text-xs shrink-0",
                        ticket.priority === "critica"
                          ? "bg-red-500 text-white"
                          : "bg-orange-500 text-white"
                      )}
                    >
                      {ticket.priority === "critica" ? "Crítica" : "Alta"}
                    </Badge>
                  </div>
                </div>
              ))}
              {criticalUnassigned.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{criticalUnassigned.length - 5} chamados críticos sem atendente
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

