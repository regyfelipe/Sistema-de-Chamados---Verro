import { supabase } from "./supabase"
import {
  Permission,
  PermissionGroup,
  GroupPermission,
  UserPermission,
  UserGroup,
  UserPermissionsResult,
  PermissionResource,
  PermissionAction,
} from "@/types/permissions"

/**
 * Verifica se um usuário tem uma permissão específica
 */
export async function hasPermission(
  userId: string,
  permissionCode: string,
  sectorId?: string,
  field?: string
): Promise<boolean> {
  try {
   
    const { data, error } = await supabase.rpc("get_user_permissions", {
      p_user_id: userId,
    })

    if (error) {
      console.error("Erro ao buscar permissões:", error)
      return false
    }

    const permissions = data as UserPermissionsResult[]

   
    const permission = permissions.find((p) => p.permission_code === permissionCode)

    if (!permission || !permission.granted) {
      return false
    }

   
    if (sectorId && permission.sector_id && permission.sector_id !== sectorId) {
      return false
    }

   
    if (field && permission.field_restrictions) {
      const { allowed, denied } = permission.field_restrictions

     
      if (allowed && allowed.length > 0 && !allowed.includes(field)) {
        return false
      }

     
      if (denied && denied.length > 0 && denied.includes(field)) {
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Erro ao verificar permissão:", error)
    return false
  }
}

/**
 * Verifica múltiplas permissões de uma vez
 */
export async function hasAnyPermission(
  userId: string,
  permissionCodes: string[],
  sectorId?: string
): Promise<boolean> {
  for (const code of permissionCodes) {
    if (await hasPermission(userId, code, sectorId)) {
      return true
    }
  }
  return false
}

/**
 * Verifica se o usuário tem todas as permissões
 */
export async function hasAllPermissions(
  userId: string,
  permissionCodes: string[],
  sectorId?: string
): Promise<boolean> {
  for (const code of permissionCodes) {
    if (!(await hasPermission(userId, code, sectorId))) {
      return false
    }
  }
  return true
}

/**
 * Obtém todas as permissões de um usuário
 */
export async function getUserPermissions(
  userId: string
): Promise<UserPermissionsResult[]> {
  try {
    const { data, error } = await supabase.rpc("get_user_permissions", {
      p_user_id: userId,
    })

    if (error) {
      console.error("Erro ao buscar permissões:", error)
      return []
    }

    return (data as UserPermissionsResult[]) || []
  } catch (error) {
    console.error("Erro ao buscar permissões do usuário:", error)
    return []
  }
}

/**
 * Obtém todos os grupos de permissões
 */
export async function getPermissionGroups(): Promise<PermissionGroup[]> {
  try {
    const { data, error } = await supabase
      .from("permission_groups")
      .select("*")
      .order("name")

    if (error) throw error

    return (data as PermissionGroup[]) || []
  } catch (error) {
    console.error("Erro ao buscar grupos de permissões:", error)
    return []
  }
}

/**
 * Obtém todas as permissões disponíveis
 */
export async function getAllPermissions(): Promise<Permission[]> {
  try {
    const { data, error } = await supabase
      .from("permissions")
      .select("*")
      .order("resource_type, action")

    if (error) throw error

    return (data as Permission[]) || []
  } catch (error) {
    console.error("Erro ao buscar permissões:", error)
    return []
  }
}

/**
 * Obtém permissões de um grupo
 */
export async function getGroupPermissions(
  groupId: string
): Promise<GroupPermission[]> {
  try {
    const { data, error } = await supabase
      .from("group_permissions")
      .select(
        `
        *,
        permission:permissions(*)
      `
      )
      .eq("group_id", groupId)

    if (error) throw error

    return (data as GroupPermission[]) || []
  } catch (error) {
    console.error("Erro ao buscar permissões do grupo:", error)
    return []
  }
}

/**
 * Obtém grupos de um usuário
 */
export async function getUserGroups(userId: string): Promise<UserGroup[]> {
  try {
    const { data, error } = await supabase
      .from("user_groups")
      .select(
        `
        *,
        group:permission_groups(*)
      `
      )
      .eq("user_id", userId)

    if (error) throw error

    return (data as UserGroup[]) || []
  } catch (error) {
    console.error("Erro ao buscar grupos do usuário:", error)
    return []
  }
}

/**
 * Obtém permissões diretas de um usuário
 */
export async function getUserDirectPermissions(
  userId: string
): Promise<UserPermission[]> {
  try {
    const { data, error } = await supabase
      .from("user_permissions")
      .select(
        `
        *,
        permission:permissions(*),
        sector:sectors(id, name)
      `
      )
      .eq("user_id", userId)

    if (error) throw error

    return (data as UserPermission[]) || []
  } catch (error) {
    console.error("Erro ao buscar permissões diretas do usuário:", error)
    return []
  }
}

/**
 * Cria um novo grupo de permissões
 */
export async function createPermissionGroup(
  name: string,
  description?: string
): Promise<PermissionGroup | null> {
  try {
    const { data, error } = await supabase
      .from("permission_groups")
      .insert({ name, description })
      .select()
      .single()

    if (error) throw error

    return data as PermissionGroup
  } catch (error) {
    console.error("Erro ao criar grupo de permissões:", error)
    throw error
  }
}

/**
 * Atualiza um grupo de permissões
 */
export async function updatePermissionGroup(
  groupId: string,
  updates: { name?: string; description?: string }
): Promise<void> {
  try {
    const { error } = await supabase
      .from("permission_groups")
      .update(updates)
      .eq("id", groupId)

    if (error) throw error
  } catch (error) {
    console.error("Erro ao atualizar grupo de permissões:", error)
    throw error
  }
}

/**
 * Deleta um grupo de permissões
 */
export async function deletePermissionGroup(groupId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("permission_groups")
      .delete()
      .eq("id", groupId)

    if (error) throw error
  } catch (error) {
    console.error("Erro ao deletar grupo de permissões:", error)
    throw error
  }
}

/**
 * Atribui permissão a um grupo
 */
export async function assignPermissionToGroup(
  groupId: string,
  permissionId: string,
  granted: boolean = true
): Promise<void> {
  try {
    const { error } = await supabase.from("group_permissions").upsert({
      group_id: groupId,
      permission_id: permissionId,
      granted,
    })

    if (error) throw error
  } catch (error) {
    console.error("Erro ao atribuir permissão ao grupo:", error)
    throw error
  }
}

/**
 * Remove permissão de um grupo
 */
export async function removePermissionFromGroup(
  groupId: string,
  permissionId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("group_permissions")
      .delete()
      .eq("group_id", groupId)
      .eq("permission_id", permissionId)

    if (error) throw error
  } catch (error) {
    console.error("Erro ao remover permissão do grupo:", error)
    throw error
  }
}

/**
 * Atribui grupo a um usuário
 */
export async function assignGroupToUser(
  userId: string,
  groupId: string
): Promise<void> {
  try {
    const { error } = await supabase.from("user_groups").upsert({
      user_id: userId,
      group_id: groupId,
    })

    if (error) throw error
  } catch (error) {
    console.error("Erro ao atribuir grupo ao usuário:", error)
    throw error
  }
}

/**
 * Remove grupo de um usuário
 */
export async function removeGroupFromUser(
  userId: string,
  groupId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("user_groups")
      .delete()
      .eq("user_id", userId)
      .eq("group_id", groupId)

    if (error) throw error
  } catch (error) {
    console.error("Erro ao remover grupo do usuário:", error)
    throw error
  }
}

/**
 * Atribui permissão direta a um usuário
 */
export async function assignPermissionToUser(
  userId: string,
  permissionId: string,
  options?: {
    granted?: boolean
    sectorId?: string
    fieldRestrictions?: {
      allowed?: string[]
      denied?: string[]
    }
  }
): Promise<void> {
  try {
    const { error } = await supabase.from("user_permissions").upsert({
      user_id: userId,
      permission_id: permissionId,
      granted: options?.granted ?? true,
      sector_id: options?.sectorId || null,
      field_restrictions: options?.fieldRestrictions || null,
    })

    if (error) throw error
  } catch (error) {
    console.error("Erro ao atribuir permissão ao usuário:", error)
    throw error
  }
}

/**
 * Remove permissão direta de um usuário
 */
export async function removePermissionFromUser(
  userId: string,
  permissionId: string,
  sectorId?: string
): Promise<void> {
  try {
    let query = supabase
      .from("user_permissions")
      .delete()
      .eq("user_id", userId)
      .eq("permission_id", permissionId)

    if (sectorId) {
      query = query.eq("sector_id", sectorId)
    } else {
      query = query.is("sector_id", null)
    }

    const { error } = await query

    if (error) throw error
  } catch (error) {
    console.error("Erro ao remover permissão do usuário:", error)
    throw error
  }
}

/**
 * Sincroniza grupos de permissões com roles do sistema
 * Atribui automaticamente grupos baseados no role do usuário
 */
export async function syncUserGroupsWithRole(
  userId: string,
  role: string
): Promise<void> {
  try {
   
    await supabase.from("user_groups").delete().eq("user_id", userId)

   
    const roleToGroup: Record<string, string> = {
      solicitante: "Solicitante",
      atendente: "Atendente",
      admin: "Admin",
      super_admin: "Super Admin",
    }

    const groupName = roleToGroup[role]
    if (!groupName) return

   
    const { data: group } = await supabase
      .from("permission_groups")
      .select("id")
      .eq("name", groupName)
      .single()

    if (group) {
      await assignGroupToUser(userId, group.id)
    }
  } catch (error) {
    console.error("Erro ao sincronizar grupos com role:", error)
  }
}

