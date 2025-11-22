"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { getUserPermissions, hasPermission } from "@/lib/permissions"
import { UserPermissionsResult } from "@/types/permissions"

export function usePermissions() {
  const { data: session } = useSession()
  const [permissions, setPermissions] = useState<UserPermissionsResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      loadPermissions()
    } else {
      setPermissions([])
      setLoading(false)
    }
  }, [session?.user?.id])

  const loadPermissions = async () => {
    if (!session?.user?.id) return

    setLoading(true)
    try {
      const userPerms = await getUserPermissions(session.user.id)
      setPermissions(userPerms)
    } catch (error) {
      console.error("Erro ao carregar permissões:", error)
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }

  const checkPermission = async (
    permissionCode: string,
    sectorId?: string,
    field?: string
  ): Promise<boolean> => {
    if (!session?.user?.id) return false

   
    const cached = permissions.find((p) => p.permission_code === permissionCode)
    if (cached && !cached.granted) {
      return false
    }

   
    return hasPermission(session.user.id, permissionCode, sectorId, field)
  }

  const hasPermissionCode = (permissionCode: string): boolean => {
    return permissions.some(
      (p) => p.permission_code === permissionCode && p.granted
    )
  }

  return {
    permissions,
    loading,
    checkPermission,
    hasPermissionCode,
    refresh: loadPermissions,
  }
}

