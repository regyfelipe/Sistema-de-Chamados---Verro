import { supabase } from "./supabase"
import { BrandingConfig } from "@/types/branding"

/**
 * Obtém a configuração de branding atual
 */
export async function getBrandingConfig(): Promise<BrandingConfig | null> {
  try {
    const { data, error } = await supabase
      .from("branding_config")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error("Erro ao buscar configuração de branding:", error)
      return null
    }

    return data as BrandingConfig
  } catch (error) {
    console.error("Erro ao buscar configuração de branding:", error)
    return null
  }
}

/**
 * Atualiza a configuração de branding
 */
export async function updateBrandingConfig(
  config: Partial<BrandingConfig>
): Promise<BrandingConfig | null> {
  try {
    
    const { data: existing } = await supabase
      .from("branding_config")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    const updateData = {
      ...config,
      updated_at: new Date().toISOString(),
    }

    let result

    if (existing) {
      
      const { data, error } = await supabase
        .from("branding_config")
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      
      const { data, error } = await supabase
        .from("branding_config")
        .insert(updateData)
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return result as BrandingConfig
  } catch (error) {
    console.error("Erro ao atualizar configuração de branding:", error)
    throw error
  }
}

/**
 * Faz upload de logo
 */
export async function uploadLogo(file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `logo-${Date.now()}.${fileExt}`
    const filePath = `branding/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("public")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) throw uploadError

    const {
      data: { publicUrl },
    } = supabase.storage.from("public").getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error("Erro ao fazer upload do logo:", error)
    throw error
  }
}

/**
 * Faz upload de favicon
 */
export async function uploadFavicon(file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `favicon-${Date.now()}.${fileExt}`
    const filePath = `branding/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("public")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) throw uploadError

    const {
      data: { publicUrl },
    } = supabase.storage.from("public").getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error("Erro ao fazer upload do favicon:", error)
    throw error
  }
}

/**
 * Aplica cores customizadas como CSS variables
 */
export function applyBrandingColors(colors: {
  primary?: string
  secondary?: string
  accent?: string
}) {
  if (typeof window === "undefined") return

  const root = document.documentElement

  if (colors.primary) {
    
    const hsl = hexToHsl(colors.primary)
    root.style.setProperty("--primary", hsl)
  }

  if (colors.secondary) {
    const hsl = hexToHsl(colors.secondary)
    root.style.setProperty("--secondary", hsl)
  }

  if (colors.accent) {
    const hsl = hexToHsl(colors.accent)
    root.style.setProperty("--accent", hsl)
  }
}

/**
 * Converte hex para HSL
 */
function hexToHsl(hex: string): string {
  
  hex = hex.replace("#", "")

  
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

