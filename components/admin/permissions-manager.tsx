"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Permission,
  PermissionGroup,
  UserPermission,
  UserGroup,
} from "@/types/permissions"
import { User, Sector } from "@/types"
import {
  getPermissionGroups,
  getAllPermissions,
  getGroupPermissions,
  getUserGroups,
  getUserDirectPermissions,
  createPermissionGroup,
  updatePermissionGroup,
  deletePermissionGroup,
  assignPermissionToGroup,
  removePermissionFromGroup,
  assignGroupToUser,
  removeGroupFromUser,
  assignPermissionToUser,
  removePermissionFromUser,
  syncUserGroupsWithRole,
} from "@/lib/permissions"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Users, Shield, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PermissionsManagerProps {
  initialUsers: User[]
}

export function PermissionsManager({
  initialUsers,
}: PermissionsManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [groups, setGroups] = useState<PermissionGroup[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedGroup, setSelectedGroup] = useState<PermissionGroup | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [groupPermissions, setGroupPermissions] = useState<any[]>([])
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [userDirectPermissions, setUserDirectPermissions] = useState<
    UserPermission[]
  >([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [groupFormData, setGroupFormData] = useState({
    name: "",
    description: "",
  })
  const [editingGroup, setEditingGroup] = useState<PermissionGroup | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedGroup) {
      loadGroupPermissions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup])

  useEffect(() => {
    if (selectedUser) {
      loadUserPermissions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser])

  const loadData = async () => {
    const [groupsData, permissionsData, sectorsData] = await Promise.all([
      getPermissionGroups(),
      getAllPermissions(),
      supabase.from("sectors").select("*").order("name"),
    ])

    setGroups(groupsData)
    setPermissions(permissionsData)
    if (sectorsData.data) setSectors(sectorsData.data)
  }

  const loadGroupPermissions = async () => {
    if (!selectedGroup) return

    const perms = await getGroupPermissions(selectedGroup.id)
    setGroupPermissions(perms)
  }

  const loadUserPermissions = async () => {
    if (!selectedUser) return

    const [groups, directPerms] = await Promise.all([
      getUserGroups(selectedUser.id),
      getUserDirectPermissions(selectedUser.id),
    ])

    setUserGroups(groups)
    setUserDirectPermissions(directPerms)
  }

  const handleCreateGroup = async () => {
    try {
      await createPermissionGroup(groupFormData.name, groupFormData.description)
      toast({
        title: "Sucesso",
        description: "Grupo criado com sucesso",
      })
      setGroupDialogOpen(false)
      setGroupFormData({ name: "", description: "" })
      loadData()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar grupo",
        variant: "destructive",
      })
    }
  }

  const handleToggleGroupPermission = async (
    permissionId: string,
    granted: boolean
  ) => {
    if (!selectedGroup) return

    try {
      if (granted) {
        await assignPermissionToGroup(selectedGroup.id, permissionId, true)
      } else {
        await removePermissionFromGroup(selectedGroup.id, permissionId)
      }
      loadGroupPermissions()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar permissão",
        variant: "destructive",
      })
    }
  }

  const handleAssignGroupToUser = async (groupId: string) => {
    if (!selectedUser) return

    try {
      await assignGroupToUser(selectedUser.id, groupId)
      toast({
        title: "Sucesso",
        description: "Grupo atribuído ao usuário",
      })
      loadUserPermissions()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atribuir grupo",
        variant: "destructive",
      })
    }
  }

  const handleRemoveGroupFromUser = async (groupId: string) => {
    if (!selectedUser) return

    try {
      await removeGroupFromUser(selectedUser.id, groupId)
      toast({
        title: "Sucesso",
        description: "Grupo removido do usuário",
      })
      loadUserPermissions()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover grupo",
        variant: "destructive",
      })
    }
  }

  const handleSyncRole = async () => {
    if (!selectedUser) return

    try {
      await syncUserGroupsWithRole(selectedUser.id, selectedUser.role)
      toast({
        title: "Sucesso",
        description: "Grupos sincronizados com role",
      })
      loadUserPermissions()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao sincronizar",
        variant: "destructive",
      })
    }
  }


  const permissionsByResource = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource_type]) {
      acc[perm.resource_type] = []
    }
    acc[perm.resource_type].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Permissões Granulares</h2>
        <p className="text-muted-foreground">
          Gerencie grupos de permissões e permissões individuais de usuários
        </p>
      </div>

      <Tabs defaultValue="groups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="groups">Grupos</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        {/* Aba de Grupos */}
        <TabsContent value="groups" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Grupos de Permissões</h3>
            <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingGroup(null)
                  setGroupFormData({ name: "", description: "" })
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Grupo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingGroup ? "Editar Grupo" : "Novo Grupo"}
                  </DialogTitle>
                  <DialogDescription>
                    Crie um grupo de permissões reutilizável
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="group-name">Nome *</Label>
                    <Input
                      id="group-name"
                      value={groupFormData.name}
                      onChange={(e) =>
                        setGroupFormData({ ...groupFormData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group-description">Descrição</Label>
                    <Input
                      id="group-description"
                      value={groupFormData.description}
                      onChange={(e) =>
                        setGroupFormData({
                          ...groupFormData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setGroupDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateGroup}>
                    {editingGroup ? "Atualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Lista de Grupos */}
            <Card>
              <CardHeader>
                <CardTitle>Grupos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-md border cursor-pointer hover:bg-accent",
                        selectedGroup?.id === group.id && "bg-accent"
                      )}
                      onClick={() => setSelectedGroup(group)}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span className="font-medium">{group.name}</span>
                          {group.is_system && (
                            <Badge variant="secondary" className="text-xs">
                              Sistema
                            </Badge>
                          )}
                        </div>
                        {group.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {group.description}
                          </p>
                        )}
                      </div>
                      {!group.is_system && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation()
                           
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Permissões do Grupo Selecionado */}
            {selectedGroup && (
              <Card>
                <CardHeader>
                  <CardTitle>Permissões: {selectedGroup.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {Object.entries(permissionsByResource).map(
                      ([resource, perms]) => (
                        <div key={resource} className="space-y-2">
                          <h4 className="font-semibold text-sm capitalize">
                            {resource}
                          </h4>
                          <div className="space-y-2 pl-4">
                            {perms.map((perm) => {
                              const groupPerm = groupPermissions.find(
                                (gp) => gp.permission_id === perm.id
                              )
                              const isGranted = groupPerm?.granted ?? false

                              return (
                                <div
                                  key={perm.id}
                                  className="flex items-center justify-between p-2 rounded border"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">
                                      {perm.name}
                                    </div>
                                    {perm.description && (
                                      <div className="text-xs text-muted-foreground">
                                        {perm.description}
                                      </div>
                                    )}
                                  </div>
                                  <Switch
                                    checked={isGranted}
                                    onCheckedChange={(checked) =>
                                      handleToggleGroupPermission(
                                        perm.id,
                                        checked
                                      )
                                    }
                                    disabled={selectedGroup.is_system}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Aba de Usuários */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Lista de Usuários */}
            <Card>
              <CardHeader>
                <CardTitle>Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {initialUsers.map((user) => (
                    <div
                      key={user.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-md border cursor-pointer hover:bg-accent",
                        selectedUser?.id === user.id && "bg-accent"
                      )}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                        </div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Permissões do Usuário Selecionado */}
            {selectedUser && (
              <Card>
                <CardHeader>
                  <CardTitle>Permissões: {selectedUser.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Grupos do Usuário */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">Grupos</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSyncRole}
                      >
                        Sincronizar com Role
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {userGroups.map((ug) => (
                        <div
                          key={ug.id}
                          className="flex items-center justify-between p-2 rounded border"
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <span>{ug.group?.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleRemoveGroupFromUser(ug.group_id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      <Select
                        onValueChange={handleAssignGroupToUser}
                        value=""
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Adicionar grupo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {groups
                            .filter(
                              (g) =>
                                !userGroups.some((ug) => ug.group_id === g.id)
                            )
                            .map((group) => (
                              <SelectItem key={group.id} value={group.id}>
                                {group.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Permissões Diretas */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">
                      Permissões Diretas
                    </h4>
                    <div className="space-y-2">
                      {userDirectPermissions.map((up) => (
                        <div
                          key={up.id}
                          className="flex items-center justify-between p-2 rounded border"
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {up.permission?.name}
                            </div>
                            {up.sector && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {up.sector.name}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              removePermissionFromUser(
                                selectedUser.id,
                                up.permission_id,
                                up.sector_id || undefined
                              ).then(() => loadUserPermissions())
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      {/* TODO: Implementar dialog para adicionar permissão direta */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

