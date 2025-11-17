"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { QueryProvider } from "./providers/query-provider"
import { I18nProvider } from "./providers/i18n-provider"
import { BrandingProvider } from "./providers/branding-provider"
import { defaultLocale } from "@/i18n/config"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SessionProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <I18nProvider initialLocale={defaultLocale}>
            <BrandingProvider>
              {children}
            </BrandingProvider>
          </I18nProvider>
        </ThemeProvider>
      </SessionProvider>
    </QueryProvider>
  )
}

