"use client"

/**
 * Registra o Service Worker para cache offline
 */
export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log(
            "[SW] Service Worker registrado com sucesso:",
            registration.scope
          )

          // Verificar atualizações periodicamente
          setInterval(() => {
            registration.update()
          }, 60000) // A cada 1 minuto
        })
        .catch((error) => {
          console.error("[SW] Erro ao registrar Service Worker:", error)
        })
    })
  }
}

/**
 * Limpa o cache do Service Worker
 */
export async function cleanServiceWorkerCache() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready

    if (registration.active) {
      registration.active.postMessage({ type: "CLEAN_CACHE" })
    }
  }
}

