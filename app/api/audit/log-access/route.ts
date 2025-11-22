import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logAuditEvent } from "@/lib/audit"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()

    const { path, user_id, ip_address, user_agent } = body

    const importantPaths = [
      "/dashboard",
      "/tickets",
      "/admin",
      "/kanban",
    ]

    if (importantPaths.some((p) => path.startsWith(p))) {
      await logAuditEvent({
        user_id: user_id || session?.user?.id,
        action_type: "view",
        entity_type: "system",
        description: `Acesso à página: ${path}`,
        ip_address,
        user_agent,
        severity: "info",
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao registrar acesso:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

