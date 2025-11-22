const SEARCH_HISTORY_KEY = "ticket-search-history"
const MAX_HISTORY_ITEMS = 10

export interface SearchHistoryItem {
  id: string
  query: string
  timestamp: number
  resultCount?: number
}

/**
 * Salva uma busca no histórico
 */
export function saveSearchToHistory(query: string, resultCount?: number): void {
  if (typeof window === "undefined") return
  if (!query || query.trim().length < 2) return

  try {
    const history = getSearchHistory()
    
   
    const filteredHistory = history.filter((item) => item.query !== query)
    
   
    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query: query.trim(),
      timestamp: Date.now(),
      resultCount,
    }
    
    const updatedHistory = [newItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS)
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory))
  } catch (error) {
    console.error("Erro ao salvar histórico de busca:", error)
  }
}

/**
 * Obtém o histórico de buscas
 */
export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (!stored) return []
    
    const history = JSON.parse(stored) as SearchHistoryItem[]
    
   
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    return history.filter((item) => item.timestamp > thirtyDaysAgo)
  } catch (error) {
    console.error("Erro ao ler histórico de busca:", error)
    return []
  }
}

/**
 * Remove uma busca do histórico
 */
export function removeSearchFromHistory(id: string): void {
  if (typeof window === "undefined") return
  
  try {
    const history = getSearchHistory()
    const filtered = history.filter((item) => item.id !== id)
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error("Erro ao remover do histórico de busca:", error)
  }
}

/**
 * Limpa todo o histórico
 */
export function clearSearchHistory(): void {
  if (typeof window === "undefined") return
  
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  } catch (error) {
    console.error("Erro ao limpar histórico de busca:", error)
  }
}

/**
 * Obtém sugestões baseadas no histórico
 */
export function getHistorySuggestions(query: string, limit: number = 5): string[] {
  if (typeof window === "undefined") return []
  
  if (!query || query.length < 1) {
   
    return getSearchHistory()
      .slice(0, limit)
      .map((item) => item.query)
  }

  const history = getSearchHistory()
  const queryLower = query.toLowerCase()
  
 
  return history
    .filter((item) => item.query.toLowerCase().startsWith(queryLower))
    .slice(0, limit)
    .map((item) => item.query)
}

