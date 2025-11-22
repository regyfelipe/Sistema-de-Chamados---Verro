import { supabase } from "./supabase"
import { TicketRating, RatingStats, NPSCategory } from "@/types/ratings"

/**
 * Cria uma avaliação para um chamado
 */
export async function createRating(data: {
  ticket_id: string
  user_id: string
  rating: number
  comment?: string
}): Promise<TicketRating | null> {
  try {
   
   
    const npsScore = data.rating === 1 ? 2 : 
                     data.rating === 2 ? 4 :
                     data.rating === 3 ? 6 :
                     data.rating === 4 ? 8 : 10

    const { data: rating, error } = await supabase
      .from("ticket_ratings")
      .insert([{
        ...data,
        nps_score: npsScore,
      }])
      .select(`
        *,
        user:users(id, name, email),
        ticket:tickets(id, title)
      `)
      .single()

    if (error) {
      console.error("Erro ao criar avaliação:", error)
      return null
    }

    return rating
  } catch (error) {
    console.error("Erro ao criar avaliação:", error)
    return null
  }
}

/**
 * Atualiza uma avaliação existente
 */
export async function updateRating(
  id: string,
  updates: {
    rating?: number
    comment?: string
  }
): Promise<boolean> {
  try {
    const updateData: any = { ...updates }

   
    if (updates.rating) {
      updateData.nps_score = updates.rating === 1 ? 2 : 
                            updates.rating === 2 ? 4 :
                            updates.rating === 3 ? 6 :
                            updates.rating === 4 ? 8 : 10
    }

    const { error } = await supabase
      .from("ticket_ratings")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("Erro ao atualizar avaliação:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao atualizar avaliação:", error)
    return false
  }
}

/**
 * Busca avaliação de um chamado por usuário
 */
export async function getRatingByTicketAndUser(
  ticketId: string,
  userId: string
): Promise<TicketRating | null> {
  try {
    const { data, error } = await supabase
      .from("ticket_ratings")
      .select(`
        *,
        user:users(id, name, email),
        ticket:tickets(id, title)
      `)
      .eq("ticket_id", ticketId)
      .eq("user_id", userId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
       
        return null
      }
      console.error("Erro ao buscar avaliação:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Erro ao buscar avaliação:", error)
    return null
  }
}

/**
 * Busca todas as avaliações de um chamado
 */
export async function getRatingsByTicket(
  ticketId: string
): Promise<TicketRating[]> {
  try {
    const { data, error } = await supabase
      .from("ticket_ratings")
      .select(`
        *,
        user:users(id, name, email),
        ticket:tickets(id, title)
      `)
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar avaliações:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Erro ao buscar avaliações:", error)
    return []
  }
}

/**
 * Busca todas as avaliações (para dashboard)
 */
export async function getAllRatings(limit: number = 100): Promise<TicketRating[]> {
  try {
    const { data, error } = await supabase
      .from("ticket_ratings")
      .select(`
        *,
        user:users(id, name, email),
        ticket:tickets(id, title)
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Erro ao buscar avaliações:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Erro ao buscar avaliações:", error)
    return []
  }
}

/**
 * Calcula estatísticas de avaliações
 */
export async function getRatingStats(): Promise<RatingStats> {
  try {
    const { data: ratings, error } = await supabase
      .from("ticket_ratings")
      .select("rating, nps_score")

    if (error) {
      console.error("Erro ao buscar estatísticas:", error)
      return {
        total: 0,
        average: 0,
        distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
        nps: { promoters: 0, passives: 0, detractors: 0, score: 0 },
      }
    }

    if (!ratings || ratings.length === 0) {
      return {
        total: 0,
        average: 0,
        distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
        nps: { promoters: 0, passives: 0, detractors: 0, score: 0 },
      }
    }

    const total = ratings.length
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0)
    const average = sum / total

    const distribution = {
      "1": ratings.filter((r) => r.rating === 1).length,
      "2": ratings.filter((r) => r.rating === 2).length,
      "3": ratings.filter((r) => r.rating === 3).length,
      "4": ratings.filter((r) => r.rating === 4).length,
      "5": ratings.filter((r) => r.rating === 5).length,
    }

   
    const promoters = ratings.filter((r) => r.nps_score && r.nps_score >= 9).length
    const passives = ratings.filter((r) => r.nps_score && r.nps_score >= 7 && r.nps_score <= 8).length
    const detractors = ratings.filter((r) => r.nps_score && r.nps_score <= 6).length
    const npsScore = total > 0 ? ((promoters - detractors) / total) * 100 : 0

    return {
      total,
      average: Math.round(average * 10) / 10,
      distribution,
      nps: {
        promoters,
        passives,
        detractors,
        score: Math.round(npsScore * 10) / 10,
      },
    }
  } catch (error) {
    console.error("Erro ao calcular estatísticas:", error)
    return {
      total: 0,
      average: 0,
      distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
      nps: { promoters: 0, passives: 0, detractors: 0, score: 0 },
    }
  }
}

/**
 * Determina categoria NPS baseado no score
 */
export function getNPSCategory(score: number): NPSCategory {
  if (score >= 9) return "promoter"
  if (score >= 7) return "passive"
  return "detractor"
}

