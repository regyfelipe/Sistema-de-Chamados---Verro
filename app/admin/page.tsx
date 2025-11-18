import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { AdminPanel } from "@/components/admin/admin-panel"
import { supabase } from "@/lib/supabase"

async function getAdminData() {
  const [sectorsResult, usersResult] = await Promise.all([
    supabase.from("sectors").select("*").order("name"),
    supabase.from("users").select("*").order("name"),
  ])

  return {
    sectors: sectorsResult.data || [],
    users: usersResult.data || [],
  }
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  if (session.user?.role !== "admin" && session.user?.role !== "super_admin") {
    redirect("/dashboard")
  }

  const { sectors, users } = await getAdminData()

  return (
    <MainLayout>
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Administração</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            Gerencie setores, usuários e configurações do sistema
          </p>
        </div>

        <AdminPanel initialSectors={sectors} initialUsers={users} />
      </div>
    </MainLayout>
  )
}

