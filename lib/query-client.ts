import { QueryClient } from "@tanstack/react-query"

// Configuração global do QueryClient com cache otimizado
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos
      staleTime: 5 * 60 * 1000,
      // Manter dados em cache por 10 minutos
      // gcTime é usado no React Query v5+, cacheTime no v4
      gcTime: 10 * 60 * 1000,
      // Retry automático em caso de erro
      retry: 1,
      // Refetch quando a janela ganha foco
      refetchOnWindowFocus: true,
      // Refetch quando reconecta à internet
      refetchOnReconnect: true,
      // Refetch quando o componente monta
      refetchOnMount: true,
    },
    mutations: {
      // Retry em mutações
      retry: 1,
    },
  },
})

