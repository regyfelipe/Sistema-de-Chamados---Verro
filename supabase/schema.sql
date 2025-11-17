-- Schema do banco de dados para Sistema de Chamados

-- Tabela de Setores
CREATE TABLE IF NOT EXISTS sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  sla_hours INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'solicitante' CHECK (role IN ('solicitante', 'atendente', 'admin', 'super_admin')),
  sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Chamados
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_atendimento', 'aguardando', 'fechado')),
  priority VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  sla_due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Comentários
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Histórico (Logs)
CREATE TABLE IF NOT EXISTS ticket_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tickets_sector ON tickets(sector_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_comments_ticket ON comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_history_ticket ON ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_users_sector ON users(sector_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_sectors_updated_at BEFORE UPDATE ON sectors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir setores padrão
INSERT INTO sectors (name, description, sla_hours) VALUES
  ('TI', 'Suporte de Tecnologia da Informação', 4),
  ('Facilities', 'Manutenção e Facilities', 8),
  ('Administrativo', 'Assuntos Administrativos', 24),
  ('Financeiro', 'Departamento Financeiro', 24),
  ('RH', 'Recursos Humanos', 24),
  ('Operações', 'Operações Gerais', 12)
ON CONFLICT (name) DO NOTHING;

-- ⚠️ IMPORTANTE: Configurar Row Level Security (RLS)
-- Por padrão, o Supabase habilita RLS em todas as tabelas
-- Para desenvolvimento, desabilite RLS ou crie políticas apropriadas

-- Opção 1: Desabilitar RLS (MAIS FÁCIL PARA DESENVOLVIMENTO)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sectors DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history DISABLE ROW LEVEL SECURITY;

-- Tabela de Notificações (execute add-notifications.sql para criar)
-- CREATE TABLE IF NOT EXISTS notifications (...);

-- Opção 2: Manter RLS habilitado mas criar políticas (RECOMENDADO PARA PRODUÇÃO)
-- Descomente as linhas abaixo se quiser usar RLS:
/*
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all" ON users FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all" ON users FOR UPDATE USING (true);

ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for sectors" ON sectors FOR ALL USING (true);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for tickets" ON tickets FOR ALL USING (true);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for comments" ON comments FOR ALL USING (true);

ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for history" ON ticket_history FOR ALL USING (true);
*/

