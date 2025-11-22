import { supabase } from "./supabase";
import { Ticket } from "@/types";
import {
  AutomationRule,
  AutomationCondition,
  AutomationAction,
  AutomationTrigger,
} from "@/types/automations";
import { createNotification } from "./notifications";

/**
 * Avalia uma condição contra um ticket
 */
function evaluateCondition(
  condition: AutomationCondition,
  ticket: Ticket
): boolean {
  const fieldValue = (ticket as any)[condition.field];
  const conditionValue = condition.value;

  switch (condition.operator) {
    case "equals":
      return fieldValue === conditionValue;
    case "not_equals":
      return fieldValue !== conditionValue;
    case "contains":
      return (
        String(fieldValue || "")
          .toLowerCase()
          .includes(String(conditionValue).toLowerCase()) ||
        String(ticket.title || "")
          .toLowerCase()
          .includes(String(conditionValue).toLowerCase()) ||
        String(ticket.description || "")
          .toLowerCase()
          .includes(String(conditionValue).toLowerCase())
      );
    case "not_contains":
      return !String(fieldValue || "")
        .toLowerCase()
        .includes(String(conditionValue).toLowerCase());
    case "starts_with":
      return String(fieldValue || "").startsWith(String(conditionValue));
    case "ends_with":
      return String(fieldValue || "").endsWith(String(conditionValue));
    case "greater_than":
      return Number(fieldValue) > Number(conditionValue);
    case "less_than":
      return Number(fieldValue) < Number(conditionValue);
    case "in":
      return Array.isArray(conditionValue)
        ? conditionValue.includes(fieldValue)
        : false;
    case "not_in":
      return Array.isArray(conditionValue)
        ? !conditionValue.includes(fieldValue)
        : true;
    default:
      return false;
  }
}

/**
 * Avalia todas as condições de uma regra
 */
function evaluateConditions(
  conditions: AutomationCondition[],
  ticket: Ticket
): boolean {
  if (conditions.length === 0) return true;

  
  return conditions.every((condition) => evaluateCondition(condition, ticket));
}

/**
 * Executa uma ação de automação
 */
async function executeAction(
  action: AutomationAction,
  ticket: Ticket
): Promise<{ success: boolean; message?: string }> {
  try {
    switch (action.type) {
      case "assign_ticket": {
        const userId = action.params.user_id;
        if (!userId) {
          return { success: false, message: "user_id não especificado" };
        }

        const { error } = await supabase
          .from("tickets")
          .update({ assigned_to: userId })
          .eq("id", ticket.id);

        if (error) throw error;

       
        await supabase.from("ticket_history").insert({
          ticket_id: ticket.id,
          user_id: userId,
          action: "Atribuído automaticamente",
          new_value: userId,
        });

       
        await createNotification({
          user_id: userId,
          type: "ticket_assigned",
          title: "Chamado atribuído automaticamente",
          message: `O chamado "${ticket.title}" foi atribuído a você automaticamente`,
          ticket_id: ticket.id,
        });

        return { success: true, message: `Ticket atribuído a ${userId}` };
      }

      case "change_priority": {
        const priority = action.params.priority;
        if (!priority) {
          return { success: false, message: "priority não especificada" };
        }

        const { error } = await supabase
          .from("tickets")
          .update({ priority })
          .eq("id", ticket.id);

        if (error) throw error;

        await supabase.from("ticket_history").insert({
          ticket_id: ticket.id,
          user_id: ticket.created_by,
          action: "Prioridade alterada automaticamente",
          old_value: ticket.priority,
          new_value: priority,
        });

        return { success: true, message: `Prioridade alterada para ${priority}` };
      }

      case "change_status": {
        const status = action.params.status;
        if (!status) {
          return { success: false, message: "status não especificado" };
        }

        const { error } = await supabase
          .from("tickets")
          .update({ status })
          .eq("id", ticket.id);

        if (error) throw error;

        await supabase.from("ticket_history").insert({
          ticket_id: ticket.id,
          user_id: ticket.created_by,
          action: "Status alterado automaticamente",
          old_value: ticket.status,
          new_value: status,
        });

        return { success: true, message: `Status alterado para ${status}` };
      }

      case "send_notification": {
        const userIds = action.params.user_ids || [];
        const title = action.params.title || "Notificação automática";
        const message = action.params.message || `Chamado: ${ticket.title}`;

        for (const userId of userIds) {
          await createNotification({
            user_id: userId,
            type: "ticket_created",
            title,
            message,
            ticket_id: ticket.id,
          });
        }

        return {
          success: true,
          message: `Notificações enviadas para ${userIds.length} usuários`,
        };
      }

      case "close_ticket": {
        const { error } = await supabase
          .from("tickets")
          .update({ status: "fechado" })
          .eq("id", ticket.id);

        if (error) throw error;

        await supabase.from("ticket_history").insert({
          ticket_id: ticket.id,
          user_id: ticket.created_by,
          action: "Chamado fechado automaticamente",
          old_value: ticket.status,
          new_value: "fechado",
        });

        return { success: true, message: "Ticket fechado automaticamente" };
      }

      case "add_comment": {
        const content = action.params.content;
        if (!content) {
          return { success: false, message: "content não especificado" };
        }

        const userId = action.params.user_id || ticket.created_by;

        const { error } = await supabase.from("comments").insert({
          ticket_id: ticket.id,
          user_id: userId,
          content,
          is_internal: action.params.is_internal || false,
        });

        if (error) throw error;

        return { success: true, message: "Comentário adicionado automaticamente" };
      }

      default:
        return { success: false, message: `Ação desconhecida: ${action.type}` };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Executa uma regra de automação
 */
export async function executeRule(
  rule: AutomationRule,
  ticket: Ticket
): Promise<{ executed: boolean; message?: string }> {
  try {
   
    if (!rule.is_active) {
      await logAutomationExecution(rule.id, ticket.id, "skipped", "Regra inativa");
      return { executed: false, message: "Regra inativa" };
    }

   
    const conditionsMet = evaluateConditions(rule.conditions, ticket);

    if (!conditionsMet) {
      await logAutomationExecution(
        rule.id,
        ticket.id,
        "skipped",
        "Condições não atendidas"
      );
      return { executed: false, message: "Condições não atendidas" };
    }

   
    const results = await Promise.all(
      rule.actions.map((action) => executeAction(action, ticket))
    );

    const allSuccess = results.every((r) => r.success);
    const messages = results.map((r) => r.message).filter(Boolean).join("; ");

    await logAutomationExecution(
      rule.id,
      ticket.id,
      allSuccess ? "success" : "failed",
      messages || "Ações executadas"
    );

    return {
      executed: allSuccess,
      message: messages || "Regra executada com sucesso",
    };
  } catch (error: any) {
    await logAutomationExecution(
      rule.id,
      ticket.id,
      "failed",
      error.message || "Erro ao executar regra"
    );
    return { executed: false, message: error.message };
  }
}

/**
 * Busca e executa regras para um evento
 */
export async function triggerAutomations(
  triggerEvent: AutomationTrigger,
  ticket: Ticket
): Promise<void> {
  try {
   
    const { data: rules, error } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("trigger_event", triggerEvent)
      .eq("is_active", true)
      .order("priority", { ascending: true });

    if (error) {
      console.error("Erro ao buscar regras:", error);
      return;
    }

    if (!rules || rules.length === 0) {
      return;
    }

   
    for (const rule of rules) {
      try {
        await executeRule(rule as AutomationRule, ticket);
      } catch (error) {
        console.error(`Erro ao executar regra ${rule.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Erro ao disparar automações:", error);
  }
}

/**
 * Registra execução de automação
 */
async function logAutomationExecution(
  ruleId: string,
  ticketId: string | undefined,
  status: "success" | "failed" | "skipped",
  message?: string
): Promise<void> {
  try {
    await supabase.from("automation_logs").insert({
      rule_id: ruleId,
      ticket_id: ticketId,
      status,
      message,
    });
  } catch (error) {
    console.error("Erro ao registrar log de automação:", error);
  }
}

/**
 * Verifica tickets sem resposta e fecha automaticamente
 */
export async function checkTicketsWithoutResponse(days: number = 7): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

   
    const { data: tickets, error } = await supabase
      .from("tickets")
      .select("*")
      .in("status", ["aberto", "em_atendimento", "aguardando"])
      .lt("updated_at", cutoffDate.toISOString());

    if (error || !tickets) {
      console.error("Erro ao buscar tickets sem resposta:", error);
      return;
    }

   
    const { data: rules } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("trigger_event", "no_response_days")
      .eq("is_active", true);

    if (rules && rules.length > 0) {
      for (const ticket of tickets) {
        for (const rule of rules) {
          await executeRule(rule as AutomationRule, ticket as Ticket);
        }
      }
    }
  } catch (error) {
    console.error("Erro ao verificar tickets sem resposta:", error);
  }
}

