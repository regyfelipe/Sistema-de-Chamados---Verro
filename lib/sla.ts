import { Ticket } from "@/types";
import { supabase } from "./supabase";
import { calculateSLADueDate, getSLAConfigByPriority } from "./advanced-sla";

/**
 * Verifica se um chamado está próximo do SLA ou vencido
 */
export async function checkSLAStatus(ticket: Ticket): Promise<{
  status: "ok" | "warning" | "overdue";
  hoursRemaining?: number;
  hoursOverdue?: number;
  percentage?: number;
}> {
  if (!ticket.sla_due_date) {
    return { status: "ok" };
  }

  const now = new Date();
  const dueDate = new Date(ticket.sla_due_date);
  const diffMs = dueDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  
  if (diffHours < 0) {
    return {
      status: "overdue",
      hoursOverdue: Math.abs(diffHours),
    };
  }

  
  
  let totalHours = ticket.sector?.sla_hours || 24;
  if (ticket.sector_id && ticket.priority) {
    try {
      totalHours = await getSLAConfigByPriority(
        ticket.sector_id,
        ticket.priority
      );
    } catch (error) {
      
    }
  }
  const percentage = (diffHours / totalHours) * 100;

  if (percentage < 25) {
    return {
      status: "warning",
      hoursRemaining: diffHours,
      percentage,
    };
  }

  return {
    status: "ok",
    hoursRemaining: diffHours,
    percentage,
  };
}

/**
 * Obtém chamados com SLA próximo ou vencido (com filtro de acesso)
 */
export async function getTicketsWithSLAAlerts(
  userId?: string,
  userRole?: string,
  userSectorId?: string
) {
  
  let tickets: any[] = []

  if (userId && userRole) {
    const { getTicketsWithAccess } = await import("./ticket-access")
    const allTickets = await getTicketsWithAccess(userId, userRole, userSectorId)
    
    tickets = allTickets.filter(
      (t: any) =>
        ["aberto", "em_atendimento", "aguardando"].includes(t.status) &&
        t.sla_due_date
    )
  } else {
    
    const { data, error } = await supabase
      .from("tickets")
      .select(
        `
        *,
        sector:sectors(*),
        created_by_user:users!tickets_created_by_fkey(*),
        assigned_to_user:users!tickets_assigned_to_fkey(*)
      `
      )
      .in("status", ["aberto", "em_atendimento", "aguardando"])
      .not("sla_due_date", "is", null)

    if (error || !data) {
      return []
    }

    tickets = data
  }

  const alerts = await Promise.all(
    tickets.map(async (ticket: any) => {
      const slaStatus = await checkSLAStatus(ticket as Ticket)
      return {
        ticket,
        slaStatus,
      }
    })
  )

  return alerts.filter((item: any) => item.slaStatus.status !== "ok")
}

/**
 * Formata o tempo restante do SLA
 */
export function formatSLATime(hours: number): string {
  if (hours < 1) {
    const minutes = Math.floor(hours * 60);
    return `${minutes} min`;
  } else if (hours < 24) {
    return `${Math.floor(hours)}h`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    if (remainingHours === 0) {
      return `${days}d`;
    }
    return `${days}d ${remainingHours}h`;
  }
}

/**
 * Obtém o status do SLA (ok, warning, expired)
 */
export function getSLAStatus(slaDueDate: string): "ok" | "warning" | "expired" {
  const now = new Date();
  const dueDate = new Date(slaDueDate);
  const diffMs = dueDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  
  if (diffHours < 0) {
    return "expired";
  }

  
  if (diffHours < 2) {
    return "warning";
  }

  return "ok";
}
