# ⚡ Guia Rápido - Sistema de Chamados

## 🚀 Início Rápido

### 1. Instalação

```bash
npm install
```

### 2. Configuração

Crie `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
```

### 3. Banco de Dados

Execute todos os scripts SQL em `supabase/` na ordem.

### 4. Executar

```bash
npm run dev
```

---

## 📋 Checklist de Setup

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados criado (todos os scripts SQL)
- [ ] Storage configurado no Supabase
- [ ] Bucket `public` criado
- [ ] Realtime habilitado no Supabase
- [ ] Primeiro usuário criado
- [ ] Teste de login funcionando

---

## 🎯 Funcionalidades por Role

### Solicitante
- ✅ Criar chamados
- ✅ Ver próprios chamados
- ✅ Comentar em próprios chamados
- ✅ Avaliar chamados fechados
- ✅ Usar chat geral

### Atendente
- ✅ Ver chamados do setor
- ✅ Ver chamados atribuídos
- ✅ Ver chamados criados
- ✅ Atender chamados
- ✅ Mudar status
- ✅ Usar templates
- ✅ Chat geral e por chamado

### Admin / Super Admin
- ✅ Tudo do atendente
- ✅ Ver todos os chamados
- ✅ Mudar prioridade e setor
- ✅ Acessar administração
- ✅ Configurar sistema
- ✅ Ver auditoria

---

## ⌨️ Atalhos de Teclado

- `CTRL + K` - Command Palette
- `F1, F2, F3...` - Templates (no campo de comentário)
- `ESC` - Fechar dialogs

---

## 🔑 Variáveis de Template

- `{{user_name}}` - Nome do usuário
- `{{ticket_id}}` - ID do chamado
- `{{current_user_name}}` - Usuário atual
- `{{ticket_title}}` - Título
- `{{sector_name}}` - Setor
- `{{current_date}}` - Data atual
- `{{current_time}}` - Hora atual

---

## 📊 Status e Prioridades

**Status:**
- Aberto → Em Atendimento → Aguardando → Fechado

**Prioridades:**
- Baixa → Média → Alta → Crítica

---

## 🎨 Personalização

Acesse: **Administração > Personalização**

- Cores (primária, secundária, destaque)
- Logo (PNG, SVG, JPG)
- Favicon (ICO, PNG)
- Layout (Padrão, Compacto, Espaçoso, Moderno)

---

## 🔍 Busca

- Busca fuzzy (tolerante a erros)
- Busca em múltiplos campos
- Histórico de buscas
- Command Palette (CTRL+K)

---

## 💬 Chat

- Chat geral: Menu "Chat"
- Chat por chamado: Botão no detalhe do chamado
- Mensagens em tempo real
- Indicador de não lidas

---

## 📈 Dashboard

### Admin
- Estatísticas completas
- Gráficos interativos
- Métricas de SLA
- Top atendentes
- Performance
- Satisfação

### Solicitante/Atendente
- Estatísticas simplificadas
- Apenas chamados relevantes

---

## 🔔 Notificações

Tipos:
- Novo chamado atribuído
- Comentário adicionado
- Mudança de status/prioridade/setor
- Alerta de SLA
- Menção do usuário

---

## 🤖 Automações

Exemplos:
- Atribuir por palavras-chave
- Mudar prioridade automaticamente
- Fechar após X dias sem resposta
- Notificar quando SLA próximo

Acesse: **Administração > Automações**

---

## ⏱️ SLA

### Básico
- Cálculo automático de prazo
- Alertas visuais

### Avançado
- SLA por prioridade
- Horário comercial
- Feriados
- Pausa automática
- Escalação

Acesse: **Administração > SLA**

---

## 🔐 Permissões

### Granulares
- Por funcionalidade
- Por setor
- Por campo
- Grupos

Acesse: **Administração > Permissões**

---

## 📝 Templates

- Templates globais
- Templates por setor
- Variáveis dinâmicas
- Atalhos (F1, F2, etc.)

Acesse: Seletor de templates ao comentar

---

## ⭐ Avaliações

- Avaliação ao fechar (1-5 estrelas)
- Feedback opcional
- Dashboard de satisfação
- Métricas NPS

---

## 🌍 Idiomas

Idiomas disponíveis:
- 🇧🇷 Português (Brasil) - Padrão
- 🇺🇸 English (US)
- 🇪🇸 Español (España)
- 🇸🇦 العربية (Saudi Arabia) - RTL

Trocar: Seletor no header

---

## 🎨 Animações

- Animações suaves
- Transições de página
- Loading skeletons
- Microinterações
- Feedback visual

---

## 📱 Responsivo

- Mobile-first
- Layout adaptativo
- Menu mobile
- Touch-friendly

---

## 🔍 Troubleshooting Rápido

### Login não funciona
- Verifique variáveis de ambiente
- Confirme usuário no banco
- Verifique hash da senha

### Notificações não aparecem
- Verifique Realtime habilitado
- Confirme subscriptions ativas
- Verifique console

### Permissões não funcionam
- Verifique RLS policies
- Confirme role do usuário
- Verifique permissões granulares

### Performance lenta
- Verifique cache do React Query
- Confirme lazy loading
- Verifique queries

---

## 📚 Documentação Completa

Para mais detalhes, consulte:
- **[DOCUMENTACAO-COMPLETA.md](./DOCUMENTACAO-COMPLETA.md)** - Documentação completa
- **[README.md](./README.md)** - Visão geral

---

**Última atualização**: Dezembro 2024

