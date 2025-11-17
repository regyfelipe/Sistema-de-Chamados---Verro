"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ChevronRight,
  ChevronDown,
  Users,
  Building2,
  Search,
  UserPlus,
  Pencil,
  Trash2,
  Mail,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { User, Sector } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface OrganizationTreeProps {
  initialSectors: Sector[]
  initialUsers: User[]
}

interface TreeNode {
  id: string
  type: "sector" | "user"
  name: string
  data: Sector | User
  children?: TreeNode[]
  expanded?: boolean
}

const roleLabels: Record<string, string> = {
  solicitante: "Solicitante",
  atendente: "Atendente",
  admin: "Admin",
  super_admin: "Super Admin",
}

const roleColors: Record<string, string> = {
  solicitante: "bg-gray-100 text-gray-800",
  atendente: "bg-blue-100 text-blue-800",
  admin: "bg-purple-100 text-purple-800",
  super_admin: "bg-red-100 text-red-800",
}

export function OrganizationTree({
  initialSectors,
  initialUsers,
}: OrganizationTreeProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [sectors, setSectors] = useState<Sector[]>(initialSectors)
  const [users, setUsers] = useState<User[]>(initialUsers)

  // Atualizar quando os dados iniciais mudarem
  useEffect(() => {
    setSectors(initialSectors)
    setUsers(initialUsers)
  }, [initialSectors, initialUsers])
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set())
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedSectorId, setSelectedSectorId] = useState<string>("none")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "solicitante",
    sector_id: "none",
  })

  // Construir árvore hierárquica
  const tree = useMemo(() => {
    const treeNodes: TreeNode[] = []

    // Criar nós de setores
    sectors.forEach((sector) => {
      const sectorUsers = users.filter(
        (user) => user.sector_id === sector.id
      )

      const sectorNode: TreeNode = {
        id: sector.id,
        type: "sector",
        name: sector.name,
        data: sector,
        expanded: expandedSectors.has(sector.id),
        children: sectorUsers.length > 0 ? sectorUsers.map((user) => ({
          id: user.id,
          type: "user",
          name: user.name,
          data: user,
        })) : undefined,
      }

      treeNodes.push(sectorNode)
    })

    // Adicionar usuários sem setor
    const usersWithoutSector = users.filter((user) => !user.sector_id)
    if (usersWithoutSector.length > 0) {
      treeNodes.push({
        id: "no-sector",
        type: "sector",
        name: "Sem Setor",
        data: { id: "no-sector", name: "Sem Setor" } as Sector,
        expanded: expandedSectors.has("no-sector"),
        children: usersWithoutSector.length > 0 ? usersWithoutSector.map((user) => ({
          id: user.id,
          type: "user",
          name: user.name,
          data: user,
        })) : undefined,
      })
    }

    return treeNodes
  }, [sectors, users, expandedSectors])

  // Filtrar árvore baseado na busca
  const filteredTree = useMemo(() => {
    if (!searchQuery) return tree

    const query = searchQuery.toLowerCase()
    const filtered: TreeNode[] = []

    tree.forEach((sectorNode) => {
      const sectorMatches = sectorNode.name.toLowerCase().includes(query)
      const matchingUsers = sectorNode.children?.filter((userNode) =>
        userNode.name.toLowerCase().includes(query) ||
        (userNode.data as User).email.toLowerCase().includes(query)
      )

      if (sectorMatches || (matchingUsers && matchingUsers.length > 0)) {
        filtered.push({
          ...sectorNode,
          children: sectorMatches
            ? sectorNode.children
            : matchingUsers,
        })
      }
    })

    return filtered
  }, [tree, searchQuery])

  // Expandir setores automaticamente quando há busca
  useEffect(() => {
    if (searchQuery && filteredTree.length > 0) {
      const newExpanded = new Set(expandedSectors)
      let hasChanges = false
      filteredTree.forEach((node) => {
        if (node.type === "sector" && !newExpanded.has(node.id)) {
          newExpanded.add(node.id)
          hasChanges = true
        }
      })
      if (hasChanges) {
        setExpandedSectors(newExpanded)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const toggleSector = (sectorId: string) => {
    setExpandedSectors((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sectorId)) {
        newSet.delete(sectorId)
      } else {
        newSet.add(sectorId)
      }
      return newSet
    })
  }

  const expandAll = () => {
    const allSectorIds = new Set(tree.map((node) => node.id))
    setExpandedSectors(allSectorIds)
  }

  const collapseAll = () => {
    setExpandedSectors(new Set())
  }

  const handleCreateUser = (sectorId?: string) => {
    setEditingUser(null)
    setSelectedSectorId(sectorId || "none")
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "solicitante",
      sector_id: sectorId || "none",
    })
    setUserDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setSelectedSectorId(user.sector_id || "none")
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      sector_id: user.sector_id || "none",
    })
    setUserDialogOpen(true)
  }

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const dataToSave: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        sector_id: formData.sector_id && formData.sector_id !== "none" ? formData.sector_id : null,
      }

      if (formData.password) {
        dataToSave.password = formData.password
      }

      if (editingUser) {
        const { error } = await supabase
          .from("users")
          .update(dataToSave)
          .eq("id", editingUser.id)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso",
        })
      } else {
        if (!formData.password) {
          toast({
            title: "Erro",
            description: "Senha é obrigatória para novos usuários",
            variant: "destructive",
          })
          return
        }

        const { error } = await supabase.from("users").insert(dataToSave)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Usuário criado com sucesso",
        })
      }

      setUserDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar usuário",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return

    try {
      const { error } = await supabase.from("users").delete().eq("id", userId)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir usuário",
        variant: "destructive",
      })
    }
  }

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    if (node.type === "sector") {
      const sector = node.data as Sector
      const isExpanded = expandedSectors.has(node.id)
      const userCount = node.children?.length || 0

      return (
        <div key={node.id} className="select-none">
          <div
            className={cn(
              "flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer",
              level === 0 && "font-semibold"
            )}
            style={{ paddingLeft: `${level * 20 + 8}px` }}
            onClick={() => toggleSector(node.id)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">{node.name}</span>
            <Badge variant="secondary" className="text-xs">
              {userCount} {userCount === 1 ? "usuário" : "usuários"}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation()
                handleCreateUser(node.id)
              }}
            >
              <UserPlus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {isExpanded && node.children && (
            <div>
              {node.children.map((child) => renderTreeNode(child, level + 1))}
            </div>
          )}
        </div>
      )
    } else {
      const user = node.data as User

      return (
        <div
          key={node.id}
          className="flex items-center gap-2 p-2 rounded-md hover:bg-accent group"
          style={{ paddingLeft: `${level * 20 + 32}px` }}
        >
          <Users className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{node.name}</span>
              <Badge className={cn("text-xs", roleColors[user.role])}>
                {roleLabels[user.role]}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleEditUser(user)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => handleDeleteUser(user.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Estrutura Organizacional
          </h2>
          <p className="text-muted-foreground">
            Visualização hierárquica de setores e usuários
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expandir Tudo
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Colapsar Tudo
          </Button>
        </div>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por setor ou usuário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Árvore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Organização</span>
            <span className="text-sm font-normal text-muted-foreground">
              {sectors.length} setores • {users.length} usuários
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTree.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? "Nenhum resultado encontrado"
                : "Nenhum setor cadastrado"}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTree.map((node) => renderTreeNode(node))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Usuário */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Atualize as informações do usuário"
                : "Crie um novo usuário no sistema"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>
            )}
            {editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha (deixe em branco para manter)</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="role">Perfil *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solicitante">Solicitante</SelectItem>
                  <SelectItem value="atendente">Atendente</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector_id">Setor</Label>
              <Select
                value={formData.sector_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, sector_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {sectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUserDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingUser ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

