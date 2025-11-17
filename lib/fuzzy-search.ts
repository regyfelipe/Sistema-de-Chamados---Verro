import Fuse from "fuse.js"
import { Ticket } from "@/types"

/**
 * Configuração para busca fuzzy usando Fuse.js
 */
const fuseOptions = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "description", weight: 0.3 },
    { name: "id", weight: 0.2 },
    { name: "sector.name", weight: 0.05 },
    { name: "created_by_user.name", weight: 0.025 },
    { name: "assigned_to_user.name", weight: 0.025 },
  ],
  threshold: 0.4, // 0 = busca exata, 1 = aceita qualquer coisa
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
  findAllMatches: true,
}

/**
 * Busca fuzzy em tickets
 */
export function fuzzySearchTickets(
  tickets: Ticket[],
  query: string
): Ticket[] {
  if (!query || query.trim().length < 2) {
    return tickets
  }

  const fuse = new Fuse(tickets, fuseOptions)
  const results = fuse.search(query)

  return results.map((result) => result.item)
}

/**
 * Busca simples (fallback sem Fuse.js)
 * Tolerante a erros de digitação básicos
 */
export function simpleFuzzySearch(
  text: string,
  query: string
): boolean {
  if (!query || query.length < 2) return true

  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()

  // Busca exata
  if (textLower.includes(queryLower)) return true

  // Busca com tolerância a erros (até 1 caractere diferente a cada 4)
  const maxErrors = Math.floor(query.length / 4)
  let errors = 0
  let queryIndex = 0

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++
    } else {
      errors++
      if (errors > maxErrors) {
        // Tenta buscar a próxima ocorrência
        const nextIndex = textLower.indexOf(queryLower[0], i)
        if (nextIndex === -1) return false
        i = nextIndex
        queryIndex = 1
        errors = 0
      }
    }
  }

  return queryIndex === queryLower.length && errors <= maxErrors
}

/**
 * Busca em múltiplos campos com fuzzy
 */
export function searchInMultipleFields(
  ticket: Ticket,
  query: string
): boolean {
  if (!query || query.trim().length < 2) return true

  const queryLower = query.toLowerCase()

  // Campos para buscar
  const searchFields = [
    ticket.title,
    ticket.description,
    ticket.id,
    ticket.sector?.name || "",
    ticket.created_by_user?.name || "",
    ticket.assigned_to_user?.name || "",
  ]

  // Busca em cada campo
  for (const field of searchFields) {
    if (field && simpleFuzzySearch(field, query)) {
      return true
    }
  }

  return false
}

/**
 * Gera sugestões de busca baseadas nos tickets
 */
export function generateSearchSuggestions(
  tickets: Ticket[],
  query: string,
  limit: number = 5
): string[] {
  if (!query || query.length < 2) return []

  const suggestions = new Set<string>()
  const queryLower = query.toLowerCase()

  for (const ticket of tickets) {
    // Sugestões do título
    const titleWords = ticket.title.toLowerCase().split(/\s+/)
    for (const word of titleWords) {
      if (word.startsWith(queryLower) && word.length > queryLower.length) {
        suggestions.add(word)
        if (suggestions.size >= limit) break
      }
    }

    if (suggestions.size >= limit) break

    // Sugestões do setor
    if (ticket.sector?.name) {
      const sectorLower = ticket.sector.name.toLowerCase()
      if (sectorLower.startsWith(queryLower)) {
        suggestions.add(ticket.sector.name)
        if (suggestions.size >= limit) break
      }
    }
  }

  return Array.from(suggestions).slice(0, limit)
}

