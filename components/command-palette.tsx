"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Ticket, Search, Settings, LayoutDashboard, Clock } from "lucide-react"
import { Ticket as TicketType } from "@/types"
import { fuzzySearchTickets } from "@/lib/fuzzy-search"
import { getSearchHistory, getHistorySuggestions } from "@/lib/search-history"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useSession } from "next-auth/react"
import { getTicketsWithAccess } from "@/lib/ticket-access"

interface CommandPaletteProps {
  tickets?: TicketType[]
}

export function CommandPalette({ tickets: initialTickets }: CommandPaletteProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [tickets, setTickets] = useState<TicketType[]>(initialTickets || [])
  const router = useRouter()

  // Carregar tickets quando o palette abrir
  useEffect(() => {
    if (open && tickets.length === 0 && session?.user) {
      loadTickets()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, session])

  const loadTickets = async () => {
    if (!session?.user) return

    try {
      // Buscar dados completos do usuário
      const { data: userData } = await supabase
        .from("users")
        .select("sector_id")
        .eq("id", session.user.id)
        .single()

      // Buscar tickets com filtro de acesso
      const filteredTickets = await getTicketsWithAccess(
        session.user.id,
        session.user.role || "solicitante",
        userData?.sector_id
      )

      // Limitar a 100 para performance
      setTickets(filteredTickets.slice(0, 100))
    } catch (error) {
      console.error("Erro ao carregar tickets:", error)
    }
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Busca fuzzy nos tickets
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return []
    return fuzzySearchTickets(tickets, searchQuery).slice(0, 5)
  }, [searchQuery, tickets])

  // Histórico de buscas
  const historySuggestions = useMemo(() => {
    if (searchQuery.length >= 1) {
      return getHistorySuggestions(searchQuery, 3)
    }
    return getSearchHistory().slice(0, 3).map((item) => item.query)
  }, [searchQuery])

  const runCommand = (command: () => void) => {
    setOpen(false)
    setSearchQuery("")
    command()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline-flex">Buscar...</span>
        <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) setSearchQuery("")
      }}>
        <DialogContent className="overflow-hidden p-0 max-w-2xl">
          <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-1 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Command.Input
                placeholder="Digite um comando ou busque chamados..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Command.List className="max-h-[400px] overflow-y-auto">
              <Command.Empty>
                {searchQuery.length >= 2
                  ? "Nenhum resultado encontrado."
                  : "Digite para buscar chamados ou navegar..."}
              </Command.Empty>

              {/* Histórico de buscas */}
              {historySuggestions.length > 0 && searchQuery.length < 2 && (
                <Command.Group heading="Histórico de Buscas">
                  {historySuggestions.map((query, index) => (
                    <Command.Item
                      key={`history-${index}`}
                      onSelect={() => {
                        setSearchQuery(query)
                        const results = fuzzySearchTickets(tickets, query)
                        runCommand(() => router.push(`/tickets?search=${encodeURIComponent(query)}`))
                      }}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      <span>{query}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Resultados da busca */}
              {searchResults.length > 0 && (
                <Command.Group heading="Chamados">
                  {searchResults.map((ticket) => (
                    <Command.Item
                      key={ticket.id}
                      onSelect={() => runCommand(() => router.push(`/tickets/${ticket.id}`))}
                    >
                      <Ticket className="mr-2 h-4 w-4" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">{ticket.title}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {ticket.sector?.name || "Sem setor"} •{" "}
                          {format(new Date(ticket.created_at), "dd MMM yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </Command.Item>
                  ))}
                  {searchResults.length >= 5 && (
                    <Command.Item
                      onSelect={() => runCommand(() => router.push(`/tickets?search=${encodeURIComponent(searchQuery)}`))}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      <span>Ver todos os resultados para &quot;{searchQuery}&quot;</span>
                    </Command.Item>
                  )}
                </Command.Group>
              )}

              {/* Navegação */}
              <Command.Group heading="Navegação">
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/dashboard"))}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/tickets"))}
                >
                  <Ticket className="mr-2 h-4 w-4" />
                  <span>Chamados</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/admin"))}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Administração</span>
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}

