"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { createRating } from "@/lib/ratings"
import { useToast } from "@/components/ui/use-toast"
import { Ticket } from "@/types"

interface RatingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: Ticket
  userId: string
  onRatingSubmitted?: () => void
}

export function RatingDialog({
  open,
  onOpenChange,
  ticket,
  userId,
  onRatingSubmitted,
}: RatingDialogProps) {
  const { toast } = useToast()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Avaliação necessária",
        description: "Por favor, selecione uma avaliação de 1 a 5 estrelas",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const result = await createRating({
        ticket_id: ticket.id,
        user_id: userId,
        rating,
        comment: comment.trim() || undefined,
      })

      if (result) {
        toast({
          title: "Avaliação enviada",
          description: "Obrigado pelo seu feedback!",
        })
        setRating(0)
        setComment("")
        onOpenChange(false)
        if (onRatingSubmitted) {
          onRatingSubmitted()
        }
      } else {
        throw new Error("Erro ao salvar avaliação")
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar avaliação",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Avalie o Atendimento</DialogTitle>
          <DialogDescription>
            Ajude-nos a melhorar! Avalie sua experiência com o chamado{" "}
            <strong>#{ticket.id.slice(0, 8)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Stars */}
          <div className="space-y-2">
            <Label>Como você avalia o atendimento? *</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                  disabled={loading}
                >
                  <Star
                    className={cn(
                      "h-10 w-10 transition-colors",
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                    )}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm font-medium text-muted-foreground">
                  {rating === 1 && "Péssimo"}
                  {rating === 2 && "Ruim"}
                  {rating === 3 && "Regular"}
                  {rating === 4 && "Bom"}
                  {rating === 5 && "Excelente"}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="rating-comment">
              Comentário (opcional)
            </Label>
            <Textarea
              id="rating-comment"
              placeholder="Deixe seu feedback sobre o atendimento..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Pular
          </Button>
          <Button onClick={handleSubmit} disabled={loading || rating === 0}>
            {loading ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

