/**
 * Aplica estilos de layout baseado na configuração
 */
export function applyLayoutStyle(style: 'default' | 'compact' | 'spacious' | 'modern') {
  if (typeof window === 'undefined') return

  const root = document.documentElement
  root.classList.remove('layout-default', 'layout-compact', 'layout-spacious', 'layout-modern')
  root.classList.add(`layout-${style}`)
}

/**
 * Classes CSS para diferentes estilos de layout
 */
export const layoutStyles = {
  default: '',
  compact: `
    .layout-compact .container { max-width: 1200px; }
    .layout-compact .card { padding: 1rem; }
    .layout-compact .text-lg { font-size: 0.875rem; }
  `,
  spacious: `
    .layout-spacious .container { max-width: 1600px; }
    .layout-spacious .card { padding: 2rem; }
    .layout-spacious .space-y-4 > * + * { margin-top: 1.5rem; }
  `,
  modern: `
    .layout-modern .card { border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .layout-modern .button { border-radius: 0.75rem; }
  `,
}

