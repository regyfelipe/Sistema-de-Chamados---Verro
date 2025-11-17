# 🔔 Configuração do Sistema de Notificações

## 📋 Pré-requisitos

1. Execute o schema principal: `supabase/schema.sql`
2. Execute o schema de notificações: `supabase/add-notifications.sql`

## 🚀 Passos de Instalação

### 1. Criar Tabela de Notificações

No SQL Editor do Supabase, execute:

```sql
-- Execute o arquivo: supabase/add-notifications.sql
```

Ou copie e cole o conteúdo do arquivo `supabase/add-notifications.sql`.

### 2. Verificar RLS

Se você já executou `supabase/disable-rls.sql`, a tabela `notifications` já terá RLS desabilitado.

Se não, execute:

```sql
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
```

### 3. Habilitar Realtime (Opcional mas Recomendado)

No Supabase Dashboard:

1. Vá em **Database** > **Replication**
2. Encontre a tabela `notifications`
3. Clique em **Enable** para habilitar replicação em tempo real

Ou execute no SQL Editor:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

## ✅ Funcionalidades Implementadas

### Notificações Automáticas

O sistema cria notificações automaticamente para:

1. **Novo Chamado Criado**
   - Notifica todos os atendentes do setor
   - Tipo: `ticket_created`

2. **Comentário Adicionado**
   - Notifica o criador do chamado e o responsável
   - Tipo: `comment_added`

3. **Status Alterado**
   - Notifica o criador do chamado e o responsável
   - Tipo: `status_changed`

### Centro de Notificações

- Badge com contador de não lidas no header
- Dropdown com lista de notificações
- Marcar como lida individual ou todas
- Deletar notificações
- Navegação direta para o chamado ao clicar

### Notificações Push do Navegador

- Solicita permissão automaticamente
- Mostra notificação nativa quando nova notificação chega
- Funciona mesmo com a aba fechada (se permitido)

## 🧪 Testando

1. **Criar um chamado:**
   - Faça login como solicitante
   - Crie um novo chamado
   - Verifique se os atendentes do setor receberam notificação

2. **Adicionar comentário:**
   - Abra um chamado
   - Adicione um comentário
   - Verifique se o criador e responsável receberam notificação

3. **Mudar status:**
   - Altere o status de um chamado
   - Verifique se os usuários relevantes receberam notificação

## 🔧 Troubleshooting

### Notificações não aparecem em tempo real

1. Verifique se o Realtime está habilitado no Supabase
2. Verifique os logs do navegador (F12 > Console)
3. Verifique se há erros no hook `use-notifications.ts`

### Notificações push não funcionam

1. Verifique se o navegador suporta notificações
2. Verifique se a permissão foi concedida
3. Alguns navegadores bloqueiam notificações em HTTP (use HTTPS)

### Erro ao criar notificação

1. Verifique se a tabela `notifications` existe
2. Verifique se RLS está desabilitado ou políticas estão configuradas
3. Verifique os logs no console do navegador

## 📝 Tipos de Notificação

- `ticket_assigned` - Chamado atribuído a você
- `ticket_created` - Novo chamado criado
- `comment_added` - Novo comentário
- `status_changed` - Status alterado
- `sla_warning` - SLA próximo de vencer
- `sla_expired` - SLA vencido
- `mention` - Você foi mencionado

## 🎯 Próximos Passos

- [ ] Implementar notificações de SLA (warning/expired)
- [ ] Implementar notificações de atribuição
- [ ] Implementar menções (@usuario)
- [ ] Adicionar preferências de notificação por usuário
- [ ] Adicionar notificações por email

---

**Última atualização**: Dezembro 2024

