"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { Locale, locales, defaultLocale, localeNames, localeFlags, rtlLocales } from "@/i18n/config"

type Messages = Record<string, any>

interface I18nContextType {
  locale: Locale
  messages: Messages
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, any>) => string
  formatNumber: (value: number) => string
  formatCurrency: (value: number, currency?: string) => string
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string
  formatDateTime: (date: Date | string) => string
  isRTL: boolean
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: ReactNode
  initialLocale?: Locale
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  // Inicializar com locale do localStorage ou padrão
  const getInitialLocale = (): Locale => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('locale') as Locale
      if (saved && locales.includes(saved)) {
        return saved
      }
    }
    return initialLocale || defaultLocale
  }

  const [locale, setLocaleState] = useState<Locale>(getInitialLocale())
  const [messages, setMessages] = useState<Messages>({})
  const [isRTL, setIsRTL] = useState(rtlLocales.includes(locale))

  // Carregar mensagens quando o locale muda
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const msgs = await import(`@/messages/${locale}.json`)
        setMessages(msgs.default)
        const rtl = rtlLocales.includes(locale)
        setIsRTL(rtl)
        
        // Salvar no localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('locale', locale)
          
          // Atualizar dir do HTML para RTL
          if (rtl) {
            document.documentElement.dir = 'rtl'
            document.documentElement.lang = locale
            document.documentElement.classList.add('rtl')
          } else {
            document.documentElement.dir = 'ltr'
            document.documentElement.lang = locale
            document.documentElement.classList.remove('rtl')
          }
        }
      } catch (error) {
        console.error(`Erro ao carregar mensagens para ${locale}:`, error)
      }
    }

    loadMessages()
  }, [locale])

  const setLocale = (newLocale: Locale) => {
    if (locales.includes(newLocale)) {
      setLocaleState(newLocale)
    }
  }

  // Função de tradução
  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split('.')
    let value: any = messages

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key // Retornar a chave se não encontrar
      }
    }

    if (typeof value !== 'string') {
      return key
    }

    // Substituir parâmetros
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : match
      })
    }

    return value
  }

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatCurrency = (value: number, currency: string = 'BRL'): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(value)
  }

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
    return new Intl.DateTimeFormat(locale, options || defaultOptions).format(dateObj)
  }

  const formatDateTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj)
  }

  return (
    <I18nContext.Provider
      value={{
        locale,
        messages,
        setLocale,
        t,
        formatNumber,
        formatCurrency,
        formatDate,
        formatDateTime,
        isRTL,
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n deve ser usado dentro de I18nProvider")
  }
  return context
}

