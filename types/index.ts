export type UserRole = 'solicitante' | 'atendente' | 'admin' | 'super_admin'

export type TicketStatus = 'aberto' | 'em_atendimento' | 'aguardando' | 'fechado'

export type TicketPriority = 'baixa' | 'media' | 'alta' | 'critica'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  sector_id?: string
  created_at: string
  updated_at: string
}

export interface Sector {
  id: string
  name: string
  description?: string
  sla_hours?: number
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: string
  title: string
  description: string
  sector_id?: string | null
  status: TicketStatus
  priority: TicketPriority
  created_by: string
  assigned_to?: string
  created_at: string
  updated_at: string
  sla_due_date?: string
  sector?: Sector | null
  created_by_user?: User
  assigned_to_user?: User
}

export interface Comment {
  id: string
  ticket_id: string
  user_id: string
  content: string
  is_internal: boolean
  created_at: string
  user?: User
}

export interface TicketHistory {
  id: string
  ticket_id: string
  user_id: string
  action: string
  old_value?: string
  new_value?: string
  created_at: string
  user?: User
}

export interface Attachment {
  id: string
  ticket_id: string
  comment_id?: string
  user_id: string
  filename: string
  file_path: string
  file_size: number
  file_type?: string
  created_at: string
  user?: User
}

export type NotificationType = 
  | 'ticket_assigned'
  | 'ticket_created'
  | 'comment_added'
  | 'status_changed'
  | 'priority_changed'
  | 'sector_changed'
  | 'sla_warning'
  | 'sla_expired'
  | 'mention'

export interface UserNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  ticket_id?: string
  comment_id?: string
  is_read: boolean
  created_at: string
  ticket?: Ticket
  user?: User
}

export interface ChatMessage {
  id: string
  user_id: string
  message: string
  ticket_id?: string | null
  is_edited: boolean
  edited_at?: string | null
  created_at: string
  user?: User
  ticket?: Ticket
}

export interface ChatReadStatus {
  id: string
  user_id: string
  ticket_id?: string | null
  last_read_at: string
}

// Re-export branding types
export type { BrandingConfig } from "./branding"

