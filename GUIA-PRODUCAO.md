# 🚀 Guia de Produção - Sistema de Chamados

Este guia explica como rodar o sistema em produção, tanto localmente quanto em serviços de hospedagem.

## 📋 Pré-requisitos

- ✅ Build concluído com sucesso (`npm run build`)
- ✅ Variáveis de ambiente configuradas
- ✅ Banco de dados Supabase configurado
- ✅ Node.js 18+ instalado

---

## 🖥️ Rodar Localmente em Produção

### 1. Verificar Variáveis de Ambiente

Certifique-se de que o arquivo `.env` (ou `.env.local`) contém todas as variáveis necessárias:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua-chave-secreta-aleatoria

# Opcional: Porta customizada
PORT=3000
```

### 2. Iniciar o Servidor de Produção

```bash
# Após o build (já feito)
npm start
```

O servidor iniciará na porta 3000 (ou na porta especificada na variável `PORT`).

**Acesso:**
- Local: `http://localhost:3000`
- Rede local: `http://SEU-IP:3000` (para acessar de outros dispositivos na mesma rede)

### 3. Verificar se Está Funcionando

1. Acesse `http://localhost:3000`
2. Teste o login com as credenciais:
   - Email: `admin@example.com`
   - Senha: `senha123`
3. Verifique se todas as funcionalidades estão operacionais

---

## 🌐 Deploy em Serviços de Hospedagem

### Opção 1: Vercel (Recomendado - Mais Fácil)

A Vercel é a plataforma oficial do Next.js e oferece deploy automático.

#### Passo a Passo:

1. **Instalar Vercel CLI** (opcional, mas recomendado):
   ```bash
   npm i -g vercel
   ```

2. **Fazer login na Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   
   Siga as instruções:
   - Link para o projeto? **Não** (primeira vez)
   - Qual o nome do projeto? **sistema-chamados** (ou o que preferir)
   - Qual diretório? **./** (raiz)
   - Override settings? **Não**

4. **Configurar Variáveis de Ambiente**:
   
   Acesse o dashboard da Vercel: https://vercel.com/dashboard
   
   Vá em: **Settings** → **Environment Variables**
   
   Adicione todas as variáveis:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXTAUTH_URL` (URL do seu domínio na Vercel)
   - `NEXTAUTH_SECRET` (gere uma chave aleatória)

5. **Redeploy** (para aplicar as variáveis):
   ```bash
   vercel --prod
   ```

6. **Configurar Domínio Customizado** (opcional):
   - Vá em **Settings** → **Domains**
   - Adicione seu domínio
   - Configure o DNS conforme instruções

**Vantagens:**
- ✅ Deploy automático a cada push no Git
- ✅ SSL automático
- ✅ CDN global
- ✅ Preview de cada PR
- ✅ Gratuito para projetos pessoais

---

### Opção 2: Railway

Railway oferece hospedagem simples com suporte a PostgreSQL e outros serviços.

#### Passo a Passo:

1. **Acesse**: https://railway.app
2. **Crie uma conta** e conecte seu repositório GitHub
3. **Crie um novo projeto** e selecione seu repositório
4. **Configure as variáveis de ambiente** no painel
5. **Railway detecta automaticamente** que é um projeto Next.js
6. **Deploy automático** acontece a cada push

**Vantagens:**
- ✅ Simples de usar
- ✅ Suporte a banco de dados
- ✅ Deploy automático
- ✅ SSL incluído

---

### Opção 3: Render

Render oferece hospedagem gratuita com algumas limitações.

#### Passo a Passo:

1. **Acesse**: https://render.com
2. **Crie uma conta** e conecte seu repositório
3. **Crie um novo Web Service**
4. **Configure**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
5. **Adicione variáveis de ambiente**
6. **Deploy**

**Vantagens:**
- ✅ Plano gratuito disponível
- ✅ SSL automático
- ✅ Deploy automático

---

### Opção 4: Servidor VPS (DigitalOcean, AWS, etc.)

Para ter controle total sobre o servidor.

#### Passo a Passo:

1. **Configurar servidor** (Ubuntu recomendado):
   ```bash
   # Atualizar sistema
   sudo apt update && sudo apt upgrade -y
   
   # Instalar Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Instalar PM2 (gerenciador de processos)
   sudo npm install -g pm2
   ```

2. **Clonar repositório**:
   ```bash
   git clone SEU-REPOSITORIO.git
   cd sistema-chamados
   ```

3. **Instalar dependências e build**:
   ```bash
   npm install
   npm run build
   ```

4. **Configurar variáveis de ambiente**:
   ```bash
   nano .env
   # Cole todas as variáveis necessárias
   ```

5. **Iniciar com PM2**:
   ```bash
   pm2 start npm --name "sistema-chamados" -- start
   pm2 save
   pm2 startup
   ```

6. **Configurar Nginx** (proxy reverso):
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/sistema-chamados
   ```
   
   Configuração do Nginx:
   ```nginx
   server {
       listen 80;
       server_name seu-dominio.com;
   
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   Ativar site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/sistema-chamados /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Configurar SSL com Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d seu-dominio.com
   ```

**Vantagens:**
- ✅ Controle total
- ✅ Escalável
- ✅ Customizável

---

## 🔧 Configurações Importantes para Produção

### 1. NEXTAUTH_URL

**IMPORTANTE:** A variável `NEXTAUTH_URL` deve ser a URL completa do seu site em produção:

```env
# Exemplo para Vercel
NEXTAUTH_URL=https://sistema-chamados.vercel.app

# Exemplo para domínio customizado
NEXTAUTH_URL=https://chamados.seudominio.com.br
```

### 2. NEXTAUTH_SECRET

Gere uma chave secreta forte:

```bash
# No terminal
openssl rand -base64 32
```

Ou use um gerador online: https://generate-secret.vercel.app/32

### 3. Supabase - Configurar URLs Permitidas

No painel do Supabase:
1. Vá em **Authentication** → **URL Configuration**
2. Adicione sua URL de produção em **Site URL**
3. Adicione em **Redirect URLs**:
   - `https://seu-dominio.com/api/auth/callback/nextauth`
   - `https://seu-dominio.com/*`

### 4. CORS (se necessário)

Se precisar acessar APIs externas, configure CORS no Supabase.

---

## ✅ Checklist Antes de Ir para Produção

- [ ] Build executado com sucesso (`npm run build`)
- [ ] Todas as variáveis de ambiente configuradas
- [ ] `NEXTAUTH_URL` aponta para a URL de produção
- [ ] `NEXTAUTH_SECRET` é uma chave forte e aleatória
- [ ] Supabase configurado com URLs de produção
- [ ] Testado login e autenticação
- [ ] Testado criação de tickets
- [ ] Testado notificações em tempo real
- [ ] Testado upload de anexos
- [ ] Verificado logs de erro
- [ ] Backup do banco de dados configurado

---

## 🐛 Troubleshooting

### Erro: "NEXTAUTH_URL is not set"

**Solução:** Configure a variável `NEXTAUTH_URL` com a URL completa do seu site.

### Erro: "Invalid API key"

**Solução:** Verifique se as chaves do Supabase estão corretas e se as URLs permitidas estão configuradas.

### Erro: "Connection refused"

**Solução:** 
- Verifique se o servidor está rodando
- Verifique se a porta está correta
- Verifique firewall/security groups

### Site lento em produção

**Soluções:**
- Ative cache do Next.js
- Use CDN (Vercel já inclui)
- Otimize imagens
- Verifique queries do banco de dados

### Erro de CORS

**Solução:** Configure CORS no Supabase com as URLs corretas.

---

## 📊 Monitoramento

### Logs

- **Vercel**: Dashboard → Deployments → Logs
- **Railway**: Dashboard → Deployments → Logs
- **PM2**: `pm2 logs sistema-chamados`

### Métricas

- Use ferramentas como:
  - Vercel Analytics
  - Google Analytics
  - Sentry (para erros)

---

## 🔄 Atualizações

### Deploy Automático (Vercel/Railway/Render)

A cada push no repositório, o deploy acontece automaticamente.

### Deploy Manual (VPS)

```bash
# No servidor
cd sistema-chamados
git pull
npm install
npm run build
pm2 restart sistema-chamados
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do servidor
2. Verifique o console do navegador (F12)
3. Verifique logs do Supabase
4. Consulte a documentação completa: `DOCUMENTACAO-COMPLETA.md`

---

**Última atualização**: Dezembro 2024  
**Versão**: 1.0.0

