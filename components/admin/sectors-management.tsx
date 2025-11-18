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
import { Badge } from "@/components/ui/badge"
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
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">Setores</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} className="w-full sm:w-auto h-8 sm:h-10 text-xs sm:text-sm">
              <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Novo Setor</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[500px] max-h-[95vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader className="space-y-2 sm:space-y-3">
              <DialogTitle className="text-lg sm:text-xl">
                {editingSector ? "Editar Setor" : "Novo Setor"}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {editingSector
                  ? "Atualize as informações do setor"
                  : "Crie um novo setor no sistema"}
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
                <Label htmlFor="description" className="text-xs sm:text-sm font-medium">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="sla_hours" className="text-xs sm:text-sm font-medium">SLA (horas) *</Label>
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
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
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
                  {editingSector ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {sectors.map((sector) => (
          <Card key={sector.id} className="hover:shadow-md transition-shadow border-border/50">
            <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-border/50">
              <CardTitle className="flex items-center justify-between text-base sm:text-lg font-semibold">
                <span className="truncate flex-1">{sector.name}</span>
                <div className="flex gap-1 sm:gap-2 ml-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(sector)}
                    className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-primary/10"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(sector.id)}
                    className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6 pt-4">
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {sector.description || "Sem descrição"}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-medium">
                  SLA: {sector.sla_hours}h
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

