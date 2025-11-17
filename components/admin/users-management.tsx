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
          
          // Mensagens de erro mais específicas
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Usuários</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
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
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  onClick={() => setDialogOpen(false)}
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {user.name}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(user)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(user.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                Perfil: {user.role}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

