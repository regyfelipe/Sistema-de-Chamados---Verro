import { supabase } from "./supabase"
import {
  AuditLog,
  AuditActionType,
  AuditEntityType,
  AuditSeverity,
  AuditConfig,
  AuditAlert,
  AuditFilters,
} from "@/types/audit"


export type { AuditFilters } from "@/types/audit"

/**
 * Registra uma ação de auditoria
 */
export async function logAuditEvent(data: {
  user_id?: string
  action_type: AuditActionType
  entity_type: AuditEntityType
  entity_id?: string
  description: string
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, any>
  severity?: AuditSeverity
}): Promise<void> {
  try {
    
    const { data: config } = await supabase
      .from("audit_config")
      .select("value")
      .eq("key", "enable_audit_logging")
      .single()

    if (config?.value === "false") {
      return 
    }

    
    let ipAddress = data.ip_address
    let userAgent = data.user_agent

    
    if (typeof window === "undefined" && !ipAddress) {
      
      ipAddress = undefined
    }

    await supabase.from("audit_logs").insert({
      user_id: data.user_id || null,
      action_type: data.action_type,
      entity_type: data.entity_type,
      entity_id: data.entity_id || null,
      description: data.description,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      metadata: data.metadata || null,
      severity: data.severity || "info",
    })

    
    if (data.severity === "warning" || data.severity === "error" || data.severity === "critical") {
      await checkSuspiciousActivity(data)
    }
  } catch (error) {
    console.error("Erro ao registrar log de auditoria:", error)
    
  }
}

/**
 * Verifica atividades suspeitas e cria alertas
 */
async function checkSuspiciousActivity(data: {
  user_id?: string
  action_type: AuditActionType
  entity_type: AuditEntityType
  severity?: AuditSeverity
}): Promise<void> {
  try {
    const { data: config } = await supabase
      .from("audit_config")
      .select("value")
      .eq("key", "enable_suspicious_alerts")
      .single()

    if (config?.value === "false") {
      return 
    }

    
    if (data.action_type === "bulk_operation" || data.action_type === "delete") {
      const { data: recentLogs } = await supabase
        .from("audit_logs")
        .select("id")
        .eq("user_id", data.user_id)
        .eq("action_type", data.action_type)
        .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString()) 

      const { data: configValue } = await supabase
        .from("audit_config")
        .select("value")
        .eq("key", "suspicious_mass_operations")
        .single()

      const threshold = parseInt(configValue?.value || "10")

      if (recentLogs && recentLogs.length >= threshold) {
        await supabase.from("audit_alerts").insert({
          alert_type: "mass_operation",
          user_id: data.user_id || null,
          description: `Múltiplas operações ${data.action_type} detectadas: ${recentLogs.length} em 1 hora`,
          severity: "warning",
          metadata: {
            action_type: data.action_type,
            count: recentLogs.length,
          },
        })
      }
    }

    
    if (data.action_type === "login" && data.severity === "error") {
      const { data: failedLogins } = await supabase
        .from("audit_logs")
        .select("id")
        .eq("action_type", "login")
        .eq("severity", "error")
        .gte("created_at", new Date(Date.now() - 15 * 60 * 1000).toISOString()) 

      const { data: configValue } = await supabase
        .from("audit_config")
        .select("value")
        .eq("key", "suspicious_login_attempts")
        .single()

      const threshold = parseInt(configValue?.value || "5")

      if (failedLogins && failedLogins.length >= threshold) {
        await supabase.from("audit_alerts").insert({
          alert_type: "suspicious_login",
          user_id: data.user_id || null,
          description: `Múltiplas tentativas de login falhadas: ${failedLogins.length} em 15 minutos`,
          severity: "critical",
          metadata: {
            failed_attempts: failedLogins.length,
          },
        })
      }
    }
  } catch (error) {
    console.error("Erro ao verificar atividade suspeita:", error)
  }
}

/**
 * Busca logs de auditoria com filtros
 */
export async function getAuditLogs(
  filters: AuditFilters = {},
  limit: number = 100,
  offset: number = 0
): Promise<{ logs: AuditLog[]; total: number }> {
  try {
    let query = supabase
      .from("audit_logs")
      .select(
        `
        *,
        user:users(id, name, email, role)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (filters.user_id) {
      query = query.eq("user_id", filters.user_id)
    }

    if (filters.action_type) {
      query = query.eq("action_type", filters.action_type)
    }

    if (filters.entity_type) {
      query = query.eq("entity_type", filters.entity_type)
    }

    if (filters.severity) {
      query = query.eq("severity", filters.severity)
    }

    if (filters.date_from) {
      query = query.gte("created_at", filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte("created_at", filters.date_to)
    }

    if (filters.search) {
      query = query.or(`description.ilike.%${filters.search}%,entity_id.ilike.%${filters.search}%`)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      logs: (data as AuditLog[]) || [],
      total: count || 0,
    }
  } catch (error) {
    console.error("Erro ao buscar logs de auditoria:", error)
    return { logs: [], total: 0 }
  }
}

/**
 * Exporta logs de auditoria para CSV
 */
export async function exportAuditLogsToCSV(filters: AuditFilters = {}): Promise<string> {
  try {
    const { logs } = await getAuditLogs(filters, 10000) 

    const headers = [
      "Data/Hora",
      "Usuário",
      "Ação",
      "Entidade",
      "ID da Entidade",
      "Descrição",
      "Severidade",
      "IP",
      "User Agent",
    ]

    const rows = logs.map((log) => [
      new Date(log.created_at).toLocaleString("pt-BR"),
      log.user?.name || log.user?.email || "Sistema",
      log.action_type,
      log.entity_type,
      log.entity_id || "",
      log.description,
      log.severity,
      log.ip_address || "",
      log.user_agent || "",
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    return csvContent
  } catch (error) {
    console.error("Erro ao exportar logs:", error)
    throw error
  }
}

/**
 * Obtém configurações de auditoria
 */
export async function getAuditConfig(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase.from("audit_config").select("key, value")

    if (error) throw error

    const config: Record<string, string> = {}
    data?.forEach((item) => {
      config[item.key] = item.value
    })

    return config
  } catch (error) {
    console.error("Erro ao buscar configurações de auditoria:", error)
    return {}
  }
}

/**
 * Atualiza configuração de auditoria
 */
export async function updateAuditConfig(
  key: string,
  value: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("audit_config")
      .upsert({ key, value, updated_at: new Date().toISOString() })

    if (error) throw error
  } catch (error) {
    console.error("Erro ao atualizar configuração de auditoria:", error)
    throw error
  }
}

/**
 * Obtém alertas de auditoria
 */
export async function getAuditAlerts(
  resolved: boolean | null = null,
  limit: number = 50
): Promise<AuditAlert[]> {
  try {
    let query = supabase
      .from("audit_alerts")
      .select(
        `
        *,
        user:users(id, name, email)
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit)

    if (resolved !== null) {
      query = query.eq("is_resolved", resolved)
    }

    const { data, error } = await query

    if (error) throw error

    return (data as AuditAlert[]) || []
  } catch (error) {
    console.error("Erro ao buscar alertas de auditoria:", error)
    return []
  }
}

/**
 * Resolve um alerta de auditoria
 */
export async function resolveAuditAlert(
  alertId: string,
  resolvedBy: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("audit_alerts")
      .update({
        is_resolved: true,
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", alertId)

    if (error) throw error
  } catch (error) {
    console.error("Erro ao resolver alerta:", error)
    throw error
  }
}

/**
 * Limpa logs antigos baseado na configuração de retenção
 */
export async function cleanupOldAuditLogs(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc("cleanup_old_audit_logs")

    if (error) throw error

    return data || 0
  } catch (error) {
    console.error("Erro ao limpar logs antigos:", error)
    return 0
  }
}

