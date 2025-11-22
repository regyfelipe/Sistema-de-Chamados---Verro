"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Ticket,
  Settings,
  Users,
  LogOut,
  Menu,
  X,
  LayoutGrid,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";

const menuItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/tickets", labelKey: "nav.tickets", icon: Ticket },
  { href: "/kanban", labelKey: "nav.kanban", icon: LayoutGrid },
  { href: "/chat", labelKey: "nav.chat", icon: MessageCircle },
  { href: "/admin", labelKey: "nav.admin", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useI18n();

  return (
    <>
      
      <div className="lg:hidden fixed top-3 left-3 sm:top-4 sm:left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 w-8 sm:h-9 sm:w-9"
        >
          {isOpen ? (
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </Button>
      </div>

      
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-56 sm:w-64 border-r bg-background transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col p-3 sm:p-4 md:p-6">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">
              Chamados
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Sistema unificado
            </p>
          </div>

          <nav className="flex-1 space-y-1 sm:space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname?.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-2 sm:pt-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              {t("nav.logout")}
            </Button>
          </div>
        </div>
      </aside>

      
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
