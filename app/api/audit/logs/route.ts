import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getAuditLogs, AuditFilters } from "@/lib/audit"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== "admin" && session.user.role !== "super_admin")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    const filters: AuditFilters = {
      user_id: searchParams.get("user_id") || undefined,
      action_type: searchParams.get("action_type") as any || undefined,
      entity_type: searchParams.get("entity_type") as any || undefined,
      severity: searchParams.get("severity") as any || undefined,
      date_from: searchParams.get("date_from") || undefined,
      date_to: searchParams.get("date_to") || undefined,
      search: searchParams.get("search") || undefined,
    }

    const offset = (page - 1) * limit
    const result = await getAuditLogs(filters, limit, offset)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Erro ao buscar logs:", error)
    return NextResponse.json({ error: "Erro ao buscar logs" }, { status: 500 })
  }
}

