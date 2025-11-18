"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SectorsManagement } from "./sectors-management"
import { UsersManagement } from "./users-management"
import {
  OrganizationTree,
  AutomationsManager,
  SLAConfig,
  AuditLogs,
  PermissionsManager,
} from "./lazy-admin"
import { BrandingConfig } from "./branding-config"

interface AdminPanelProps {
  initialSectors: any[]
  initialUsers: any[]
}

export function AdminPanel({ initialSectors, initialUsers }: AdminPanelProps) {
  return (
    <Tabs defaultValue="organization" className="space-y-4 sm:space-y-6">
      <div className="border-b border-border">
        <TabsList className="w-full overflow-x-auto flex-nowrap sm:flex-wrap h-auto p-1.5 sm:p-2 bg-muted/30 rounded-lg sm:rounded-md">
          <TabsTrigger 
            value="organization" 
            className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <span className="hidden sm:inline">Organização</span>
            <span className="sm:hidden">Org</span>
          </TabsTrigger>
          <TabsTrigger 
            value="sectors" 
            className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Setores
          </TabsTrigger>
          <TabsTrigger 
            value="users" 
            className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Usuários
          </TabsTrigger>
          <TabsTrigger 
            value="permissions" 
            className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <span className="hidden sm:inline">Permissões</span>
            <span className="sm:hidden">Perm</span>
          </TabsTrigger>
          <TabsTrigger 
            value="automations" 
            className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <span className="hidden sm:inline">Automações</span>
            <span className="sm:hidden">Auto</span>
          </TabsTrigger>
          <TabsTrigger 
            value="sla" 
            className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            SLA
          </TabsTrigger>
          <TabsTrigger 
            value="branding" 
            className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <span className="hidden sm:inline">Personalização</span>
            <span className="sm:hidden">Personal</span>
          </TabsTrigger>
          <TabsTrigger 
            value="audit" 
            className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Auditoria
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="organization" className="mt-4 sm:mt-6">
        <OrganizationTree
          initialSectors={initialSectors}
          initialUsers={initialUsers}
        />
      </TabsContent>
      <TabsContent value="sectors" className="mt-4 sm:mt-6">
        <SectorsManagement initialSectors={initialSectors} />
      </TabsContent>
      <TabsContent value="users" className="mt-4 sm:mt-6">
        <UsersManagement initialUsers={initialUsers} />
      </TabsContent>
      <TabsContent value="permissions" className="mt-4 sm:mt-6">
        <PermissionsManager initialUsers={initialUsers} />
      </TabsContent>
      <TabsContent value="automations" className="mt-4 sm:mt-6">
        <AutomationsManager />
      </TabsContent>
      <TabsContent value="sla" className="mt-4 sm:mt-6">
        <SLAConfig />
      </TabsContent>
      <TabsContent value="branding" className="mt-4 sm:mt-6">
        <BrandingConfig />
      </TabsContent>
      <TabsContent value="audit" className="mt-4 sm:mt-6">
        <AuditLogs />
      </TabsContent>
    </Tabs>
  )
}

