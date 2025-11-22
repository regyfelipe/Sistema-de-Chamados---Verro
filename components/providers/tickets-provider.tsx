"use client"

import { createContext, useContext, ReactNode } from "react"
import { Ticket } from "@/types"

interface TicketsContextType {
  tickets: Ticket[]
  setTickets: (tickets: Ticket[]) => void
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined)

export function TicketsProvider({
  children,
  initialTickets = [],
}: {
  children: ReactNode
  initialTickets?: Ticket[]
}) {
  
  
  return (
    <TicketsContext.Provider value={{ tickets: initialTickets, setTickets: () => {} }}>
      {children}
    </TicketsContext.Provider>
  )
}

export function useTickets() {
  const context = useContext(TicketsContext)
  if (!context) {
    return { tickets: [], setTickets: () => {} }
  }
  return context
}

