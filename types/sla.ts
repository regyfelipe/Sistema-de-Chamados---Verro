export interface SectorSLAConfig {
  id: string;
  sector_id: string;
  priority: "baixa" | "media" | "alta" | "critica";
  sla_hours: number;
  escalation_hours?: number;
  escalation_to?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessHours {
  id: string;
  sector_id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  sector_id?: string;
  is_recurring: boolean;
  created_at: string;
}

export interface TicketEscalation {
  id: string;
  ticket_id: string;
  escalated_from?: string;
  escalated_to?: string;
  reason?: string;
  escalation_level: number;
  created_at: string;
}

export interface SLAPause {
  id: string;
  ticket_id: string;
  paused_at: string;
  resumed_at?: string;
  reason?: string;
  created_at: string;
}

export interface SLAConfig {
  businessHours: BusinessHours[];
  holidays: Holiday[];
  slaByPriority: Record<string, number>;
  escalationConfig?: {
    hours: number;
    escalateTo?: string;
  };
}
