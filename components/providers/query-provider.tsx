"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { queryClient } from "@/lib/query-client"
import { useState } from "react"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Usar useState para garantir que o QueryClient seja criado apenas uma vez
  const [client] = useState(() => queryClient)

  return (
    <QueryClientProvider client={client}>
      {children}
      {/* DevTools apenas em desenvolvimento */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

