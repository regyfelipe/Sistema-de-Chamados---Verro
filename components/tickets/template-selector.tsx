"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, Keyboard } from "lucide-react"
import { CommentTemplate } from "@/types/templates"
import { getTemplates, replaceTemplateVariables } from "@/lib/templates"
import { Ticket } from "@/types"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createTemplate } from "@/lib/templates"

interface TemplateSelectorProps {
  ticket: Ticket
  onSelect: (content: string) => void
  currentComment: string
}

export function TemplateSelector({
  ticket,
  onSelect,
  currentComment,
}: TemplateSelectorProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<CommentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    content: "",
    shortcut_key: "",
  })

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const data = await getTemplates(ticket.sector_id, session?.user?.id)
      setTemplates(data)
    } catch (error) {
      console.error("Erro ao carregar templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyTemplate = useCallback((template: CommentTemplate) => {
    const variables = {
      user_name: ticket.created_by_user?.name || "Usuário",
      current_user_name: session?.user?.name || "Atendente",
      ticket_id: ticket.id.slice(0, 8),
      ticket_title: ticket.title,
      ticket_status: ticket.status,
      ticket_priority: ticket.priority,
      sector_name: ticket.sector?.name || "Setor",
      assigned_to_name: ticket.assigned_to_user?.name || "Não atribuído",
    }

    const content = replaceTemplateVariables(template.content, variables)

    // Se já houver conteúdo, adicionar o template após
    if (currentComment.trim()) {
      onSelect(currentComment + "\n\n" + content)
    } else {
      onSelect(content)
    }

    toast({
      title: "Template aplicado",
      description: `Template "${template.name}" foi inserido`,
    })
  }, [ticket, session, currentComment, onSelect, toast])

  useEffect(() => {
    loadTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.sector_id])

  // Atalhos de teclado (apenas quando há templates)
  useEffect(() => {
    if (templates.length === 0) return

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorar se estiver digitando em um input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      // Verificar atalhos F1-F12
      if (e.key.startsWith("F") && parseInt(e.key.substring(1)) >= 1 && parseInt(e.key.substring(1)) <= 12) {
        const template = templates.find(
          (t) => t.shortcut_key === e.key
        )
        if (template) {
          e.preventDefault()
          applyTemplate(template)
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [templates, applyTemplate])

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast({
        title: "Erro",
        description: "Preencha nome e conteúdo do template",
        variant: "destructive",
      })
      return
    }

    try {
      const template = await createTemplate({
        name: newTemplate.name,
        content: newTemplate.content,
        sector_id: ticket.sector_id || undefined,
        is_global: false,
        created_by: session?.user?.id || "",
        shortcut_key: newTemplate.shortcut_key || undefined,
      })

      if (template) {
        toast({
          title: "Template criado",
          description: "Template foi criado com sucesso",
        })
        setCreateDialogOpen(false)
        setNewTemplate({ name: "", content: "", shortcut_key: "" })
        loadTemplates()
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar template",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <FileText className="mr-2 h-4 w-4" />
        Carregando templates...
      </Button>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled>
          <FileText className="mr-2 h-4 w-4" />
          Nenhum template disponível
        </Button>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Criar Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Template</DialogTitle>
              <DialogDescription>
                Crie um template de resposta para usar em comentários
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Nome do Template</Label>
                <Input
                  id="template-name"
                  placeholder="Ex: Solução Aplicada"
                  value={newTemplate.name}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-content">Conteúdo</Label>
                <Textarea
                  id="template-content"
                  placeholder="Use {{user_name}}, {{ticket_id}}, etc. para variáveis"
                  value={newTemplate.content}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, content: e.target.value })
                  }
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Variáveis disponíveis: {`{{user_name}}`, `{{ticket_id}}`, `{{current_user_name}}`, `{{ticket_title}}`, `{{sector_name}}`, `{{current_date}}`, `{{current_time}}`}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-shortcut">Atalho (opcional)</Label>
                <Input
                  id="template-shortcut"
                  placeholder="Ex: F1, F2, Ctrl+1"
                  value={newTemplate.shortcut_key}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, shortcut_key: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTemplate}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value=""
        onValueChange={(value) => {
          const template = templates.find((t) => t.id === value)
          if (template) {
            applyTemplate(template)
          }
        }}
      >
        <SelectTrigger className="w-[200px]">
          <FileText className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Usar template..." />
        </SelectTrigger>
        <SelectContent>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              <div className="flex items-center justify-between w-full">
                <span>{template.name}</span>
                {template.shortcut_key && (
                  <span className="text-xs text-muted-foreground ml-2">
                    <Keyboard className="inline h-3 w-3 mr-1" />
                    {template.shortcut_key}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Criar Template
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Template</DialogTitle>
            <DialogDescription>
              Crie um template de resposta para usar em comentários
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nome do Template</Label>
              <Input
                id="template-name"
                placeholder="Ex: Solução Aplicada"
                value={newTemplate.name}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-content">Conteúdo</Label>
              <Textarea
                id="template-content"
                placeholder="Use {{user_name}}, {{ticket_id}}, etc. para variáveis"
                value={newTemplate.content}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, content: e.target.value })
                }
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Variáveis disponíveis: {`{{user_name}}`, `{{ticket_id}}`, `{{current_user_name}}`, `{{ticket_title}}`, `{{sector_name}}`, `{{current_date}}`, `{{current_time}}`}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-shortcut">Atalho (opcional)</Label>
              <Input
                id="template-shortcut"
                placeholder="Ex: F1, F2"
                value={newTemplate.shortcut_key}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, shortcut_key: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTemplate}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

