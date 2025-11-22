-- ============================================================================
-- SISTEMA DE GESTÃO DE CHAMADOS - SCHEMA COMPLETO
-- ============================================================================
-- Este arquivo contém todo o schema do banco de dados em um único script.
-- Execute este arquivo no Supabase SQL Editor para criar todas as tabelas,
-- índices, funções e dados padrão necessários.
--
-- Ordem de execução:
-- 1. Tabelas principais (core)
-- 2. Sistema de notificações
-- 3. Sistema de chat
-- 4. Sistema de permissões
-- 5. Sistema de automações
-- 6. SLA avançado
-- 7. Anexos
-- 8. Templates
-- 9. Avaliações
-- 10. Auditoria
-- 11. Branding
-- 12. Configurações finais
-- ============================================================================

-- ============================================================================
-- SEÇÃO 1: TABELAS PRINCIPAIS (CORE)
-- ============================================================================

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

-- Índices para performance (Core)
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

-- ============================================================================
-- SEÇÃO 2: SISTEMA DE NOTIFICAÇÕES
-- ============================================================================

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'ticket_assigned',
    'ticket_created',
    'comment_added',
    'status_changed',
    'sla_warning',
    'sla_expired',
    'mention'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para notificações
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_ticket ON notifications(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================================================
-- SEÇÃO 3: SISTEMA DE CHAT
-- ============================================================================

-- Tabela de Mensagens de Chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE, -- NULL = chat geral
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Status de Leitura
CREATE TABLE IF NOT EXISTS chat_read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE, -- NULL = chat geral
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ticket_id)
);

-- Índices para chat
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_ticket ON chat_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_general ON chat_messages(created_at DESC) WHERE ticket_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_chat_read_status_user ON chat_read_status(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_read_status_ticket ON chat_read_status(ticket_id);

-- Habilitar Realtime para chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- ============================================================================
-- SEÇÃO 4: SISTEMA DE PERMISSÕES GRANULARES
-- ============================================================================

-- Tabela de Grupos de Permissões
CREATE TABLE IF NOT EXISTS permission_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Permissões
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  resource_type VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Permissões por Grupo
CREATE TABLE IF NOT EXISTS group_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, permission_id)
);

-- Tabela de Permissões por Usuário
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT TRUE,
  sector_id UUID REFERENCES sectors(id) ON DELETE CASCADE,
  field_restrictions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, permission_id, sector_id)
);

-- Tabela de Associação Usuário-Grupo
CREATE TABLE IF NOT EXISTS user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

-- Índices para permissões
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource_type, action);
CREATE INDEX IF NOT EXISTS idx_group_permissions_group ON group_permissions(group_id);
CREATE INDEX IF NOT EXISTS idx_group_permissions_permission ON group_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_sector ON user_permissions(sector_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_user ON user_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_group ON user_groups(group_id);

-- Permissões padrão do sistema
INSERT INTO permissions (code, name, description, resource_type, action) VALUES
  -- Tickets
  ('ticket.create', 'Criar Chamado', 'Permite criar novos chamados', 'ticket', 'create'),
  ('ticket.read', 'Ver Chamado', 'Permite visualizar chamados', 'ticket', 'read'),
  ('ticket.update', 'Editar Chamado', 'Permite editar chamados', 'ticket', 'update'),
  ('ticket.delete', 'Deletar Chamado', 'Permite deletar chamados', 'ticket', 'delete'),
  ('ticket.assign', 'Atribuir Chamado', 'Permite atribuir chamados a usuários', 'ticket', 'assign'),
  ('ticket.change_status', 'Mudar Status', 'Permite alterar status de chamados', 'ticket', 'change_status'),
  ('ticket.change_priority', 'Mudar Prioridade', 'Permite alterar prioridade de chamados', 'ticket', 'change_priority'),
  ('ticket.view_all', 'Ver Todos Chamados', 'Permite ver todos os chamados (não apenas próprios)', 'ticket', 'view_all'),
  ('ticket.edit_all', 'Editar Todos Chamados', 'Permite editar todos os chamados', 'ticket', 'edit_all'),
  
  -- Comentários
  ('comment.create', 'Criar Comentário', 'Permite criar comentários', 'comment', 'create'),
  ('comment.read', 'Ver Comentário', 'Permite visualizar comentários', 'comment', 'read'),
  ('comment.update', 'Editar Comentário', 'Permite editar comentários', 'comment', 'update'),
  ('comment.delete', 'Deletar Comentário', 'Permite deletar comentários', 'comment', 'delete'),
  ('comment.internal', 'Comentário Interno', 'Permite criar comentários internos', 'comment', 'internal'),
  
  -- Usuários
  ('user.create', 'Criar Usuário', 'Permite criar novos usuários', 'user', 'create'),
  ('user.read', 'Ver Usuário', 'Permite visualizar usuários', 'user', 'read'),
  ('user.update', 'Editar Usuário', 'Permite editar usuários', 'user', 'update'),
  ('user.delete', 'Deletar Usuário', 'Permite deletar usuários', 'user', 'delete'),
  ('user.manage_permissions', 'Gerenciar Permissões', 'Permite gerenciar permissões de usuários', 'user', 'manage_permissions'),
  
  -- Setores
  ('sector.create', 'Criar Setor', 'Permite criar novos setores', 'sector', 'create'),
  ('sector.read', 'Ver Setor', 'Permite visualizar setores', 'sector', 'read'),
  ('sector.update', 'Editar Setor', 'Permite editar setores', 'sector', 'update'),
  ('sector.delete', 'Deletar Setor', 'Permite deletar setores', 'sector', 'delete'),
  
  -- Anexos
  ('attachment.upload', 'Upload Anexo', 'Permite fazer upload de anexos', 'attachment', 'upload'),
  ('attachment.download', 'Download Anexo', 'Permite fazer download de anexos', 'attachment', 'download'),
  ('attachment.delete', 'Deletar Anexo', 'Permite deletar anexos', 'attachment', 'delete'),
  
  -- Administração
  ('admin.dashboard', 'Acessar Dashboard Admin', 'Permite acessar dashboard administrativo', 'admin', 'dashboard'),
  ('admin.automations', 'Gerenciar Automações', 'Permite gerenciar automações', 'admin', 'automations'),
  ('admin.sla', 'Gerenciar SLA', 'Permite gerenciar configurações de SLA', 'admin', 'sla'),
  ('admin.audit', 'Ver Auditoria', 'Permite visualizar logs de auditoria', 'admin', 'audit'),
  ('admin.export', 'Exportar Dados', 'Permite exportar dados do sistema', 'admin', 'export')
ON CONFLICT (code) DO NOTHING;

-- Grupos de permissões padrão
INSERT INTO permission_groups (name, description, is_system) VALUES
  ('Solicitante', 'Permissões básicas para solicitantes', TRUE),
  ('Atendente', 'Permissões para atendentes', TRUE),
  ('Admin', 'Permissões administrativas', TRUE),
  ('Super Admin', 'Todas as permissões', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Atribuir permissões ao grupo Solicitante
INSERT INTO group_permissions (group_id, permission_id, granted)
SELECT 
  (SELECT id FROM permission_groups WHERE name = 'Solicitante'),
  p.id,
  TRUE
FROM permissions p
WHERE p.code IN (
  'ticket.create',
  'ticket.read',
  'comment.create',
  'comment.read',
  'attachment.upload',
  'attachment.download'
)
ON CONFLICT DO NOTHING;

-- Atribuir permissões ao grupo Atendente
INSERT INTO group_permissions (group_id, permission_id, granted)
SELECT 
  (SELECT id FROM permission_groups WHERE name = 'Atendente'),
  p.id,
  TRUE
FROM permissions p
WHERE p.code IN (
  'ticket.read',
  'ticket.update',
  'ticket.assign',
  'ticket.change_status',
  'ticket.change_priority',
  'ticket.view_all',
  'comment.create',
  'comment.read',
  'comment.update',
  'comment.delete',
  'comment.internal',
  'attachment.upload',
  'attachment.download',
  'attachment.delete',
  'user.read'
)
ON CONFLICT DO NOTHING;

-- Atribuir permissões ao grupo Admin
INSERT INTO group_permissions (group_id, permission_id, granted)
SELECT 
  (SELECT id FROM permission_groups WHERE name = 'Admin'),
  p.id,
  TRUE
FROM permissions p
WHERE p.code NOT IN (
  'user.manage_permissions'
)
ON CONFLICT DO NOTHING;

-- Atribuir todas as permissões ao grupo Super Admin
INSERT INTO group_permissions (group_id, permission_id, granted)
SELECT 
  (SELECT id FROM permission_groups WHERE name = 'Super Admin'),
  p.id,
  TRUE
FROM permissions p
ON CONFLICT DO NOTHING;

-- Função para obter permissões de um usuário
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE (
  permission_code VARCHAR(100),
  granted BOOLEAN,
  sector_id UUID,
  field_restrictions JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_groups_perms AS (
    SELECT DISTINCT
      p.code,
      gp.granted,
      NULL::UUID as sector_id,
      NULL::JSONB as field_restrictions
    FROM user_groups ug
    JOIN group_permissions gp ON gp.group_id = ug.group_id
    JOIN permissions p ON p.id = gp.permission_id
    WHERE ug.user_id = p_user_id
  ),
  user_direct_perms AS (
    SELECT
      p.code,
      up.granted,
      up.sector_id,
      up.field_restrictions
    FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = p_user_id
  )
  SELECT 
    COALESCE(udp.code, ugp.code) as permission_code,
    COALESCE(udp.granted, ugp.granted, FALSE) as granted,
    udp.sector_id,
    udp.field_restrictions
  FROM user_groups_perms ugp
  FULL OUTER JOIN user_direct_perms udp ON udp.code = ugp.code
  WHERE COALESCE(udp.granted, ugp.granted, FALSE) = TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEÇÃO 5: SISTEMA DE AUTOMAÇÕES
-- ============================================================================

-- Tabela de Regras de Automação
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_event VARCHAR(50) NOT NULL CHECK (trigger_event IN (
    'ticket_created',
    'ticket_updated',
    'status_changed',
    'comment_added',
    'sla_warning',
    'sla_expired',
    'no_response_days'
  )),
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Logs de Execução de Automações
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para automações
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger ON automation_rules(trigger_event);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_logs_rule ON automation_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_ticket ON automation_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_executed ON automation_logs(executed_at DESC);

-- ============================================================================
-- SEÇÃO 6: SLA AVANÇADO
-- ============================================================================

-- Tabela de Configurações de SLA por Setor
CREATE TABLE IF NOT EXISTS sector_sla_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
  sla_hours INTEGER NOT NULL DEFAULT 24,
  escalation_hours INTEGER,
  escalation_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sector_id, priority)
);

-- Tabela de Business Hours
CREATE TABLE IF NOT EXISTS business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID REFERENCES sectors(id) ON DELETE CASCADE, -- NULL = global
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sector_id, day_of_week)
);

-- Tabela de Feriados
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  sector_id UUID REFERENCES sectors(id) ON DELETE CASCADE, -- NULL = global
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, sector_id)
);

-- Tabela de Escalações
CREATE TABLE IF NOT EXISTS ticket_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  escalated_from UUID REFERENCES users(id) ON DELETE SET NULL,
  escalated_to UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  escalation_level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Pausas de SLA
CREATE TABLE IF NOT EXISTS sla_pauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  paused_at TIMESTAMP WITH TIME ZONE NOT NULL,
  resumed_at TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para SLA
CREATE INDEX IF NOT EXISTS idx_sector_sla_config_sector ON sector_sla_config(sector_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_sector ON business_hours(sector_id);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_sector ON holidays(sector_id);
CREATE INDEX IF NOT EXISTS idx_escalations_ticket ON ticket_escalations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_sla_pauses_ticket ON sla_pauses(ticket_id);

-- Inserir business hours padrão (Segunda a Sexta, 9h às 18h)
INSERT INTO business_hours (sector_id, day_of_week, start_time, end_time, is_active)
SELECT NULL, day, '09:00'::TIME, '18:00'::TIME, true
FROM generate_series(1, 5) AS day
ON CONFLICT (sector_id, day_of_week) DO NOTHING;

-- ============================================================================
-- SEÇÃO 7: ANEXOS
-- ============================================================================

-- Tabela de Anexos
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para anexos
CREATE INDEX IF NOT EXISTS idx_attachments_ticket ON attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_attachments_comment ON attachments(comment_id);

-- ============================================================================
-- SEÇÃO 8: TEMPLATES DE RESPOSTA
-- ============================================================================

-- Tabela de Templates de Resposta
CREATE TABLE IF NOT EXISTS comment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
  is_global BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shortcut_key VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para templates
CREATE INDEX IF NOT EXISTS idx_templates_sector ON comment_templates(sector_id);
CREATE INDEX IF NOT EXISTS idx_templates_global ON comment_templates(is_global);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON comment_templates(created_by);

-- Inserir templates padrão (será executado após criar usuário admin)
-- Os templates serão inseridos via aplicação ou manualmente após criar o primeiro admin

-- ============================================================================
-- SEÇÃO 9: AVALIAÇÕES DE SATISFAÇÃO
-- ============================================================================

-- Tabela de Avaliações de Satisfação
CREATE TABLE IF NOT EXISTS ticket_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  nps_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ticket_id, user_id)
);

-- Índices para avaliações
CREATE INDEX IF NOT EXISTS idx_ratings_ticket ON ticket_ratings(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ticket_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rating ON ticket_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_ratings_created ON ticket_ratings(created_at DESC);

-- ============================================================================
-- SEÇÃO 10: SISTEMA DE AUDITORIA
-- ============================================================================

-- Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  severity VARCHAR(20) DEFAULT 'info',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Configuração de Auditoria
CREATE TABLE IF NOT EXISTS audit_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Alertas de Auditoria
CREATE TABLE IF NOT EXISTS audit_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'warning',
  metadata JSONB,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_composite ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_type ON audit_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_user ON audit_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_resolved ON audit_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_created ON audit_alerts(created_at DESC);

-- Configurações padrão de auditoria
INSERT INTO audit_config (key, value, description) VALUES
  ('retention_days', '365', 'Dias de retenção de logs (padrão: 1 ano)'),
  ('enable_suspicious_alerts', 'true', 'Habilitar alertas de ações suspeitas'),
  ('suspicious_login_attempts', '5', 'Número de tentativas de login falhadas para alerta'),
  ('suspicious_mass_operations', '10', 'Número de operações em massa para alerta'),
  ('log_ip_address', 'true', 'Registrar endereços IP'),
  ('log_user_agent', 'true', 'Registrar user agent')
ON CONFLICT (key) DO NOTHING;

-- Função para limpar logs antigos
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  retention_days INTEGER;
  deleted_count INTEGER;
BEGIN
  SELECT value::INTEGER INTO retention_days
  FROM audit_config
  WHERE key = 'retention_days';

  IF retention_days IS NULL THEN
    retention_days := 365;
  END IF;

  DELETE FROM audit_logs
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEÇÃO 11: BRANDING E PERSONALIZAÇÃO
-- ============================================================================

-- Tabela de configurações de branding
CREATE TABLE IF NOT EXISTS branding_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL DEFAULT 'Sistema de Chamados',
  logo_url TEXT,
  favicon_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#1a1a1a',
  secondary_color VARCHAR(7) DEFAULT '#3b82f6',
  accent_color VARCHAR(7) DEFAULT '#10b981',
  layout_style VARCHAR(50) DEFAULT 'default' CHECK (layout_style IN ('default', 'compact', 'spacious', 'modern')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO branding_config (id, company_name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Sistema de Chamados')
ON CONFLICT (id) DO NOTHING;

-- Função para obter configuração de branding
CREATE OR REPLACE FUNCTION get_branding_config()
RETURNS branding_config AS $$
  SELECT * FROM branding_config ORDER BY updated_at DESC LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- SEÇÃO 12: CONFIGURAÇÕES FINAIS E RLS
-- ============================================================================

-- ⚠️ IMPORTANTE: ROW LEVEL SECURITY (RLS)
-- Por padrão, desabilitamos RLS para facilitar desenvolvimento
-- Para produção, você DEVE habilitar RLS e criar políticas apropriadas

-- Desabilitar RLS em todas as tabelas (DESENVOLVIMENTO)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sectors DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_read_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE permission_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE sector_sla_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours DISABLE ROW LEVEL SECURITY;
ALTER TABLE holidays DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_escalations DISABLE ROW LEVEL SECURITY;
ALTER TABLE sla_pauses DISABLE ROW LEVEL SECURITY;
ALTER TABLE attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE comment_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_alerts DISABLE ROW LEVEL SECURITY;

-- ⚠️ NOTA: A tabela branding_config já tem RLS habilitado com políticas
-- Isso é intencional para demonstrar como configurar RLS corretamente

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================
-- 
-- PRÓXIMOS PASSOS:
-- 
-- 1. Criar o primeiro usuário admin:
--    INSERT INTO users (email, name, password, role)
--    VALUES (
--      'admin@example.com',
--      'Administrador',
--      '$2a$10$...', -- Hash bcrypt da senha
--      'super_admin'
--    );
--
-- 2. Inserir templates padrão (após criar admin):
--    UPDATE comment_templates SET created_by = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
--    WHERE created_by IS NULL;
--
-- 3. Configurar Storage no Supabase:
--    - Criar bucket "attachments" no Supabase Dashboard
--    - Configurar políticas de acesso
--
-- 4. Para PRODUÇÃO:
--    - Habilitar RLS em todas as tabelas
--    - Criar políticas de segurança apropriadas
--    - Revisar permissões padrão
--    - Configurar backup automático
--
-- ============================================================================

