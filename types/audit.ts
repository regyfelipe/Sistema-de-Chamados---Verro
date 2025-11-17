export type AuditActionType =
  | "create"
  | "update"
  | "delete"
  | "view"
  | "login"
  | "logout"
  | "export"
  | "import"
  | "assign"
  | "unassign"
  | "status_change"
  | "priority_change"
  | "comment"
  | "attachment_upload"
  | "attachment_delete"
  | "user_create"
  | "user_update"
  | "user_delete"
  | "sector_create"
  | "sector_update"
  | "sector_delete"
  | "config_change"
  | "bulk_operation"

export type AuditEntityType =
  | "ticket"
  | "user"
  | "sector"
  | "comment"
  | "attachment"
  | "notification"
  | "automation"
  | "sla_config"
  | "system"

export type AuditSeverity = "info" | "warning" | "error" | "critical"

export interface AuditLog {
  id: string
  user_id?: string
  action_type: AuditActionType
  entity_type: AuditEntityType
  entity_id?: string
  description: string
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, any>
  severity: AuditSeverity
  created_at: string
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
}

export interface AuditConfig {
  id: string
  key: string
  value: string
  description?: string
  updated_at: string
}

export interface AuditAlert {
  id: string
  alert_type: string
  user_id?: string
  description: string
  severity: AuditSeverity
  metadata?: Record<string, any>
  is_resolved: boolean
  resolved_by?: string
  resolved_at?: string
  created_at: string
  user?: {
    id: string
    name: string
    email: string
  }
}

export interface AuditFilters {
  user_id?: string
  action_type?: AuditActionType
  entity_type?: AuditEntityType
  severity?: AuditSeverity
  date_from?: string
  date_to?: string
  search?: string
}

