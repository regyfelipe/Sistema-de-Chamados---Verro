"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2 } from "lucide-react"

interface UsersManagementProps {
  initialUsers: any[]
}

export function UsersManagement({ initialUsers }: UsersManagementProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [users] = useState(initialUsers)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "solicitante",
    sector_id: "none",
  })
  const [sectors, setSectors] = useState<any[]>([])

  useEffect(() => {
    if (dialogOpen) {
      loadSectors()
    }
  }, [dialogOpen])

  const loadSectors = async () => {
    const { data } = await supabase.from("sectors").select("id, name")
    if (data) setSectors(data)
  }

  const handleCreate = () => {
    setEditingUser(null)
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "solicitante",
      sector_id: "none",
    })
    setDialogOpen(true)
  }

  const handleEdit = (user: any) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      sector_id: user.sector_id || "none",
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      console.log("👤 [Users] Iniciando criação/edição de usuário...");
      console.log("   Dados:", { ...formData, password: "***" });

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
        console.log("✏️  [Users] Atualizando usuário:", editingUser.id);
        const { data, error } = await supabase
          .from("users")
          .update(dataToSave)
          .eq("id", editingUser.id)
          .select()

        if (error) {
          console.error("❌ [Users] Erro ao atualizar:");
          console.error("   Código:", error.code);
          console.error("   Mensagem:", error.message);
          console.error("   Detalhes:", error.details);
          throw error
        }

        console.log("✅ [Users] Usuário atualizado:", data);
        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso",
        })
      } else {
        if (!formData.password) {
          console.error("❌ [Users] Senha não fornecida");
          toast({
            title: "Erro",
            description: "Senha é obrigatória para novos usuários",
            variant: "destructive",
          })
          return
        }

        console.log("➕ [Users] Criando novo usuário...");
        const { data, error } = await supabase
          .from("users")
          .insert(dataToSave)
          .select()

        if (error) {
          console.error("❌ [Users] Erro ao criar usuário:");
          console.error("   Código:", error.code);
          console.error("   Mensagem:", error.message);
          console.error("   Detalhes:", error.details);
          console.error("   Hint:", error.hint);
          
          let errorMessage = error.message || "Erro ao criar usuário";
          
          if (error.code === "23505") {
            errorMessage = "Este email já está cadastrado no sistema";
          } else if (error.code === "42501") {
            errorMessage = "Permissão negada. Verifique se RLS está desabilitado";
          } else if (error.code === "23503") {
            errorMessage = "Setor selecionado não existe";
          }
          
          throw { ...error, userMessage: errorMessage }
        }

        console.log("✅ [Users] Usuário criado com sucesso:", data);
        toast({
          title: "Sucesso",
          description: "Usuário criado com sucesso",
        })
      }

      setDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      console.error("❌ [Users] Erro geral:", error);
      toast({
        title: "Erro",
        description: error.userMessage || error.message || "Erro ao salvar usuário",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return

    try {
      const { error } = await supabase.from("users").delete().eq("id", id)

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

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">Usuários</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} className="w-full sm:w-auto h-8 sm:h-10 text-xs sm:text-sm">
              <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Novo Usuário</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[500px] max-h-[95vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader className="space-y-2 sm:space-y-3">
              <DialogTitle className="text-lg sm:text-xl">
                {editingUser ? "Editar Usuário" : "Novo Usuário"}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {editingUser
                  ? "Atualize as informações do usuário"
                  : "Crie um novo usuário no sistema"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="name" className="text-xs sm:text-sm font-medium">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm font-medium">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>
              {!editingUser && (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="password" className="text-xs sm:text-sm font-medium">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    className="h-9 sm:h-10 text-sm sm:text-base"
                  />
                </div>
              )}
              {editingUser && (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="password" className="text-xs sm:text-sm font-medium">Nova Senha (deixe em branco para manter)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="h-9 sm:h-10 text-sm sm:text-base"
                  />
                </div>
              )}
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="role" className="text-xs sm:text-sm font-medium">Perfil *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solicitante" className="text-sm">Solicitante</SelectItem>
                    <SelectItem value="atendente" className="text-sm">Atendente</SelectItem>
                    <SelectItem value="admin" className="text-sm">Admin</SelectItem>
                    <SelectItem value="super_admin" className="text-sm">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="sector_id" className="text-xs sm:text-sm font-medium">Setor</Label>
                <Select
                  value={formData.sector_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sector_id: value })
                  }
                >
                  <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                    <SelectValue placeholder="Selecione um setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-sm">Nenhum</SelectItem>
                    {sectors.map((sector) => (
                      <SelectItem key={sector.id} value={sector.id} className="text-sm">
                        {sector.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2 sm:pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base">
                  {editingUser ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow border-border/50">
            <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-border/50">
              <CardTitle className="flex items-center justify-between text-base sm:text-lg font-semibold">
                <span className="truncate flex-1">{user.name}</span>
                <div className="flex gap-1 sm:gap-2 ml-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(user)}
                    className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-primary/10"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(user.id)}
                    className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6 pt-4">
              <p className="text-sm text-muted-foreground mb-3 truncate">{user.email}</p>
              <Badge variant="outline" className="text-xs font-medium capitalize">
                {user.role}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

