-- Sistema de Permissões Granulares

-- Tabela de Grupos de Permissões
CREATE TABLE IF NOT EXISTS permission_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE, -- Grupos do sistema não podem ser deletados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Permissões
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE, -- Ex: 'ticket.create', 'ticket.edit', 'user.delete'
  name VARCHAR(100) NOT NULL,
  description TEXT,
  resource_type VARCHAR(50) NOT NULL, -- 'ticket', 'user', 'sector', 'comment', etc.
  action VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete', 'assign', etc.
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

-- Tabela de Permissões por Usuário (sobrescreve permissões do grupo)
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT TRUE,
  sector_id UUID REFERENCES sectors(id) ON DELETE CASCADE, -- Permissão específica por setor
  field_restrictions JSONB, -- Campos permitidos/proibidos: {"allowed": ["title", "description"], "denied": ["priority"]}
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

-- Índices para performance
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

-- Grupos de permissões padrão baseados em roles
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

-- Função para obter permissões de um usuário (considerando grupos e permissões diretas)
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
    -- Permissões dos grupos do usuário
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
    -- Permissões diretas do usuário (sobrescrevem grupos)
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

-- Desabilitar RLS para desenvolvimento
ALTER TABLE permission_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups DISABLE ROW LEVEL SECURITY;

-- Para produção, descomente:
/*
ALTER TABLE permission_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage permission groups" ON permission_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read permissions" ON permissions FOR SELECT USING (true);
CREATE POLICY "Admins can manage permissions" ON permissions
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

ALTER TABLE group_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage group permissions" ON group_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own permissions" ON user_permissions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage user permissions" ON user_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own groups" ON user_groups
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage user groups" ON user_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );
*/

