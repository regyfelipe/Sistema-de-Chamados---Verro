export const locales = ['pt-BR', 'en-US', 'es-ES', 'ar-SA'] as const;
export const defaultLocale = 'pt-BR' as const;

export type Locale = (typeof locales)[number];

// Locales com suporte RTL (Right-to-Left)
export const rtlLocales: Locale[] = ['ar-SA'];

// Mapeamento de locales para nomes
export const localeNames: Record<Locale, string> = {
  'pt-BR': 'Português (BR)',
  'en-US': 'English (US)',
  'es-ES': 'Español (ES)',
  'ar-SA': 'العربية (SA)',
};

// Mapeamento de locales para ícones de bandeira (opcional)
export const localeFlags: Record<Locale, string> = {
  'pt-BR': '🇧🇷',
  'en-US': '🇺🇸',
  'es-ES': '🇪🇸',
  'ar-SA': '🇸🇦',
};

