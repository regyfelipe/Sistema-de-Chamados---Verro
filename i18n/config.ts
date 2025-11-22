export const locales = ['pt-BR', 'en-US', 'es-ES', 'ar-SA'] as const;
export const defaultLocale = 'pt-BR' as const;

export type Locale = (typeof locales)[number];


export const rtlLocales: Locale[] = ['ar-SA'];


export const localeNames: Record<Locale, string> = {
  'pt-BR': 'Português (BR)',
  'en-US': 'English (US)',
  'es-ES': 'Español (ES)',
  'ar-SA': 'العربية (SA)',
};


export const localeFlags: Record<Locale, string> = {
  'pt-BR': '🇧🇷',
  'en-US': '🇺🇸',
  'es-ES': '🇪🇸',
  'ar-SA': '🇸🇦',
};

