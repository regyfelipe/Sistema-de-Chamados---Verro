import { supabase } from "./supabase";
import { Ticket } from "@/types";
import { checkEscalation, escalateTicket } from "./advanced-sla";
import { createNotification } from "./notifications";

/**
 * Verifica e escalar tickets que precisam de escalação
 * Esta função deve ser chamada periodicamente (ex: a cada 5 minutos)
 */
export async function checkAndEscalateTickets(): Promise<void> {
  try {
    // Buscar tickets abertos com SLA
    const { data: tickets, error } = await supabase
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
      .not("sla_due_date", "is", null);

    if (error || !tickets) {
      console.error("Erro ao buscar tickets para escalação:", error);
      return;
    }

    for (const ticket of tickets as Ticket[]) {
      try {
        const needsEscalation = await checkEscalation(ticket);

        if (needsEscalation) {
          // Verificar se já foi escalado recentemente (últimas 2 horas)
          const { data: recentEscalation } = await supabase
            .from("ticket_escalations")
            .select("*")
            .eq("ticket_id", ticket.id)
            .gte(
              "created_at",
              new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            )
            .limit(1);

          if (recentEscalation && recentEscalation.length > 0) {
            // Já foi escalado recentemente, pular
            continue;
          }

          // Escalar ticket
          const escalation = await escalateTicket(
            ticket.id,
            "SLA próximo do vencimento"
          );

          if (escalation) {
            // Notificar usuários relevantes
            const usersToNotify: string[] = [];

            // Notificar criador
            if (ticket.created_by) {
              usersToNotify.push(ticket.created_by);
            }

            // Notificar responsável anterior
            if (
              ticket.assigned_to &&
              ticket.assigned_to !== escalation.escalated_to
            ) {
              usersToNotify.push(ticket.assigned_to);
            }

            // Notificar novo responsável
            if (escalation.escalated_to) {
              usersToNotify.push(escalation.escalated_to);
            }

            // Criar notificações
            for (const userId of usersToNotify) {
              await createNotification({
                user_id: userId,
                type: "ticket_assigned",
                title: "Ticket escalado",
                message: `O ticket "${ticket.title}" foi escalado para nível ${escalation.escalation_level}`,
                ticket_id: ticket.id,
              });
            }

            console.log(`✅ Ticket ${ticket.id} escalado com sucesso`);
          }
        }
      } catch (error) {
        console.error(`Erro ao processar ticket ${ticket.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Erro ao verificar escalações:", error);
  }
}

/**
 * API Route handler para verificação de escalação
 * Pode ser chamado por um cron job ou webhook
 */
export async function handleEscalationCheck() {
  await checkAndEscalateTickets();
  return { success: true, message: "Escalação verificada" };
}
