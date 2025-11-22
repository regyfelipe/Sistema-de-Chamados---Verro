"use client"

import { useEffect, useState } from "react"
import { getBrandingConfig } from "@/lib/branding"
import { BrandingConfig } from "@/types/branding"
import { applyBrandingColors } from "@/lib/branding"
import { applyLayoutStyle } from "@/lib/layout-styles"

interface BrandingProviderProps {
  children: React.ReactNode
}

export function BrandingProvider({ children }: BrandingProviderProps) {
  const [config, setConfig] = useState<BrandingConfig | null>(null)

  useEffect(() => {
    loadBranding()
    
  }, [])

  const loadBranding = async () => {
    try {
      const branding = await getBrandingConfig()
      if (branding) {
        setConfig(branding)
        
        
        applyBrandingColors({
          primary: branding.primary_color,
          secondary: branding.secondary_color,
          accent: branding.accent_color,
        })

        
        applyLayoutStyle(branding.layout_style)

        
        if (branding.favicon_url) {
          updateFavicon(branding.favicon_url)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar branding:", error)
    }
  }

  const updateFavicon = (url: string) => {
    
    const existingFavicons = document.querySelectorAll('link[rel="icon"]')
    existingFavicons.forEach((fav) => fav.remove())

    
    const link = document.createElement("link")
    link.rel = "icon"
    link.href = url
    document.head.appendChild(link)
  }

  return <>{children}</>
}

