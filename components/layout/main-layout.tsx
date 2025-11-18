"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Toaster } from "@/components/ui/toaster";
import { PageTransition } from "@/components/ui/page-transition";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Mobile Small (320-480px): sem padding, Mobile (480-767px): sem padding, Tablet (768-1024px): sem padding, Desktop (1024px+): padding para sidebar */}
      <div className="lg:pl-56 xl:pl-64">
        <Header />
        {/* Padding responsivo: Mobile Small: p-2, Mobile: p-3, Tablet: p-4, Desktop: p-6 */}
        <main className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
