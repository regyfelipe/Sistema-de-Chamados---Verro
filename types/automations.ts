export type AutomationTrigger =
  | "ticket_created"
  | "ticket_updated"
  | "status_changed"
  | "comment_added"
  | "sla_warning"
  | "sla_expired"
  | "no_response_days";

export type AutomationConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "in"
  | "not_in";

export interface AutomationCondition {
  field: string; // Ex: "title", "description", "priority", "sector_id"
  operator: AutomationConditionOperator;
  value: any;
}

export type AutomationActionType =
  | "assign_ticket"
  | "change_priority"
  | "change_status"
  | "add_tag"
  | "send_notification"
  | "close_ticket"
  | "add_comment";

export interface AutomationAction {
  type: AutomationActionType;
  params: Record<string, any>; // Parâmetros específicos da ação
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger_event: AutomationTrigger;
  is_active: boolean;
  priority: number;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AutomationLog {
  id: string;
  rule_id: string;
  ticket_id?: string;
  status: "success" | "failed" | "skipped";
  message?: string;
  executed_at: string;
  rule?: AutomationRule;
  ticket?: any;
}

