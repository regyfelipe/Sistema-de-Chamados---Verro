import { QueryClient } from "@tanstack/react-query"

// Configuração global do QueryClient com cache otimizado
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {

      staleTime: 5 * 60 * 1000,

      gcTime: 10 * 60 * 1000,

      retry: 1,

      refetchOnWindowFocus: true,

      refetchOnReconnect: true,

      refetchOnMount: true,
    },
    mutations: {

      retry: 1,
    },
  },
})

