# 📊 Dashboard Gerencial - Documentação

## 🎯 Visão Geral

Página externa de dashboard gerencial para acompanhamento em tempo real dos chamados do sistema. Ideal para gerentes e executivos que precisam de uma visão rápida e atualizada do status dos chamados.

## 🔗 Acesso

A página está disponível em: **`/gerencia`**

Exemplo: `http://localhost:3000/gerencia`

## ✨ Funcionalidades

### 1. Estatísticas em Tempo Real

- **Total de Chamados**: Contador geral de todos os chamados no sistema
- **Abertos**: Chamados aguardando atendimento
- **Em Atendimento**: Chamados sendo trabalhados atualmente
- **Aguardando**: Chamados aguardando resposta do solicitante ou terceiros
- **Fechados**: Chamados resolvidos

### 2. Atendentes Ativos

Lista de atendentes que estão trabalhando em chamados no momento, mostrando:
- Nome do atendente
- Setor do atendente
- Quantidade de chamados em atendimento
- Quantidade de chamados de prioridade alta/crítica

### 3. Distribuição por Prioridade

Visualização da distribuição de chamados por prioridade:
- **Crítica** (vermelho)
- **Alta** (laranja)
- **Média** (amarelo)
- **Baixa** (azul)

Com barras de progresso mostrando a porcentagem de cada prioridade.

### 4. Chamados Recentes

Lista dos 10 chamados mais recentes, mostrando:
- Título do chamado
- Status atual
- Prioridade
- Criador
- Atendente responsável (se houver)
- Setor
- Data e hora de criação

## 🔄 Atualização em Tempo Real

O dashboard possui duas formas de atualização:

1. **Atualização Automática**: A cada 30 segundos, os dados são atualizados automaticamente
2. **Atualização em Tempo Real**: Usando Supabase Realtime, qualquer mudança nos tickets é refletida imediatamente no dashboard

O indicador no topo mostra a última atualização com timestamp.

## 🎨 Interface

- Design limpo e moderno
- Layout responsivo (funciona em desktop, tablet e mobile)
- Cores intuitivas para status e prioridades
- Indicador visual de atualização em tempo real

## 🔒 Segurança

**⚠️ IMPORTANTE**: Atualmente a página é **pública**. Para produção, recomenda-se:

1. **Adicionar autenticação simples** (token de acesso)
2. **Proteger com middleware** do Next.js
3. **Adicionar rate limiting**
4. **Usar variáveis de ambiente** para controlar acesso

### Exemplo de Proteção com Token

Você pode adicionar proteção simples modificando a página:

```typescript
// Adicionar no início do componente
const [authorized, setAuthorized] = useState(false)
const [token, setToken] = useState("")

useEffect(() => {
  const urlToken = new URLSearchParams(window.location.search).get("token")
  const validToken = process.env.NEXT_PUBLIC_MANAGER_TOKEN || "seu-token-secreto"
  
  if (urlToken === validToken) {
    setAuthorized(true)
  } else {
    // Redirecionar ou mostrar erro
    alert("Acesso não autorizado")
  }
}, [])

if (!authorized) {
  return <div>Acesso negado</div>
}
```

## 📱 Uso

1. Acesse `/gerencia` no navegador
2. O dashboard carrega automaticamente
3. Os dados são atualizados a cada 30 segundos
4. Mudanças em tempo real são refletidas imediatamente

## 🛠️ Personalização

### Alterar Intervalo de Atualização

No arquivo `app/gerencia/page.tsx`, modifique:

```typescript
// Atualizar a cada 30 segundos (30000ms)
const interval = setInterval(fetchDashboardData, 30000)

// Para atualizar a cada 10 segundos:
const interval = setInterval(fetchDashboardData, 10000)
```

### Adicionar Mais Métricas

Você pode adicionar novas métricas seguindo o padrão existente:

```typescript
// Exemplo: Adicionar métrica de SLA
const slaMetrics = {
  onTime: tickets?.filter(t => /* lógica */).length || 0,
  late: tickets?.filter(t => /* lógica */).length || 0,
}
```
