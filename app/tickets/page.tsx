import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { TicketsList } from "@/components/tickets/tickets-list"
import { getTicketsWithAccess } from "@/lib/ticket-access"
import { supabase } from "@/lib/supabase"

export default async function TicketsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  
  const { data: userData } = await supabase
    .from("users")
    .select("sector_id")
    .eq("id", session.user.id)
    .single()

  
  const tickets = await getTicketsWithAccess(
    session.user.id,
    session.user.role || "solicitante",
    userData?.sector_id
  )

  return (
    <MainLayout>
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Chamados</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            Gerencie todos os chamados do sistema
          </p>
        </div>

        <TicketsList initialTickets={tickets} />
      </div>
    </MainLayout>
  )
}

