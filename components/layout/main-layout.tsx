"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Toaster } from "@/components/ui/toaster";
import { PageTransition } from "@/components/ui/page-transition";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="lg:pl-56 xl:pl-64">
        <Header />
        
        <main className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
