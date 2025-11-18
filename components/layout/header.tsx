"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, User } from "lucide-react";
import { CreateTicketDialog } from "@/components/tickets/create-ticket-dialog";
import { useState } from "react";
import { CommandPalette } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { LanguageSelector } from "@/components/language-selector";
import { useI18n } from "@/components/providers/i18n-provider";
import { motion } from "framer-motion";
import { BrandedLogo } from "./branded-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Header() {
  const { data: session } = useSession();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Mobile Small (320-480px): h-12, Mobile (480-767px): h-14, Tablet+: h-16 */}
      <div className="flex h-12 sm:h-14 md:h-16 items-center justify-between px-2 sm:px-3 md:px-4 lg:px-6 gap-1 sm:gap-2">
        {/* Logo - sempre visível, com espaço para o botão do menu no mobile */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0 min-w-0 pl-10 sm:pl-12 lg:pl-0">
          <BrandedLogo />
        </div>

        {/* Ações principais - Desktop (1024px+) */}
        <div className="hidden lg:flex items-center gap-3 xl:gap-4">
          <CommandPalette />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
              <p className="text-sm font-medium truncate max-w-[120px] xl:max-w-[150px]">
                {session?.user?.name}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[120px] xl:max-w-[150px]">
                {session?.user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Ações principais - Tablet (768-1024px) */}
        <div className="hidden md:flex lg:hidden items-center gap-2">
          <CommandPalette />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("tickets.create")}
            </Button>
          </motion.div>
          <NotificationCenter />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate">
                    {session?.user?.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {session?.user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm">{t("nav.language")}</span>
                  <LanguageSelector />
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Ações principais - Mobile (480-767px) */}
        <div className="hidden sm:flex md:hidden items-center gap-1.5">
          <CommandPalette />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="icon"
              onClick={() => setCreateDialogOpen(true)}
              className="h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </motion.div>
          <NotificationCenter />
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[260px]">
              <SheetHeader>
                <SheetTitle className="text-base">Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-muted">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {session?.user?.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {session?.user?.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-accent">
                    <span className="text-xs">{t("nav.language")}</span>
                    <LanguageSelector />
                  </div>
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-accent">
                    <span className="text-xs">{t("nav.theme")}</span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Ações principais - Mobile Small (320-480px) */}
        <div className="flex sm:hidden items-center gap-1">
          <CommandPalette />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="icon"
              onClick={() => setCreateDialogOpen(true)}
              className="h-7 w-7"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
          <NotificationCenter />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[240px]">
              <SheetHeader>
                <SheetTitle className="text-sm">Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {session?.user?.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {session?.user?.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-accent">
                    <span className="text-xs">{t("nav.language")}</span>
                    <LanguageSelector />
                  </div>
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-accent">
                    <span className="text-xs">{t("nav.theme")}</span>
                    <ThemeToggle />
                  </div>
                  <div className="px-2 py-1.5 rounded-lg hover:bg-accent">
                    <CommandPalette />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <CreateTicketDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </header>
  );
}
