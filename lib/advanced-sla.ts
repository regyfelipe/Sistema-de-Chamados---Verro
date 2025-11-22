import { Ticket, TicketPriority } from "@/types";
import { supabase } from "./supabase";
import {
  SectorSLAConfig,
  BusinessHours,
  Holiday,
  SLAConfig,
  TicketEscalation,
  SLAPause,
} from "@/types/sla";

/**
 * Verifica se uma data é um feriado
 */
export async function isHoliday(
  date: Date,
  sectorId?: string
): Promise<boolean> {
  const dateStr = date.toISOString().split("T")[0]; 
  const day = date.getDate();
  const month = date.getMonth() + 1;

  
  let query = supabase.from("holidays").select("*").eq("date", dateStr);

  if (sectorId) {
    query = query.or(`sector_id.is.null,sector_id.eq.${sectorId}`);
  } else {
    query = query.is("sector_id", null);
  }

  const { data } = await query;

  if (data && data.length > 0) {
    return true;
  }

  
  const { data: recurring } = await supabase
    .from("holidays")
    .select("*")
    .eq("is_recurring", true);

  if (recurring) {
    for (const holiday of recurring) {
      const holidayDate = new Date(holiday.date);
      if (
        holidayDate.getDate() === day &&
        holidayDate.getMonth() + 1 === month
      ) {
        
        if (!holiday.sector_id || holiday.sector_id === sectorId) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Verifica se está dentro do horário de funcionamento
 */
export async function isBusinessHours(
  date: Date,
  sectorId?: string
): Promise<boolean> {
  const dayOfWeek = date.getDay(); 

  
  let query = supabase
    .from("business_hours")
    .select("*")
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true);

  if (sectorId) {
    query = query.or(`sector_id.is.null,sector_id.eq.${sectorId}`);
  } else {
    query = query.is("sector_id", null);
  }

  const { data } = await query;

  if (!data || data.length === 0) {
    
    return true;
  }

  
  const config = sectorId
    ? data.find((bh: BusinessHours) => bh.sector_id === sectorId) || data[0]
    : data[0];

  const now = date;
  const startTime = config.start_time.split(":");
  const endTime = config.end_time.split(":");

  const start = new Date(now);
  start.setHours(parseInt(startTime[0]), parseInt(startTime[1]), 0, 0);

  const end = new Date(now);
  end.setHours(parseInt(endTime[0]), parseInt(endTime[1]), 0, 0);

  return now >= start && now <= end;
}

/**
 * Calcula o próximo horário de funcionamento
 */
export async function getNextBusinessHour(
  date: Date,
  sectorId?: string
): Promise<Date> {
  let current = new Date(date);
  let attempts = 0;
  const maxAttempts = 14; 

  while (attempts < maxAttempts) {
    
    if (await isHoliday(current, sectorId)) {
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
      attempts++;
      continue;
    }

    
    if (await isBusinessHours(current, sectorId)) {
      return current;
    }

    
    current.setDate(current.getDate() + 1);
    current.setHours(0, 0, 0, 0);
    attempts++;
  }

  return current;
}

/**
 * Calcula horas de SLA considerando business hours e feriados
 */
export async function calculateBusinessHours(
  startDate: Date,
  hoursToAdd: number,
  sectorId?: string
): Promise<Date> {
  let current = new Date(startDate);
  let remainingHours = hoursToAdd;

  
  if (!(await isBusinessHours(current, sectorId))) {
    current = await getNextBusinessHour(current, sectorId);
  }

  while (remainingHours > 0) {
    
    if (await isHoliday(current, sectorId)) {
      current = await getNextBusinessHour(current, sectorId);
      continue;
    }

    
    if (await isBusinessHours(current, sectorId)) {
      
      const dayOfWeek = current.getDay();
      let query = supabase
        .from("business_hours")
        .select("*")
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true);

      if (sectorId) {
        query = query.or(`sector_id.is.null,sector_id.eq.${sectorId}`);
      } else {
        query = query.is("sector_id", null);
      }

      const { data } = await query;
      const config = sectorId
        ? data?.find((bh: BusinessHours) => bh.sector_id === sectorId) ||
          data?.[0]
        : data?.[0];

      if (config) {
        const endTime = config.end_time.split(":");
        const endOfDay = new Date(current);
        endOfDay.setHours(parseInt(endTime[0]), parseInt(endTime[1]), 0, 0);

        
        const hoursInDay =
          (endOfDay.getTime() - current.getTime()) / (1000 * 60 * 60);

        if (hoursInDay >= remainingHours) {
          
          current.setTime(current.getTime() + remainingHours * 60 * 60 * 1000);
          remainingHours = 0;
        } else {
          
          remainingHours -= hoursInDay;
          current = await getNextBusinessHour(
            new Date(endOfDay.getTime() + 1000),
            sectorId
          );
        }
      } else {
        
        current.setTime(current.getTime() + remainingHours * 60 * 60 * 1000);
        remainingHours = 0;
      }
    } else {
      
      current = await getNextBusinessHour(current, sectorId);
    }
  }

  return current;
}

/**
 * Obtém configuração de SLA por prioridade para um setor
 */
export async function getSLAConfigByPriority(
  sectorId: string,
  priority: TicketPriority
): Promise<number> {
  const { data } = await supabase
    .from("sector_sla_config")
    .select("sla_hours")
    .eq("sector_id", sectorId)
    .eq("priority", priority)
    .single();

  if (data) {
    return data.sla_hours;
  }

  
  const { data: sector } = await supabase
    .from("sectors")
    .select("sla_hours")
    .eq("id", sectorId)
    .single();

  return sector?.sla_hours || 24;
}

/**
 * Calcula a data de vencimento do SLA considerando todas as regras avançadas
 */
export async function calculateSLADueDate(ticket: Ticket): Promise<Date> {
  const sectorId = ticket.sector_id;
  const priority = ticket.priority;

  
  const slaHours = sectorId ? await getSLAConfigByPriority(sectorId, priority) : 24;

  
  const createdDate = new Date(ticket.created_at);
  const dueDate = await calculateBusinessHours(createdDate, slaHours, sectorId || undefined);

  return dueDate;
}

/**
 * Verifica se um ticket precisa ser escalado
 */
export async function checkEscalation(ticket: Ticket): Promise<boolean> {
  if (!ticket.sla_due_date) return false;

  const { data: config } = await supabase
    .from("sector_sla_config")
    .select("escalation_hours, escalation_to")
    .eq("sector_id", ticket.sector_id)
    .eq("priority", ticket.priority)
    .single();

  if (!config || !config.escalation_hours) return false;

  const now = new Date();
  const dueDate = new Date(ticket.sla_due_date);
  const escalationTime = new Date(
    dueDate.getTime() - config.escalation_hours * 60 * 60 * 1000
  );

  return now >= escalationTime;
}

/**
 * Escala um ticket
 */
export async function escalateTicket(
  ticketId: string,
  reason?: string
): Promise<TicketEscalation | null> {
  try {
    
    const { data: ticket } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (!ticket) return null;

    
    const { data: config } = await supabase
      .from("sector_sla_config")
      .select("escalation_to, escalation_hours")
      .eq("sector_id", ticket.sector_id)
      .eq("priority", ticket.priority)
      .single();

    if (!config || !config.escalation_to) return null;

    
    const { data: existing } = await supabase
      .from("ticket_escalations")
      .select("escalation_level")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const escalationLevel = existing ? existing.escalation_level + 1 : 1;

    
    const { data: escalation, error } = await supabase
      .from("ticket_escalations")
      .insert({
        ticket_id: ticketId,
        escalated_from: ticket.assigned_to || ticket.created_by,
        escalated_to: config.escalation_to,
        reason: reason || "SLA próximo do vencimento",
        escalation_level: escalationLevel,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao escalar ticket:", error);
      return null;
    }

    
    await supabase
      .from("tickets")
      .update({ assigned_to: config.escalation_to })
      .eq("id", ticketId);

    
    await supabase.from("ticket_history").insert({
      ticket_id: ticketId,
      user_id: ticket.created_by,
      action: "Ticket escalado",
      new_value: `Escalado para nível ${escalationLevel}`,
    });

    return escalation;
  } catch (error) {
    console.error("Erro ao escalar ticket:", error);
    return null;
  }
}

/**
 * Pausa o SLA de um ticket
 */
export async function pauseSLA(
  ticketId: string,
  reason: string
): Promise<SLAPause | null> {
  try {
    const { data: pause, error } = await supabase
      .from("sla_pauses")
      .insert({
        ticket_id: ticketId,
        paused_at: new Date().toISOString(),
        reason,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao pausar SLA:", error);
      return null;
    }

    return pause;
  } catch (error) {
    console.error("Erro ao pausar SLA:", error);
    return null;
  }
}

/**
 * Retoma o SLA de um ticket
 */
export async function resumeSLA(ticketId: string): Promise<boolean> {
  try {
    
    const { data: pause } = await supabase
      .from("sla_pauses")
      .select("*")
      .eq("ticket_id", ticketId)
      .is("resumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!pause) return false;

    
    const { error } = await supabase
      .from("sla_pauses")
      .update({ resumed_at: new Date().toISOString() })
      .eq("id", pause.id);

    if (error) {
      console.error("Erro ao retomar SLA:", error);
      return false;
    }

    
    const { data: ticket } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (ticket) {
      const newDueDate = await calculateSLADueDate(ticket as Ticket);
      await supabase
        .from("tickets")
        .update({ sla_due_date: newDueDate.toISOString() })
        .eq("id", ticketId);
    }

    return true;
  } catch (error) {
    console.error("Erro ao retomar SLA:", error);
    return false;
  }
}
