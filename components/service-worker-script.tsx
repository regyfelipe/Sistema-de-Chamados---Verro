"use client"

import { useEffect } from "react"
import { registerServiceWorker } from "@/lib/service-worker"

export function ServiceWorkerScript() {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return null
}

