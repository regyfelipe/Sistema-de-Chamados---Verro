"use client"

import dynamic from "next/dynamic"

// Lazy load dos componentes pesados do admin
export const AutomationsManager = dynamic(
  () => import("./automations-manager").then((mod) => mod.AutomationsManager),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Carregando automações...</div>
      </div>
    ),
  }
)

export const SLAConfig = dynamic(
  () => import("./sla-config").then((mod) => mod.SLAConfig),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Carregando configurações...</div>
      </div>
    ),
  }
)

export const AuditLogs = dynamic(
  () => import("./audit-logs").then((mod) => mod.AuditLogs),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Carregando logs...</div>
      </div>
    ),
  }
)

export const PermissionsManager = dynamic(
  () => import("./permissions-manager").then((mod) => mod.PermissionsManager),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Carregando permissões...</div>
      </div>
    ),
  }
)

export const OrganizationTree = dynamic(
  () => import("./organization-tree").then((mod) => mod.OrganizationTree),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Carregando organização...</div>
      </div>
    ),
  }
)

