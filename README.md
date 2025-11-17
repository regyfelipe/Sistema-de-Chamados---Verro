# 🎫 Sistema de Chamados - Documentação Completa

Sistema unificado de gestão de chamados (tickets) desenvolvido para pequenas e médias empresas, com capacidade de escalar para grandes organizações.

## 📋 Índice Rápido

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [Documentação Completa](#-documentação-completa)

## 🎯 Visão Geral

Sistema completo de gestão de chamados com interface moderna, intuitiva e eficiente. Desenvolvido com Next.js 14, TypeScript, Supabase e TailwindCSS.

### Características Principais

✅ Interface moderna e responsiva  
✅ Multi-idioma (PT-BR, EN-US, ES-ES, AR-SA)  
✅ Notificações e chat em tempo real  
✅ Performance otimizada com cache  
✅ Sistema de permissões granular  
✅ Auditoria completa  
✅ Automações e workflows  
✅ SLA avançado com escalação  
✅ Personalização de interface

## 🚀 Funcionalidades

### Core

- ✅ Gestão completa de chamados
- ✅ Sistema de setores/departamentos
- ✅ Usuários e roles (Solicitante, Atendente, Admin, Super Admin)
- ✅ Comentários públicos e internos
- ✅ Histórico completo de alterações
- ✅ Anexos de arquivos

### Dashboard

- ✅ Estatísticas em tempo real
- ✅ Gráficos interativos (Recharts)
- ✅ Métricas de SLA
- ✅ Top atendentes
- ✅ Métricas de performance
- ✅ Estatísticas de satisfação (NPS)

### Kanban

- ✅ Visualização por colunas (status)
- ✅ Drag & Drop
- ✅ Filtros e agrupamento
- ✅ Cards resumidos

### Notificações

- ✅ Notificações em tempo real
- ✅ Badge de contador
- ✅ Centro de notificações
- ✅ Push notifications
- ✅ Múltiplos tipos de notificação

### Chat

- ✅ Chat geral do sistema
- ✅ Chat por chamado
- ✅ Mensagens em tempo real
- ✅ Edição e exclusão
- ✅ Indicador de não lidas

### SLA

- ✅ SLA básico automático
- ✅ SLA avançado por prioridade
- ✅ Horário comercial configurável
- ✅ Feriados configuráveis
- ✅ Pausa automática
- ✅ Escalação automática

### Automações

- ✅ Regras automáticas configuráveis
- ✅ Condições e ações
- ✅ Log de execuções
- ✅ Builder visual

### Permissões

- ✅ Permissões granulares
- ✅ Permissões por funcionalidade
- ✅ Permissões por setor
- ✅ Permissões por campo
- ✅ Grupos de permissões

### Templates

- ✅ Templates de resposta
- ✅ Templates globais e por setor
- ✅ Variáveis dinâmicas
- ✅ Atalhos de teclado

### Avaliações

- ✅ Avaliação ao fechar (1-5 estrelas)
- ✅ Feedback opcional
- ✅ Dashboard de satisfação
- ✅ Métricas NPS

### Busca

- ✅ Busca fuzzy
- ✅ Busca em múltiplos campos
- ✅ Sugestões enquanto digita
- ✅ Histórico de buscas
- ✅ Command Palette (CTRL+K)

### Internacionalização

- ✅ 4 idiomas (PT-BR, EN-US, ES-ES, AR-SA)
- ✅ Formatação por locale
- ✅ Suporte RTL (árabe)

### Personalização

- ✅ Cores personalizadas
- ✅ Logo customizado
- ✅ Favicon customizado
- ✅ Layouts alternativos

### Performance

- ✅ React Query (cache)
- ✅ Lazy loading
- ✅ Code splitting
- ✅ Service Worker
- ✅ Otimização de imagens

### Animações

- ✅ Animações suaves (Framer Motion)
- ✅ Transições de página
- ✅ Loading skeletons
- ✅ Microinterações

### Auditoria

- ✅ Log completo de ações
- ✅ Rastreamento de acesso
- ✅ Interface de visualização
- ✅ Exportação de logs
- ✅ Alertas suspeitos

## 🛠️ Tecnologias

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Autenticação**: NextAuth.js
- **Estilização**: TailwindCSS + Shadcn/UI
- **Cache**: React Query (TanStack Query)
- **Animações**: Framer Motion
- **Gráficos**: Recharts
- **i18n**: next-intl
- **Busca**: Fuse.js
- **Drag & Drop**: @dnd-kit

## 📦 Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd sistema-chamados

# Instale as dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Execute o projeto
npm run dev
```

## Usuario teste

admin@example.com
senha123


## ⚙️ Configuração

### 1. Variáveis de Ambiente

Crie `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

### 2. Banco de Dados

Execute os scripts SQL na ordem:

```sql
\i supabase/schema.sql
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
\i supabase/setup-storage.sql
```

### 3. Storage

Configure bucket `public` no Supabase Storage com políticas de acesso adequadas.

## 📖 Uso

### Primeiro Acesso

1. Acesse `/login`
2. Use as credenciais do primeiro usuário (criado manualmente no banco)
3. Ou crie um usuário via SQL

### Criar Usuário Inicial

```sql
INSERT INTO users (email, name, password, role)
VALUES (
  'admin@example.com',
  'Administrador',
  '$2a$10$...', -- Hash bcrypt da senha
  'super_admin'
);
```

### Navegação

- **Dashboard**: Visão geral do sistema
- **Chamados**: Lista e gestão de chamados
- **Kanban**: Visualização em board
- **Chat**: Chat em tempo real
- **Administração**: Configurações (apenas admins)

## 📚 Documentação Completa

Para documentação detalhada de todas as funcionalidades, consulte:

**[DOCUMENTACAO-COMPLETA.md](./DOCUMENTACAO-COMPLETA.md)**

A documentação completa inclui:

- ✅ Arquitetura detalhada
- ✅ Estrutura completa do projeto
- ✅ Guia de todas as funcionalidades
- ✅ Referência de banco de dados
- ✅ Guia de APIs
- ✅ Documentação de componentes
- ✅ Guia de hooks e utilitários
- ✅ Troubleshooting
- ✅ Guia de deploy

### 📋 Outros Documentos

- **[GUIA-RAPIDO.md](./GUIA-RAPIDO.md)** - Guia rápido de referência
- **[ESTRUTURA-PROJETO.md](./ESTRUTURA-PROJETO.md)** - Estrutura de arquivos
- **[CHECKLIST-MELHORIAS.md](./CHECKLIST-MELHORIAS.md)** - Checklist de melhorias e funcionalidades futuras
- **[DASHBOARD-GERENCIAL.md](./DASHBOARD-GERENCIAL.md)** - Dashboard externo para gerentes
- **[INDICE-DOCUMENTACAO.md](./INDICE-DOCUMENTACAO.md)** - Índice completo da documentação

## 🎨 Screenshots

### Dashboard

Interface principal com estatísticas e gráficos.

### Lista de Chamados

Visualização em lista com filtros avançados.

### Kanban Board

Visualização em colunas com drag & drop.

### Detalhe do Chamado

Informações completas, comentários, anexos e chat.

## 🔒 Segurança

- Row Level Security (RLS) em todas as tabelas
- Autenticação via NextAuth + Supabase
- Permissões granulares
- Auditoria completa
- Validação de dados

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte o repositório
2. Configure variáveis de ambiente
3. Deploy automático

### Outros Provedores

O projeto é compatível com qualquer provedor que suporte Next.js:

- Netlify
- Railway
- AWS Amplify
- Google Cloud Run

## 📝 Scripts Disponíveis

```bash
npm run dev      # Desenvolvimento
npm run build    # Build para produção
npm start        # Iniciar produção
npm run lint     # Linter
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário.

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte a [Documentação Completa](./DOCUMENTACAO-COMPLETA.md)
2. Verifique os logs no console
3. Verifique os logs no Supabase

---

**Desenvolvido com ❤️ para gestão eficiente de chamados**
