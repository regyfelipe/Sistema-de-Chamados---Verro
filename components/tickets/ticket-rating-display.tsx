"use client"

import { TicketRating } from "@/types/ratings"
import { Star } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TicketRatingDisplayProps {
  rating: TicketRating
}

export function TicketRatingDisplay({ rating }: TicketRatingDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          Avaliação do Atendimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-5 w-5",
                  star <= rating.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {rating.rating}/5
          </span>
        </div>

        {rating.comment && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Comentário:</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {rating.comment}
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Avaliado por {rating.user?.name || "Usuário"} em{" "}
          {format(new Date(rating.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
            locale: ptBR,
          })}
        </div>
      </CardContent>
    </Card>
  )
}

