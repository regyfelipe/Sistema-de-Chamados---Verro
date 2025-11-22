import { cookies } from 'next/headers';
import { locales, defaultLocale, type Locale, rtlLocales } from '@/i18n/config';

/**
 * Obtém o locale atual dos cookies
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value as Locale;
  return locale && locales.includes(locale) ? locale : defaultLocale;
}

/**
 * Verifica se o locale é RTL
 */
export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

/**
 * Carrega as mensagens de tradução
 */
export async function getMessages(locale: Locale) {
  try {
    const messages = await import(`@/messages/${locale}.json`);
    return messages.default;
  } catch (error) {
    const messages = await import(`@/messages/${defaultLocale}.json`);
    return messages.default;
  }
}

/**
 * Formata número de acordo com o locale
 */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata moeda de acordo com o locale
 */
export function formatCurrency(value: number, locale: Locale, currency: string = 'BRL'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
}

/**
 * Formata data de acordo com o locale
 */
export function formatDate(date: Date | string, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat(locale, options || defaultOptions).format(dateObj);
}

/**
 * Formata data e hora de acordo com o locale
 */
export function formatDateTime(date: Date | string, locale: Locale): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

