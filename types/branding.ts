export interface BrandingConfig {
  id: string
  company_name: string
  logo_url?: string | null
  favicon_url?: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  layout_style: 'default' | 'compact' | 'spacious' | 'modern'
  created_at: string
  updated_at: string
}

export interface BrandingColors {
  primary: string
  secondary: string
  accent: string
}

