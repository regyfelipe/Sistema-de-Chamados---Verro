"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateTicketDialog } from "@/components/tickets/create-ticket-dialog"
import { useState } from "react"
import { CommandPalette } from "@/components/command-palette"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { LanguageSelector } from "@/components/language-selector"
import { useI18n } from "@/components/providers/i18n-provider"
import { motion } from "framer-motion"
import { BrandedLogo } from "./branded-logo"

export function Header() {
  const { data: session } = useSession()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const { t } = useI18n()

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <BrandedLogo />
        </div>
        
        <div className="flex items-center gap-4">
          <CommandPalette />
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("tickets.create")}
            </Button>
          </motion.div>
          <NotificationCenter />
          <LanguageSelector />
          <ThemeToggle />
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-medium">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
        </div>
      </div>
      
      <CreateTicketDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </header>
  )
}

