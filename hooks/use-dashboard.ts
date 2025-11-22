"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import {
  getTicketsBySector,
  getTicketsByPriority,
  getTicketsOverTime,
  getSLAMetrics,
  getTopAttendants,
} from "@/lib/dashboard-stats"
import { getRatingStats } from "@/lib/ratings"
import { getPerformanceMetrics } from "@/lib/performance-metrics"
import { supabase } from "@/lib/supabase"


export function useDashboardData() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const userRole = session?.user?.role || "solicitante"

  return useQuery({
    queryKey: ["dashboard", userId, userRole],
    queryFn: async () => {
      if (!userId) return null

      
      const { data: userData } = await supabase
        .from("users")
        .select("sector_id")
        .eq("id", userId)
        .single()

      const userSectorId = userData?.sector_id

      const [
        ticketsBySector,
        ticketsByPriority,
        ticketsOverTime,
        slaMetrics,
        topAttendants,
        ratingStats,
        performanceMetrics,
      ] = await Promise.all([
        getTicketsBySector(userId, userRole, userSectorId),
        getTicketsByPriority(userId, userRole, userSectorId),
        getTicketsOverTime(30, userId, userRole, userSectorId),
        getSLAMetrics(userId, userRole, userSectorId),
        getTopAttendants(5, userId, userRole, userSectorId),
        getRatingStats(),
        getPerformanceMetrics(),
      ])

      return {
        ticketsBySector,
        ticketsByPriority,
        ticketsOverTime,
        slaMetrics,
        topAttendants,
        ratingStats,
        performanceMetrics,
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, 
  })
}

