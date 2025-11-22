"use client"

import { useState, useRef } from "react"
import { Upload, X, File, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Attachment } from "@/types"

interface AttachmentUploadProps {
  ticketId: string
  commentId?: string
  userId: string
  onUploadComplete?: (attachment: Attachment) => void
}

export function AttachmentUpload({
  ticketId,
  commentId,
  userId,
  onUploadComplete,
}: AttachmentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)

    try {
      for (const file of files) {
       
        const fileExt = file.name.split(".").pop()
        const fileName = `${ticketId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `attachments/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(filePath, file)

        if (uploadError) {
         
          if (uploadError.message.includes("Bucket not found")) {
            toast({
              title: "Erro",
              description: "Bucket de anexos não configurado. Configure no Supabase Storage.",
              variant: "destructive",
            })
            continue
          }
          throw uploadError
        }

       
        const {
          data: { publicUrl },
        } = supabase.storage.from("attachments").getPublicUrl(filePath)

       
        const { data: attachment, error: dbError } = await supabase
          .from("attachments")
          .insert({
            ticket_id: ticketId,
            comment_id: commentId || null,
            user_id: userId,
            filename: file.name,
            file_path: publicUrl,
            file_size: file.size,
            file_type: file.type,
          })
          .select()
          .single()

        if (dbError) throw dbError

       
        await supabase.from("ticket_history").insert({
          ticket_id: ticketId,
          user_id: userId,
          action: "Anexo adicionado",
          new_value: file.name,
        })

        if (onUploadComplete && attachment) {
          onUploadComplete(attachment as Attachment)
        }
      }

      toast({
        title: "Sucesso",
        description: `${files.length} arquivo(s) enviado(s) com sucesso`,
      })

      setFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer upload dos arquivos",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          Anexar Arquivos
        </Button>
        {files.length > 0 && (
          <Button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            size="sm"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Enviar ({files.length})
              </>
            )}
          </Button>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded border bg-muted/50"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFile(index)}
                className="h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

