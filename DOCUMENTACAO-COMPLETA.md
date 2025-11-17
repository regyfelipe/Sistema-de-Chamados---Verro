# 📚 Documentação Completa - Sistema de Chamados

> **Documentação completa e detalhada de todas as funcionalidades, arquitetura, componentes e como usar o sistema.**

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Tecnologias Utilizadas](#tecnologias-utilizadas)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Configuração e Setup](#configuração-e-setup)
6. [Funcionalidades Principais](#funcionalidades-principais)
7. [Banco de Dados](#banco-de-dados)
8. [APIs e Rotas](#apis-e-rotas)
9. [Componentes](#componentes)
10. [Hooks e Utilitários](#hooks-e-utilitários)
11. [Guia de Uso](#guia-de-uso)
12. [Referência Rápida](#referência-rápida)
13. [Segurança](#segurança)
14. [Deploy](#deploy)
15. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Sistema unificado de gestão de chamados (tickets) desenvolvido para pequenas e médias empresas, com capacidade de escalar para grandes organizações. O sistema oferece uma interface moderna, intuitiva e eficiente para gerenciar solicitações de suporte técnico, manutenção, recursos humanos e outras áreas.

### Características Principais

- ✅ **Interface Moderna**: Design limpo e responsivo
- ✅ **Multi-idioma**: Suporte a 4 idiomas (PT-BR, EN-US, ES-ES, AR-SA)
- ✅ **Tempo Real**: Notificações e chat em tempo real
- ✅ **Performance**: Otimizado com cache e lazy loading
- ✅ **Segurança**: Sistema de permissões granular
- ✅ **Auditoria**: Log completo de todas as ações
- ✅ **Automações**: Regras e workflows configuráveis
- ✅ **SLA Avançado**: Controle de prazos com escalação
- ✅ **Personalização**: Cores, logo e layout customizáveis

---

## 🏗️ Arquitetura

### Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + React 18
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Autenticação**: NextAuth.js integrado com Supabase
- **Estilização**: TailwindCSS + Shadcn/UI
- **Cache**: React Query (TanStack Query)
- **Animações**: Framer Motion
- **Gráficos**: Recharts
- **i18n**: next-intl
- **TypeScript**: Tipagem completa

### Fluxo de Dados

```
Usuário → Next.js (Frontend)
           ↓
    NextAuth (Auth)
           ↓
    Supabase Client
           ↓
    PostgreSQL (Database)
           ↓
    Supabase Realtime (Notificações/Chat)
```

---

## 🛠️ Tecnologias Utilizadas

### Dependências Principais

```json
{
  "next": "^14.0.4", // Framework React
  "react": "^18.2.0", // Biblioteca UI
  "@supabase/supabase-js": "^2.81.1", // Backend
  "next-auth": "^4.24.5", // Autenticação
  "@tanstack/react-query": "^5.90.10", // Cache
  "framer-motion": "^12.23.24", // Animações
  "recharts": "^3.4.1", // Gráficos
  "next-intl": "^4.5.3", // Internacionalização
  "fuse.js": "^7.1.0", // Busca fuzzy
  "@dnd-kit/core": "^6.3.1" // Drag & Drop
}
```

### Bibliotecas UI

- **Shadcn/UI**: Componentes baseados em Radix UI
- **Lucide React**: Ícones
- **TailwindCSS**: Estilização
- **date-fns**: Formatação de datas

---

## 📁 Estrutura do Projeto

```
sistema-chamados/
├── app/                          # Next.js App Router
│   ├── admin/                    # Página de administração
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Autenticação
│   │   ├── audit/                # Auditoria
│   │   ├── automation-check/     # Verificação de automações
│   │   └── escalation-check/     # Verificação de escalação
│   ├── chat/                     # Página de chat
│   ├── dashboard/                # Dashboard
│   ├── kanban/                   # Kanban Board
│   ├── login/                    # Login
│   ├── tickets/                  # Chamados
│   │   └── [id]/                 # Detalhe do chamado
│   └── layout.tsx                # Layout raiz
│
├── components/                    # Componentes React
│   ├── admin/                    # Componentes de admin
│   ├── chat/                     # Chat
│   ├── dashboard/                # Dashboard
│   ├── kanban/                   # Kanban
│   ├── layout/                   # Layout (Header, Sidebar)
│   ├── notifications/            # Notificações
│   ├── providers/                # Context Providers
│   ├── tickets/                  # Componentes de tickets
│   └── ui/                       # Componentes UI base
│
├── hooks/                        # React Hooks customizados
│   ├── use-chat.ts               # Hook de chat
│   ├── use-dashboard.ts          # Hook de dashboard
│   ├── use-notifications.ts      # Hook de notificações
│   ├── use-tickets.ts            # Hook de tickets
│   └── use-permissions.ts       # Hook de permissões
│
├── lib/                          # Utilitários e lógica
│   ├── auth.ts                   # Configuração NextAuth
│   ├── supabase.ts               # Cliente Supabase
│   ├── branding.ts               # Branding personalizado
│   ├── chat.ts                   # Funções de chat
│   ├── notifications.ts          # Notificações
│   ├── tickets.ts                # Lógica de tickets
│   ├── sla.ts                    # SLA básico
│   ├── advanced-sla.ts           # SLA avançado
│   ├── automation-engine.ts      # Motor de automações
│   ├── audit.ts                  # Auditoria
│   ├── permissions.ts            # Permissões
│   └── ...
│
├── types/                        # Tipos TypeScript
│   ├── index.ts                  # Tipos principais
│   ├── branding.ts               # Branding
│   ├── permissions.ts            # Permissões
│   ├── automations.ts            # Automações
│   └── ...
│
├── supabase/                    # Scripts SQL
│   ├── schema.sql                # Schema principal
│   ├── add-notifications.sql     # Notificações
│   ├── add-chat.sql              # Chat
│   ├── add-permissions.sql       # Permissões
│   ├── add-automations.sql       # Automações
│   └── ...
│
├── messages/                    # Traduções i18n
│   ├── pt-BR.json                # Português
│   ├── en-US.json                # Inglês
│   ├── es-ES.json                # Espanhol
│   └── ar-SA.json                # Árabe (RTL)
│
└── public/                      # Arquivos estáticos
    ├── manifest.json             # PWA Manifest
    └── sw.js                     # Service Worker
```

---

## ⚙️ Configuração e Setup

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase
- PostgreSQL (via Supabase)

### Instalação

1. **Clone o repositório**

```bash
git clone <repository-url>
cd sistema-chamados
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure variáveis de ambiente**

Crie um arquivo `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Database
DATABASE_URL=your-database-url
```

4. **Configure o banco de dados**

Execute os scripts SQL na ordem:

```sql
-- 1. Schema principal
\i supabase/schema.sql

-- 2. Funcionalidades adicionais
\i supabase/add-notifications.sql
\i supabase/add-chat.sql
\i supabase/add-permissions.sql
\i supabase/add-automations.sql
\i supabase/add-advanced-sla.sql
\i supabase/add-attachments.sql
\i supabase/add-templates.sql
\i supabase/add-ratings.sql
\i supabase/add-audit-logs.sql
\i supabase/add-branding.sql

-- 3. Storage
\i supabase/setup-storage.sql
```

5. **Configure Storage no Supabase**

- Crie um bucket `public` no Supabase Storage
- Configure políticas de acesso conforme necessário

6. **Execute o projeto**

```bash
npm run dev
```

Acesse: `http://localhost:3000`

---

## 🎨 Funcionalidades Principais

### 1. Sistema de Chamados (Tickets)

#### Criar Chamado

- Formulário com título, descrição, setor e prioridade
- Cálculo automático de SLA
- Notificações automáticas para atendentes

#### Listar Chamados

- Visualização em lista ou compacta
- Filtros avançados (status, prioridade, setor, data, etc.)
- Busca fuzzy (busca inteligente)
- Exportação para CSV
- Filtros favoritos salvos

#### Detalhes do Chamado

- Informações completas
- Histórico de alterações
- Comentários (públicos e internos)
- Anexos
- Chat em tempo real
- Avaliação de satisfação

#### Status e Prioridades

- **Status**: Aberto, Em Atendimento, Aguardando, Fechado
- **Prioridades**: Baixa, Média, Alta, Crítica

### 2. Dashboard

#### Dashboard Administrativo

- Estatísticas gerais (abertos, em atendimento, etc.)
- Gráficos:
  - Chamados por Setor (Pizza)
  - Chamados por Prioridade (Barras)
  - Chamados ao Longo do Tempo (Linha)
- Métricas de SLA
- Top 5 Atendentes
- Métricas de Performance
- Estatísticas de Satisfação (NPS)

#### Dashboard Básico (Solicitante/Atendente)

- Apenas chamados relevantes ao usuário
- Estatísticas simplificadas
- Chamados recentes

### 3. Kanban Board

- Visualização por colunas (status)
- Drag & Drop para mudar status
- Filtros e agrupamento
- Cards resumidos
- Atualização em tempo real

### 4. Sistema de Notificações

- Notificações em tempo real via Supabase Realtime
- Badge com contador de não lidas
- Centro de notificações (dropdown)
- Notificações push do navegador
- Tipos de notificação:
  - Novo chamado atribuído
  - Comentário adicionado
  - Mudança de status
  - Mudança de prioridade
  - Mudança de setor
  - Alerta de SLA
  - Menção do usuário

### 5. Chat em Tempo Real

- Chat geral do sistema
- Chat por chamado
- Mensagens em tempo real
- Edição e exclusão de mensagens
- Indicador de mensagens não lidas
- Histórico completo

### 6. Sistema de SLA (Service Level Agreement)

#### SLA Básico

- Cálculo automático de prazo
- Alertas visuais
- Notificações de vencimento

#### SLA Avançado

- SLA por prioridade
- Horário comercial configurável
- Feriados configuráveis
- Pausa automática (finais de semana, feriados)
- Escalação automática
- Notificações de escalação

### 7. Automações e Workflows

- Regras automáticas configuráveis
- Condições e ações
- Exemplos:
  - Atribuir automaticamente por palavras-chave
  - Mudar prioridade automaticamente
  - Fechar após X dias sem resposta
  - Notificar quando SLA próximo
- Log de execuções

### 8. Sistema de Permissões

#### Permissões Granulares

- Permissões por funcionalidade
- Permissões por setor
- Permissões por campo
- Grupos de permissões
- Herança de permissões

#### Roles

- **Solicitante**: Apenas seus próprios chamados
- **Atendente**: Chamados do seu setor + atribuídos + criados
- **Admin**: Todos os chamados + configurações
- **Super Admin**: Acesso total

### 9. Templates de Resposta

- Templates de comentários
- Templates globais e por setor
- Variáveis dinâmicas:
  - `{{user_name}}`
  - `{{ticket_id}}`
  - `{{current_user_name}}`
  - `{{ticket_title}}`
  - `{{sector_name}}`
  - `{{current_date}}`
  - `{{current_time}}`
- Atalhos de teclado

### 10. Sistema de Avaliações

- Avaliação ao fechar chamado (1-5 estrelas)
- Comentários de feedback
- Dashboard de satisfação
- Métricas NPS (Net Promoter Score)
- Estatísticas de satisfação

### 11. Anexos

- Upload de arquivos
- Armazenamento no Supabase Storage
- Lista de anexos por chamado
- Download de anexos
- Validação de tipo e tamanho

### 12. Busca Avançada

- Busca fuzzy (tolerante a erros)
- Busca em múltiplos campos
- Sugestões enquanto digita
- Histórico de buscas
- Integrado ao Command Palette (CTRL+K)

### 13. Command Palette

- Acesso rápido (CTRL+K)
- Busca global
- Navegação rápida
- Ações rápidas
- Histórico de buscas

### 14. Internacionalização (i18n)

- 4 idiomas suportados:
  - Português (Brasil) - Padrão
  - English (US)
  - Español (España)
  - العربية (Saudi Arabia) - RTL
- Formatação de datas/números por locale
- Suporte RTL para árabe

### 15. Personalização de Interface

- Cores personalizadas (primária, secundária, destaque)
- Logo customizado
- Favicon customizado
- Layouts alternativos:
  - Padrão
  - Compacto
  - Espaçoso
  - Moderno

### 16. Sistema de Auditoria

- Log completo de todas as ações
- Rastreamento de acesso (IP, User Agent)
- Interface para visualizar logs
- Exportação de logs
- Retenção configurável
- Alertas para atividades suspeitas

### 17. Performance e Cache

- React Query para cache
- Lazy loading de componentes
- Code splitting automático
- Service Worker para cache offline
- Otimização de imagens
- Skeletons de loading

### 18. Animações e Transições

- Animações suaves com Framer Motion
- Transições de página
- Loading skeletons
- Microinterações
- Feedback visual melhorado

---

## 🗄️ Banco de Dados

### Tabelas Principais

#### `users`

Usuários do sistema.

```sql
- id (UUID)
- email (VARCHAR, UNIQUE)
- name (VARCHAR)
- password (VARCHAR)
- role (VARCHAR: solicitante, atendente, admin, super_admin)
- sector_id (UUID, FK → sectors)
- created_at, updated_at
```

#### `sectors`

Setores/departamentos.

```sql
- id (UUID)
- name (VARCHAR, UNIQUE)
- description (TEXT)
- sla_hours (INTEGER)
- created_at, updated_at
```

#### `tickets`

Chamados/tickets.

```sql
- id (UUID)
- title (VARCHAR)
- description (TEXT)
- sector_id (UUID, FK → sectors, NULLABLE)
- status (VARCHAR: aberto, em_atendimento, aguardando, fechado)
- priority (VARCHAR: baixa, media, alta, critica)
- created_by (UUID, FK → users)
- assigned_to (UUID, FK → users, NULLABLE)
- sla_due_date (TIMESTAMP, NULLABLE)
- created_at, updated_at
```

#### `comments`

Comentários nos chamados.

```sql
- id (UUID)
- ticket_id (UUID, FK → tickets)
- user_id (UUID, FK → users)
- content (TEXT)
- is_internal (BOOLEAN)
- created_at
```

#### `ticket_history`

Histórico de alterações.

```sql
- id (UUID)
- ticket_id (UUID, FK → tickets)
- user_id (UUID, FK → users)
- action (VARCHAR)
- old_value (TEXT, NULLABLE)
- new_value (TEXT, NULLABLE)
- created_at
```

### Tabelas Adicionais

- `notifications` - Notificações
- `chat_messages` - Mensagens de chat
- `chat_read_status` - Status de leitura do chat
- `attachments` - Anexos
- `comment_templates` - Templates de resposta
- `ticket_ratings` - Avaliações
- `sector_sla_config` - Configuração de SLA por setor
- `business_hours` - Horários comerciais
- `holidays` - Feriados
- `ticket_escalations` - Escalações
- `sla_pauses` - Pausas de SLA
- `automation_rules` - Regras de automação
- `automation_logs` - Logs de automações
- `audit_logs` - Logs de auditoria
- `permissions` - Permissões
- `permission_groups` - Grupos de permissões
- `user_permissions` - Permissões de usuários
- `group_permissions` - Permissões de grupos
- `branding_config` - Configuração de branding

### Relacionamentos

```
users ←→ sectors (many-to-one)
users ←→ tickets (created_by, assigned_to)
tickets ←→ sectors (many-to-one)
tickets ←→ comments (one-to-many)
tickets ←→ ticket_history (one-to-many)
tickets ←→ attachments (one-to-many)
tickets ←→ ticket_ratings (one-to-many)
```

---

## 🔌 APIs e Rotas

### API Routes (Next.js)

#### `/api/auth/[...nextauth]`

- Autenticação via NextAuth
- Integração com Supabase

#### `/api/audit/log-access`

- Registrar acesso do usuário
- Log de IP e User Agent

#### `/api/audit/logs`

- Buscar logs de auditoria
- Filtros e paginação

#### `/api/automation-check`

- Verificar e executar automações
- Endpoint para cron jobs

#### `/api/escalation-check`

- Verificar escalações de SLA
- Endpoint para cron jobs

### Páginas (App Router)

- `/` - Redireciona para dashboard
- `/login` - Página de login
- `/dashboard` - Dashboard principal
- `/tickets` - Lista de chamados
- `/tickets/[id]` - Detalhe do chamado
- `/kanban` - Kanban Board
- `/chat` - Chat geral
- `/admin` - Administração
- `/offline` - Página offline

---

## 🧩 Componentes

### Componentes Principais

#### Layout

- `MainLayout` - Layout principal com sidebar e header
- `Header` - Cabeçalho com ações rápidas
- `Sidebar` - Menu lateral de navegação
- `BrandedLogo` - Logo customizado

#### Tickets

- `TicketsList` - Lista de chamados
- `TicketDetail` - Detalhe completo do chamado
- `CreateTicketDialog` - Dialog para criar chamado
- `AdvancedFilters` - Filtros avançados
- `TicketPreview` - Preview no hover
- `AttachmentUpload` - Upload de anexos
- `RatingDialog` - Dialog de avaliação

#### Dashboard

- `DashboardStats` - Estatísticas gerais
- `TicketsBySectorChart` - Gráfico por setor
- `TicketsByPriorityChart` - Gráfico por prioridade
- `TicketsOverTimeChart` - Gráfico ao longo do tempo
- `SLAMetricsCard` - Métricas de SLA
- `TopAttendants` - Top atendentes
- `PerformanceMetricsCard` - Métricas de performance
- `SatisfactionStats` - Estatísticas de satisfação

#### Kanban

- `KanbanBoard` - Board principal
- `KanbanColumn` - Coluna (status)
- `KanbanCard` - Card de chamado
- `KanbanFilters` - Filtros do Kanban

#### Chat

- `ChatInterface` - Interface de chat
- `ChatSheet` - Chat em side panel

#### Notifications

- `NotificationCenter` - Centro de notificações
- Badge com contador

#### Admin

- `AdminPanel` - Painel principal
- `SectorsManagement` - Gerenciar setores
- `UsersManagement` - Gerenciar usuários
- `PermissionsManager` - Gerenciar permissões
- `AutomationsManager` - Gerenciar automações
- `SLAConfig` - Configurar SLA
- `AuditLogs` - Logs de auditoria
- `BrandingConfig` - Configurar branding
- `OrganizationTree` - Árvore organizacional

#### UI Base

- `Button`, `Card`, `Dialog`, `Input`, `Select`, etc.
- `Skeleton` - Loading skeleton
- `AnimatedButton` - Botão animado
- `AnimatedCard` - Card animado
- `PageTransition` - Transição de página

---

## 🎣 Hooks e Utilitários

### Hooks Customizados

#### `useTickets()`

Hook para buscar tickets com cache.

```tsx
const { data: tickets, isLoading } = useTickets();
```

#### `useTicket(id)`

Hook para buscar um ticket específico.

```tsx
const { data: ticket, isLoading } = useTicket(ticketId);
```

#### `useDashboardData()`

Hook para dados do dashboard.

```tsx
const { data: dashboardData, isLoading } = useDashboardData();
```

#### `useNotifications()`

Hook para notificações.

```tsx
const { data: notifications } = useNotifications();
```

#### `useUnreadCount()`

Hook para contador de não lidas.

```tsx
const { data: count } = useUnreadCount();
```

#### `useChat({ ticketId })`

Hook para chat em tempo real.

```tsx
const { messages, sendMessage } = useChat({ ticketId });
```

#### `useI18n()` / `useTranslation()`

Hook para traduções.

```tsx
const { t, locale, setLocale } = useI18n();
```

#### `usePermissions()`

Hook para verificar permissões.

```tsx
const { hasPermission } = usePermissions();
```

### Utilitários Principais

#### `lib/ticket-access.ts`

- `getTicketsWithAccess()` - Buscar tickets com filtro de acesso
- `filterTicketsByAccess()` - Filtrar tickets por acesso
- `canAccessTicket()` - Verificar acesso a ticket

#### `lib/branding.ts`

- `getBrandingConfig()` - Obter configuração de branding
- `updateBrandingConfig()` - Atualizar branding
- `uploadLogo()` - Upload de logo
- `uploadFavicon()` - Upload de favicon
- `applyBrandingColors()` - Aplicar cores

#### `lib/notifications.ts`

- `createNotification()` - Criar notificação
- `getUserNotifications()` - Buscar notificações
- `markAsRead()` - Marcar como lida

#### `lib/chat.ts`

- `getChatMessages()` - Buscar mensagens
- `sendChatMessage()` - Enviar mensagem
- `markChatAsRead()` - Marcar como lida

#### `lib/advanced-sla.ts`

- `calculateSLADueDate()` - Calcular prazo de SLA
- `checkSLAStatus()` - Verificar status de SLA
- `pauseSLA()` - Pausar SLA

#### `lib/automation-engine.ts`

- `triggerAutomations()` - Disparar automações
- `evaluateRule()` - Avaliar regra

#### `lib/audit.ts`

- `logAction()` - Registrar ação
- `getAuditLogs()` - Buscar logs

---

## 📖 Guia de Uso

### Para Solicitantes

1. **Criar Chamado**

   - Clique em "Novo Chamado" no header
   - Preencha título, descrição, setor e prioridade
   - Clique em "Criar Chamado"

2. **Acompanhar Chamados**

   - Acesse "Chamados" no menu
   - Veja seus chamados na lista
   - Clique para ver detalhes

3. **Avaliar Chamado**
   - Quando o chamado for fechado, aparecerá um dialog
   - Avalie de 1 a 5 estrelas
   - Adicione comentários (opcional)

### Para Atendentes

1. **Visualizar Chamados**

   - Veja chamados do seu setor
   - Veja chamados atribuídos a você
   - Veja chamados que você criou

2. **Atender Chamado**

   - Clique no chamado
   - Adicione comentários
   - Mude o status conforme necessário
   - Atribua a outro atendente se necessário

3. **Usar Templates**

   - Ao comentar, use o seletor de templates
   - Escolha um template ou crie novo
   - Use atalhos de teclado (F1, F2, etc.)

4. **Chat em Tempo Real**
   - Acesse "Chat" no menu para chat geral
   - Ou use o botão no detalhe do chamado para chat específico

### Para Administradores

1. **Gerenciar Setores**

   - Acesse "Administração > Setores"
   - Crie, edite ou exclua setores
   - Configure SLA por setor

2. **Gerenciar Usuários**

   - Acesse "Administração > Usuários"
   - Crie, edite ou exclua usuários
   - Atribua setores e roles

3. **Configurar Permissões**

   - Acesse "Administração > Permissões"
   - Configure permissões granulares
   - Crie grupos de permissões

4. **Configurar Automações**

   - Acesse "Administração > Automações"
   - Crie regras automáticas
   - Configure condições e ações

5. **Configurar SLA**

   - Acesse "Administração > SLA"
   - Configure SLA por setor e prioridade
   - Configure horários comerciais e feriados

6. **Personalizar Interface**

   - Acesse "Administração > Personalização"
   - Configure cores, logo e favicon
   - Escolha estilo de layout

7. **Visualizar Auditoria**
   - Acesse "Administração > Auditoria"
   - Veja logs de todas as ações
   - Exporte logs se necessário

### Atalhos de Teclado

- `CTRL + K` - Abrir Command Palette
- `F1, F2, F3...` - Inserir templates (no campo de comentário)
- `ESC` - Fechar dialogs/modais

---

## 📚 Referência Rápida

### Roles e Permissões

| Role        | Acesso a Chamados            | Configurações       |
| ----------- | ---------------------------- | ------------------- |
| Solicitante | Apenas próprios              | Nenhuma             |
| Atendente   | Setor + Atribuídos + Criados | Nenhuma             |
| Admin       | Todos                        | Todas               |
| Super Admin | Todos                        | Todas + Super Admin |

### Status de Chamados

- **Aberto**: Chamado recém-criado
- **Em Atendimento**: Sendo trabalhado
- **Aguardando**: Aguardando resposta/ação
- **Fechado**: Resolvido/finalizado

### Prioridades

- **Baixa**: Não urgente
- **Média**: Normal
- **Alta**: Urgente
- **Crítica**: Muito urgente

### Tipos de Notificação

- `ticket_assigned` - Chamado atribuído
- `ticket_created` - Chamado criado
- `comment_added` - Comentário adicionado
- `status_changed` - Status alterado
- `priority_changed` - Prioridade alterada
- `sector_changed` - Setor alterado
- `sla_warning` - Alerta de SLA
- `sla_expired` - SLA vencido
- `mention` - Menção do usuário

### Variáveis de Template

- `{{user_name}}` - Nome do usuário do chamado
- `{{ticket_id}}` - ID do chamado
- `{{current_user_name}}` - Nome do usuário atual
- `{{ticket_title}}` - Título do chamado
- `{{sector_name}}` - Nome do setor
- `{{current_date}}` - Data atual
- `{{current_time}}` - Hora atual

### Estrutura de Cores (CSS Variables)

```css
--primary: Cor primária
--secondary: Cor secundária
--accent: Cor de destaque
--background: Cor de fundo
--foreground: Cor do texto
--muted: Cor muted
--destructive: Cor de erro
```

### Layouts Disponíveis

- **default**: Layout padrão
- **compact**: Compacto (menos espaçamento)
- **spacious**: Espaçoso (mais espaçamento)
- **modern**: Moderno (bordas arredondadas, sombras)

---

## 🔒 Segurança

### Row Level Security (RLS)

Todas as tabelas têm RLS habilitado no Supabase:

- Usuários só veem dados permitidos por role
- Filtros automáticos baseados em permissões
- Validação em todas as operações

### Autenticação

- NextAuth.js integrado com Supabase
- Sessões seguras
- Proteção de rotas
- Validação de permissões

### Auditoria

- Todas as ações são logadas
- Rastreamento de IP e User Agent
- Alertas para atividades suspeitas

---

## 🚀 Deploy

### Variáveis de Ambiente para Produção

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key
```

### Build para Produção

```bash
npm run build
npm start
```

### Vercel (Recomendado)

1. Conecte o repositório
2. Configure variáveis de ambiente
3. Deploy automático

---

## 🐛 Troubleshooting

### Erro de Autenticação

- Verifique variáveis de ambiente
- Confirme configuração do NextAuth
- Verifique credenciais no Supabase

### Erro de Permissões

- Verifique RLS policies no Supabase
- Confirme role do usuário
- Verifique permissões granulares

### Erro de Realtime

- Verifique se Realtime está habilitado no Supabase
- Confirme subscriptions ativas
- Verifique console para erros

### Performance Lenta

- Verifique cache do React Query
- Confirme lazy loading ativo
- Verifique queries otimizadas

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique esta documentação
2. Consulte os arquivos de setup específicos
3. Verifique logs no console do navegador
4. Verifique logs no Supabase

---

**Última atualização**: Dezembro 2024  
**Versão**: 1.0.0
