"use client"

import { useState, useEffect } from "react"
import { getBrandingConfig } from "@/lib/branding"
import { BrandingConfig } from "@/types/branding"
import Image from "next/image"
import { useI18n } from "@/components/providers/i18n-provider"

export function BrandedLogo() {
  const { t } = useI18n()
  const [config, setConfig] = useState<BrandingConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBranding()
  }, [])

  const loadBranding = async () => {
    try {
      const branding = await getBrandingConfig()
      setConfig(branding)
    } catch (error) {
      console.error("Erro ao carregar branding:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <h2 className="text-lg font-semibold">{t("common.appName")}</h2>
  }

  if (config?.logo_url) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative h-8 w-auto">
          <Image
            src={config.logo_url}
            alt={config.company_name || t("common.appName")}
            width={120}
            height={32}
            className="h-8 w-auto object-contain"
            priority
          />
        </div>
      </div>
    )
  }

  return <h2 className="text-lg font-semibold">{config?.company_name || t("common.appName")}</h2>
}

