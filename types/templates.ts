export interface CommentTemplate {
  id: string
  name: string
  content: string
  sector_id?: string
  is_global: boolean
  created_by: string
  shortcut_key?: string
  created_at: string
  updated_at: string
  sector?: {
    id: string
    name: string
  }
  created_by_user?: {
    id: string
    name: string
  }
}

export interface TemplateVariables {
  user_name?: string
  current_user_name?: string
  ticket_id?: string
  ticket_title?: string
  ticket_status?: string
  ticket_priority?: string
  sector_name?: string
  assigned_to_name?: string
  current_date?: string
  current_time?: string
}

