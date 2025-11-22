export interface TicketRating {
  id: string
  ticket_id: string
  user_id: string
  rating: number
  comment?: string
  nps_score?: number
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
    promoters: number
    passives: number
    detractors: number
    score: number
  }
}

export type NPSCategory = "promoter" | "passive" | "detractor"

