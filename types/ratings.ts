export interface TicketRating {
  id: string
  ticket_id: string
  user_id: string
  rating: number // 1-5 estrelas
  comment?: string
  nps_score?: number // 0-10 para cálculo NPS
  created_at: string
  updated_at: string
  user?: {
    id: string
    name: string
    email: string
  }
  ticket?: {
    id: string
    title: string
  }
}

export interface RatingStats {
  total: number
  average: number
  distribution: {
    "1": number
    "2": number
    "3": number
    "4": number
    "5": number
  }
  nps: {
    promoters: number // 9-10
    passives: number // 7-8
    detractors: number // 0-6
    score: number // NPS = (Promotores - Detratores) / Total * 100
  }
}

export type NPSCategory = "promoter" | "passive" | "detractor"

