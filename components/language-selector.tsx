"use client"

import { useI18n } from "@/components/providers/i18n-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Languages } from "lucide-react"
import { locales, localeNames, localeFlags, type Locale } from "@/i18n/config"

export function LanguageSelector() {
  const { locale, setLocale } = useI18n()

  return (
    <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
      <SelectTrigger className="w-[120px] sm:w-[140px]">
        <Languages className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            <span className="flex items-center gap-2">
              <span>{localeFlags[loc]}</span>
              <span>{localeNames[loc]}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

