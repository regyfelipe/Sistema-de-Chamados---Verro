export type PermissionResource = 
  | "ticket"
  | "user"
  | "sector"
  | "comment"
  | "attachment"
  | "admin"

export type PermissionAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "assign"
  | "change_status"
  | "change_priority"
  | "view_all"
  | "edit_all"
  | "internal"
  | "upload"
  | "download"
  | "dashboard"
  | "automations"
  | "sla"
  | "audit"
  | "export"
  | "manage_permissions"

export interface Permission {
  id: string
  code: string
  name: string
  description?: string
  resource_type: PermissionResource
  action: PermissionAction
  created_at: string
}

export interface PermissionGroup {
  id: string
  name: string
  description?: string
  is_system: boolean
  created_at: string
  updated_at: string
  permissions?: Permission[]
}

export interface GroupPermission {
  id: string
  group_id: string
  permission_id: string
  granted: boolean
  created_at: string
  permission?: Permission
}

export interface UserPermission {
  id: string
  user_id: string
  permission_id: string
  granted: boolean
  sector_id?: string
  field_restrictions?: {
    allowed?: string[]
    denied?: string[]
  }
  created_at: string
  permission?: Permission
  sector?: {
    id: string
    name: string
  }
}

export interface UserGroup {
  id: string
  user_id: string
  group_id: string
  created_at: string
  group?: PermissionGroup
}

export interface UserPermissionsResult {
  permission_code: string
  granted: boolean
  sector_id?: string
  field_restrictions?: {
    allowed?: string[]
    denied?: string[]
  }
}

