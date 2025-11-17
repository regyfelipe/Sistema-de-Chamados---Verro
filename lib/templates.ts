import { supabase } from "./supabase"
import { CommentTemplate, TemplateVariables } from "@/types/templates"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

/**
 * Busca templates disponíveis para um setor
 */
export async function getTemplates(
  sectorId?: string,
  userId?: string
): Promise<CommentTemplate[]> {
  try {
    let query = supabase
      .from("comment_templates")
      .select(`
        *,
        sector:sectors(id, name),
        created_by_user:users!comment_templates_created_by_fkey(id, name)
      `)

    // Buscar templates globais ou do setor específico
    if (sectorId) {
      query = query.or(`is_global.eq.true,sector_id.eq.${sectorId}`)
    } else {
      query = query.eq("is_global", true)
    }

    const { data, error } = await query.order("name", { ascending: true })

    if (error) {
      console.error("Erro ao buscar templates:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Erro ao buscar templates:", error)
    return []
  }
}

/**
 * Cria um novo template
 */
export async function createTemplate(
  template: Omit<CommentTemplate, "id" | "created_at" | "updated_at">
): Promise<CommentTemplate | null> {
  try {
    const { data, error } = await supabase
      .from("comment_templates")
      .insert([template])
      .select(`
        *,
        sector:sectors(id, name),
        created_by_user:users!comment_templates_created_by_fkey(id, name)
      `)
      .single()

    if (error) {
      console.error("Erro ao criar template:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Erro ao criar template:", error)
    return null
  }
}

/**
 * Atualiza um template
 */
export async function updateTemplate(
  id: string,
  updates: Partial<CommentTemplate>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("comment_templates")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("Erro ao atualizar template:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao atualizar template:", error)
    return false
  }
}

/**
 * Deleta um template
 */
export async function deleteTemplate(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("comment_templates")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Erro ao deletar template:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao deletar template:", error)
    return false
  }
}

/**
 * Substitui variáveis no template
 */
export function replaceTemplateVariables(
  template: string,
  variables: TemplateVariables
): string {
  let result = template

  // Variáveis disponíveis
  const replacements: Record<string, string> = {
    "{{user_name}}": variables.user_name || "[Nome do Usuário]",
    "{{current_user_name}}": variables.current_user_name || "[Seu Nome]",
    "{{ticket_id}}": variables.ticket_id || "[ID do Chamado]",
    "{{ticket_title}}": variables.ticket_title || "[Título do Chamado]",
    "{{ticket_status}}": variables.ticket_status || "[Status]",
    "{{ticket_priority}}": variables.ticket_priority || "[Prioridade]",
    "{{sector_name}}": variables.sector_name || "[Setor]",
    "{{assigned_to_name}}": variables.assigned_to_name || "[Responsável]",
    "{{current_date}}": variables.current_date || format(new Date(), "dd/MM/yyyy", { locale: ptBR }),
    "{{current_time}}": variables.current_time || format(new Date(), "HH:mm", { locale: ptBR }),
    "{{current_datetime}}": `${format(new Date(), "dd/MM/yyyy", { locale: ptBR })} às ${format(new Date(), "HH:mm", { locale: ptBR })}`,
  }

  // Substituir todas as variáveis
  Object.entries(replacements).forEach(([key, value]) => {
    result = result.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value)
  })

  return result
}

