"use client"

import { useI18n } from "@/components/providers/i18n-provider"

/**
 * Hook para usar i18n (alias para useI18n)
 */
export function useTranslation() {
  return useI18n()
}

