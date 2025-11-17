"use client"

import { Attachment } from "@/types"
import { File, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { useSession } from "next-auth/react"

interface AttachmentListProps {
  attachments: Attachment[]
  ticketId: string
  onDelete?: () => void
}

export function AttachmentList({
  attachments,
  ticketId,
  onDelete,
}: AttachmentListProps) {
  const { data: session } = useSession()
  const { toast } = useToast()

  const handleDownload = async (attachment: Attachment) => {
    try {
      // Se for URL do Supabase Storage, tentar baixar diretamente
      if (attachment.file_path.includes("supabase.co")) {
        window.open(attachment.file_path, "_blank")
      } else {
        // Fallback para outros tipos de URL
        const response = await fetch(attachment.file_path)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = attachment.filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error)
      // Fallback: abrir em nova aba
      window.open(attachment.file_path, "_blank")
    }
  }

  const handleDelete = async (attachment: Attachment) => {
    if (!confirm(`Tem certeza que deseja excluir "${attachment.filename}"?`)) {
      return
    }

    try {
      // Extrair caminho do arquivo da URL
      const url = new URL(attachment.file_path)
      const filePath = url.pathname.split("/storage/v1/object/public/attachments/")[1]

      if (filePath) {
        // Deletar do storage
        const { error: storageError } = await supabase.storage
          .from("attachments")
          .remove([filePath])

        if (storageError) {
          console.error("Erro ao deletar do storage:", storageError)
        }
      }

      // Deletar do banco
      const { error } = await supabase
        .from("attachments")
        .delete()
        .eq("id", attachment.id)

      if (error) throw error

      // Registrar no histórico
      await supabase.from("ticket_history").insert({
        ticket_id: ticketId,
        user_id: session?.user?.id || "",
        action: "Anexo removido",
        old_value: attachment.filename,
      })

      toast({
        title: "Sucesso",
        description: "Anexo excluído com sucesso",
      })

      if (onDelete) {
        onDelete()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir anexo",
        variant: "destructive",
      })
    }
  }

  if (attachments.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Anexos ({attachments.length})</h4>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between p-3 rounded border bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {(attachment.file_size / 1024).toFixed(1)} KB •{" "}
                  {format(new Date(attachment.created_at), "dd MMM yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDownload(attachment)}
                className="h-8 w-8"
              >
                <Download className="h-4 w-4" />
              </Button>
              {(session?.user?.role === "admin" ||
                session?.user?.role === "atendente" ||
                session?.user?.id === attachment.user_id) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(attachment)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

