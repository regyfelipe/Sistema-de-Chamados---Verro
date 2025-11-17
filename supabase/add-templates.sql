-- Tabela de Templates de Resposta
CREATE TABLE IF NOT EXISTS comment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
  is_global BOOLEAN DEFAULT FALSE, -- Templates globais disponíveis para todos
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shortcut_key VARCHAR(10), -- Atalho de teclado (ex: "F1", "Ctrl+1")
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_templates_sector ON comment_templates(sector_id);
CREATE INDEX IF NOT EXISTS idx_templates_global ON comment_templates(is_global);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON comment_templates(created_by);

-- Desabilitar RLS para desenvolvimento
ALTER TABLE comment_templates DISABLE ROW LEVEL SECURITY;

-- Para produção, descomente:
/*
ALTER TABLE comment_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view templates" ON comment_templates
  FOR SELECT USING (
    is_global = true OR 
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );
CREATE POLICY "Users can create templates" ON comment_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own templates" ON comment_templates
  FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Admins can update all templates" ON comment_templates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );
CREATE POLICY "Users can delete own templates" ON comment_templates
  FOR DELETE USING (created_by = auth.uid());
CREATE POLICY "Admins can delete all templates" ON comment_templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );
*/

-- Inserir alguns templates padrão
INSERT INTO comment_templates (name, content, is_global, created_by, shortcut_key) VALUES
  (
    'Solução Aplicada',
    'Olá {{user_name}},\n\nA solução foi aplicada com sucesso. Por favor, confirme se o problema foi resolvido.\n\nAtenciosamente,\n{{current_user_name}}',
    true,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    'F1'
  ),
  (
    'Aguardando Informações',
    'Olá {{user_name}},\n\nPrecisamos de mais informações para prosseguir com o atendimento do chamado #{{ticket_id}}.\n\nPor favor, forneça:\n- [Detalhes necessários]\n\nAtenciosamente,\n{{current_user_name}}',
    true,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    'F2'
  ),
  (
    'Chamado Fechado',
    'Olá {{user_name}},\n\nO chamado #{{ticket_id}} foi encerrado. Caso o problema persista, por favor, abra um novo chamado.\n\nAtenciosamente,\n{{current_user_name}}',
    true,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    'F3'
  )
ON CONFLICT DO NOTHING;

