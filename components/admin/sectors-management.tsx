"use client"

import { useState } from "react"
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
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Plus, Pencil, Trash2 } from "lucide-react"

interface SectorsManagementProps {
  initialSectors: any[]
}

export function SectorsManagement({ initialSectors }: SectorsManagementProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [sectors, setSectors] = useState(initialSectors)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSector, setEditingSector] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sla_hours: 24,
  })

  const handleCreate = () => {
    setEditingSector(null)
    setFormData({ name: "", description: "", sla_hours: 24 })
    setDialogOpen(true)
  }

  const handleEdit = (sector: any) => {
    setEditingSector(sector)
    setFormData({
      name: sector.name,
      description: sector.description || "",
      sla_hours: sector.sla_hours || 24,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingSector) {
        const { error } = await supabase
          .from("sectors")
          .update(formData)
          .eq("id", editingSector.id)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Setor atualizado com sucesso",
        })
      } else {
        const { error } = await supabase.from("sectors").insert(formData)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Setor criado com sucesso",
        })
      }

      setDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar setor",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este setor?")) return

    try {
      const { error } = await supabase.from("sectors").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Setor excluído com sucesso",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir setor",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Setores</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Setor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSector ? "Editar Setor" : "Novo Setor"}
              </DialogTitle>
              <DialogDescription>
                {editingSector
                  ? "Atualize as informações do setor"
                  : "Crie um novo setor no sistema"}
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
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sla_hours">SLA (horas) *</Label>
                <Input
                  id="sla_hours"
                  type="number"
                  min="1"
                  value={formData.sla_hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sla_hours: parseInt(e.target.value) || 24,
                    })
                  }
                  required
                />
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
                  {editingSector ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sectors.map((sector) => (
          <Card key={sector.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {sector.name}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(sector)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(sector.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {sector.description || "Sem descrição"}
              </p>
              <p className="text-xs text-muted-foreground">
                SLA: {sector.sla_hours} horas
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

