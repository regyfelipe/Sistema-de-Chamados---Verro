"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Ticket } from "@/types"
import { fuzzySearchTickets, generateSearchSuggestions } from "@/lib/fuzzy-search"
import {
  getSearchHistory,
  getHistorySuggestions,
  saveSearchToHistory,
  removeSearchFromHistory,
  clearSearchHistory,
} from "@/lib/search-history"
import { Search, X, Clock, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface GlobalSearchProps {
  tickets: Ticket[]
  onSearchChange?: (query: string) => void
  className?: string
}

export function GlobalSearch({
  tickets,
  onSearchChange,
  className,
}: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [historySuggestions, setHistorySuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  // Atualizar sugestões quando a query muda
  useEffect(() => {
    if (query.length >= 1) {
      // Sugestões do histórico
      const history = getHistorySuggestions(query, 3)
      setHistorySuggestions(history)

      // Sugestões dos tickets
      const ticketSuggestions = generateSearchSuggestions(tickets, query, 5)
      setSuggestions(ticketSuggestions)
    } else {
      // Se não há query, mostrar histórico recente
      const recentHistory = getSearchHistory().slice(0, 5).map((item) => item.query)
      setHistorySuggestions(recentHistory)
      setSuggestions([])
    }
  }, [query, tickets])

  // Abrir popover quando há foco ou query
  useEffect(() => {
    if (query.length > 0 || inputRef.current === document.activeElement) {
      setIsOpen(true)
    }
  }, [query])

  const handleInputChange = (value: string) => {
    setQuery(value)
    setSelectedIndex(-1)
    onSearchChange?.(value)
  }

  const handleSelectSuggestion = (suggestion: string) => {
    setQuery(suggestion)
    setIsOpen(false)
    inputRef.current?.blur()
    onSearchChange?.(suggestion)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const allSuggestions = [...historySuggestions, ...suggestions]

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) =>
        prev < allSuggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
        handleSelectSuggestion(allSuggestions[selectedIndex])
      } else if (query.trim()) {
        // Executar busca
        const results = fuzzySearchTickets(tickets, query)
        saveSearchToHistory(query, results.length)
        setIsOpen(false)
        router.push(`/tickets?search=${encodeURIComponent(query)}`)
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  const handleClear = () => {
    setQuery("")
    setSelectedIndex(-1)
    onSearchChange?.("")
    inputRef.current?.focus()
  }

  const handleRemoveHistoryItem = (queryToRemove: string) => {
    const history = getSearchHistory()
    const item = history.find((h) => h.query === queryToRemove)
    if (item) {
      removeSearchFromHistory(item.id)
      setHistorySuggestions(getHistorySuggestions(query, 3))
    }
  }

  const allSuggestions = [...historySuggestions, ...suggestions]
  const hasSuggestions = allSuggestions.length > 0

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Buscar chamados..."
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              className="pl-10 pr-10"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {hasSuggestions ? (
            <div className="py-2">
              {historySuggestions.length > 0 && (
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Histórico
                </div>
              )}
              {historySuggestions.map((suggestion, index) => (
                <div
                  key={`history-${index}`}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent",
                    selectedIndex === index && "bg-accent"
                  )}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{suggestion}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveHistoryItem(suggestion)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {suggestions.length > 0 && (
                <>
                  {historySuggestions.length > 0 && (
                    <div className="border-t my-1" />
                  )}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    Sugestões
                  </div>
                  {suggestions.map((suggestion, index) => {
                    const globalIndex = historySuggestions.length + index
                    return (
                      <div
                        key={`suggestion-${index}`}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent",
                          selectedIndex === globalIndex && "bg-accent"
                        )}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                      >
                        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{suggestion}</span>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          ) : query.length >= 2 ? (
            <div className="py-4 px-3 text-sm text-muted-foreground text-center">
              Nenhuma sugestão encontrada
            </div>
          ) : (
            <div className="py-4 px-3 text-sm text-muted-foreground text-center">
              Digite para buscar...
            </div>
          )}

          {query.trim() && (
            <>
              <div className="border-t" />
              <div className="p-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const results = fuzzySearchTickets(tickets, query)
                    saveSearchToHistory(query, results.length)
                    setIsOpen(false)
                    router.push(`/tickets?search=${encodeURIComponent(query)}`)
                  }}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar "{query}"
                </Button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

