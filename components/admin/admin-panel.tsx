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
    <Tabs defaultValue="organization" className="space-y-4">
      <TabsList>
        <TabsTrigger value="organization">Organização</TabsTrigger>
        <TabsTrigger value="sectors">Setores</TabsTrigger>
        <TabsTrigger value="users">Usuários</TabsTrigger>
        <TabsTrigger value="permissions">Permissões</TabsTrigger>
        <TabsTrigger value="automations">Automações</TabsTrigger>
        <TabsTrigger value="sla">SLA</TabsTrigger>
        <TabsTrigger value="branding">Personalização</TabsTrigger>
        <TabsTrigger value="audit">Auditoria</TabsTrigger>
      </TabsList>
      <TabsContent value="organization">
        <OrganizationTree
          initialSectors={initialSectors}
          initialUsers={initialUsers}
        />
      </TabsContent>
      <TabsContent value="sectors">
        <SectorsManagement initialSectors={initialSectors} />
      </TabsContent>
      <TabsContent value="users">
        <UsersManagement initialUsers={initialUsers} />
      </TabsContent>
      <TabsContent value="permissions">
        <PermissionsManager initialUsers={initialUsers} />
      </TabsContent>
      <TabsContent value="automations">
        <AutomationsManager />
      </TabsContent>
      <TabsContent value="sla">
        <SLAConfig />
      </TabsContent>
      <TabsContent value="branding">
        <BrandingConfig />
      </TabsContent>
      <TabsContent value="audit">
        <AuditLogs />
      </TabsContent>
    </Tabs>
  )
}

