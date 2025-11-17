# 📁 Estrutura Completa do Projeto

## 📂 Visão Geral da Estrutura

```
sistema-chamados/
├── app/                    # Next.js App Router
├── components/             # Componentes React
├── hooks/                  # React Hooks
├── lib/                    # Utilitários e lógica
├── types/                  # Tipos TypeScript
├── supabase/               # Scripts SQL
├── messages/               # Traduções i18n
├── public/                 # Arquivos estáticos
└── scripts/                # Scripts auxiliares
```

---

## 📂 app/ - Páginas e Rotas

### Páginas Principais

```
app/
├── page.tsx                 # Home (redireciona)
├── layout.tsx               # Layout raiz
├── globals.css              # Estilos globais
│
├── login/
│   └── page.tsx            # Página de login
│
├── dashboard/
│   └── page.tsx            # Dashboard principal
│
├── tickets/
│   ├── page.tsx            # Lista de chamados
│   └── [id]/
│       └── page.tsx        # Detalhe do chamado
│
├── kanban/
│   └── page.tsx            # Kanban Board
│
├── chat/
│   └── page.tsx            # Chat geral
│
├── admin/
│   └── page.tsx            # Administração
│
└── offline/
    └── page.tsx            # Página offline
```

### API Routes

```
app/api/
├── auth/
│   └── [...nextauth]/
│       └── route.ts        # NextAuth handler
│
├── audit/
│   ├── log-access/
│   │   └── route.ts        # Registrar acesso
│   └── logs/
│       └── route.ts         # Buscar logs
│
├── automation-check/
│   └── route.ts            # Verificar automações
│
├── escalation-check/
│   └── route.ts            # Verificar escalações
│
├── test-connection/
│   └── route.ts            # Teste de conexão
│
└── test-supabase/
    └── route.ts            # Teste Supabase
```

---

## 📂 components/ - Componentes React

### Layout

```
components/layout/
├── main-layout.tsx          # Layout principal
├── header.tsx               # Cabeçalho
├── sidebar.tsx              # Menu lateral
└── branded-logo.tsx         # Logo customizado
```

### Tickets

```
components/tickets/
├── tickets-list.tsx         # Lista de chamados
├── ticket-detail.tsx        # Detalhe completo
├── create-ticket-dialog.tsx # Dialog criar chamado
├── advanced-filters.tsx     # Filtros avançados
├── ticket-preview.tsx      # Preview no hover
├── attachment-upload.tsx    # Upload anexos
├── attachment-list.tsx      # Lista anexos
├── template-selector.tsx    # Seletor templates
├── rating-dialog.tsx        # Dialog avaliação
└── ticket-rating-display.tsx # Exibir avaliação
```

### Dashboard

```
components/dashboard/
├── stats.tsx                # Estatísticas gerais
├── recent-tickets.tsx       # Chamados recentes
├── sla-alerts.tsx           # Alertas SLA
├── basic-dashboard.tsx      # Dashboard básico
├── performance-metrics.tsx   # Métricas performance
├── satisfaction-stats.tsx   # Estatísticas satisfação
├── sla-metrics.tsx          # Métricas SLA
├── top-attendants.tsx       # Top atendentes
├── tickets-by-sector-chart.tsx    # Gráfico setor
├── tickets-by-priority-chart.tsx  # Gráfico prioridade
├── tickets-over-time-chart.tsx     # Gráfico tempo
└── lazy-charts.tsx          # Charts com lazy loading
```

### Kanban

```
components/kanban/
├── kanban-board.tsx         # Board principal
├── kanban-column.tsx        # Coluna (status)
├── kanban-card.tsx          # Card chamado
└── kanban-filters.tsx       # Filtros
```

### Chat

```
components/chat/
├── chat-interface.tsx       # Interface chat
└── chat-sheet.tsx           # Chat em side panel
```

### Notifications

```
components/notifications/
└── notification-center.tsx  # Centro notificações
```

### Admin

```
components/admin/
├── admin-panel.tsx          # Painel principal
├── sectors-management.tsx    # Gerenciar setores
├── users-management.tsx      # Gerenciar usuários
├── permissions-manager.tsx  # Gerenciar permissões
├── automations-manager.tsx  # Gerenciar automações
├── sla-config.tsx           # Configurar SLA
├── audit-logs.tsx           # Logs auditoria
├── branding-config.tsx      # Configurar branding
├── organization-tree.tsx    # Árvore organizacional
└── lazy-admin.tsx           # Admin com lazy loading
```

### UI Base

```
components/ui/
├── button.tsx               # Botão
├── card.tsx                 # Card
├── dialog.tsx               # Dialog
├── input.tsx                # Input
├── select.tsx                # Select
├── textarea.tsx             # Textarea
├── label.tsx                # Label
├── badge.tsx                # Badge
├── table.tsx                # Tabela
├── tabs.tsx                 # Tabs
├── dropdown-menu.tsx        # Dropdown
├── popover.tsx              # Popover
├── progress.tsx             # Progress
├── switch.tsx               # Switch
├── alert.tsx                # Alert
├── toast.tsx                # Toast
├── toaster.tsx              # Toaster
├── sheet.tsx                # Sheet (side panel)
├── skeleton.tsx             # Skeleton loading
├── loading-skeletons.tsx    # Skeletons pré-configurados
├── animated-button.tsx      # Botão animado
├── animated-card.tsx        # Card animado
├── page-transition.tsx      # Transição página
├── micro-interactions.tsx   # Microinterações
└── use-toast.ts             # Hook toast
```

### Outros

```
components/
├── command-palette.tsx      # Command Palette
├── theme-toggle.tsx         # Toggle tema
├── language-selector.tsx    # Seletor idioma
├── service-worker-script.tsx # Service Worker
├── providers.tsx            # Providers principais
└── search/
    └── global-search.tsx    # Busca global
```

### Providers

```
components/providers/
├── query-provider.tsx       # React Query
├── i18n-provider.tsx        # Internacionalização
├── branding-provider.tsx    # Branding
└── tickets-provider.tsx     # Provider tickets
```

---

## 📂 hooks/ - React Hooks

```
hooks/
├── use-tickets.ts           # Hook tickets
├── use-dashboard.ts         # Hook dashboard
├── use-notifications.ts     # Hook notificações
├── use-notifications-query.ts # Notificações com Query
├── use-chat.ts              # Hook chat
├── use-permissions.ts       # Hook permissões
└── use-i18n.ts              # Hook i18n
```

---

## 📂 lib/ - Utilitários e Lógica

### Core

```
lib/
├── supabase.ts              # Cliente Supabase
├── auth.ts                  # Config NextAuth
└── utils.ts                 # Utilitários gerais
```

### Tickets

```
lib/
├── ticket-access.ts         # Controle acesso tickets
└── filter-utils.ts          # Utilitários filtros
```

### Notificações e Chat

```
lib/
├── notifications.ts         # Funções notificações
└── chat.ts                  # Funções chat
```

### SLA

```
lib/
├── sla.ts                   # SLA básico
├── advanced-sla.ts          # SLA avançado
└── escalation-checker.ts    # Verificador escalação
```

### Automações

```
lib/
└── automation-engine.ts     # Motor automações
```

### Permissões

```
lib/
├── permissions.ts           # Funções permissões
└── permission-helpers.ts     # Helpers permissões
```

### Dashboard e Métricas

```
lib/
├── dashboard-stats.ts        # Estatísticas dashboard
└── performance-metrics.ts    # Métricas performance
```

### Outros

```
lib/
├── templates.ts             # Templates resposta
├── ratings.ts               # Avaliações
├── audit.ts                 # Auditoria
├── branding.ts              # Branding
├── layout-styles.ts         # Estilos layout
├── fuzzy-search.ts          # Busca fuzzy
├── search-history.ts        # Histórico busca
├── query-client.ts          # React Query client
├── service-worker.ts        # Service Worker
└── i18n.ts                  # Utilitários i18n
```

---

## 📂 types/ - Tipos TypeScript

```
types/
├── index.ts                 # Tipos principais
├── branding.ts              # Tipos branding
├── permissions.ts           # Tipos permissões
├── automations.ts           # Tipos automações
├── filters.ts               # Tipos filtros
├── ratings.ts               # Tipos avaliações
├── sla.ts                   # Tipos SLA
├── templates.ts             # Tipos templates
├── audit.ts                 # Tipos auditoria
└── next-auth.d.ts           # Tipos NextAuth
```

---

## 📂 supabase/ - Scripts SQL

```
supabase/
├── schema.sql               # Schema principal
├── add-notifications.sql    # Notificações
├── add-chat.sql             # Chat
├── add-permissions.sql      # Permissões
├── add-automations.sql      # Automações
├── add-advanced-sla.sql     # SLA avançado
├── add-attachments.sql      # Anexos
├── add-templates.sql        # Templates
├── add-ratings.sql          # Avaliações
├── add-audit-logs.sql       # Auditoria
├── add-branding.sql         # Branding
├── allow-null-sector-id.sql # Permitir NULL sector_id
├── setup-storage.sql        # Configurar storage
├── enable-rls-policy.sql    # Habilitar RLS
└── disable-rls.sql          # Desabilitar RLS (dev)
```

---

## 📂 messages/ - Traduções

```
messages/
├── pt-BR.json               # Português (Brasil)
├── en-US.json               # Inglês (US)
├── es-ES.json               # Espanhol (España)
└── ar-SA.json               # Árabe (Saudi Arabia)
```

---

## 📂 public/ - Arquivos Estáticos

```
public/
├── manifest.json            # PWA Manifest
└── sw.js                    # Service Worker
```

---

## 📂 scripts/ - Scripts Auxiliares

```
scripts/
└── generate-secret.js       # Gerar secret NextAuth
```

---

## 📂 Configuração

```
├── package.json             # Dependências
├── tsconfig.json            # Config TypeScript
├── tailwind.config.ts       # Config Tailwind
├── next.config.js           # Config Next.js
├── postcss.config.js        # Config PostCSS
└── .env.local               # Variáveis ambiente
```

---

## 📂 Documentação

```
├── README.md                # Visão geral
├── DOCUMENTACAO-COMPLETA.md # Documentação completa
├── GUIA-RAPIDO.md           # Guia rápido
├── ESTRUTURA-PROJETO.md     # Este arquivo
├── SUGESTOES-MELHORIAS.md   # Sugestões futuras
└── NOTIFICACOES-SETUP.md    # Setup notificações
```

---

## 🔍 Como Navegar

### Encontrar Componente de Ticket

→ `components/tickets/`

### Encontrar Lógica de SLA

→ `lib/advanced-sla.ts` ou `lib/sla.ts`

### Encontrar Schema do Banco

→ `supabase/schema.sql`

### Encontrar Tipos TypeScript

→ `types/`

### Encontrar Hooks

→ `hooks/`

### Encontrar Traduções

→ `messages/`

---

## 📊 Estatísticas

- **Componentes**: ~80+
- **Hooks**: 7
- **Utilitários**: ~20
- **Páginas**: 8
- **API Routes**: 6
- **Tabelas DB**: 25+
- **Idiomas**: 4

---

**Última atualização**: Dezembro 2024
