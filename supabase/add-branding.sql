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

-- RLS para branding_config
ALTER TABLE branding_config ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver e editar
CREATE POLICY "Allow read access for authenticated users" ON branding_config
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow update access for admin users" ON branding_config
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Allow insert access for admin users" ON branding_config
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Função para obter configuração de branding
CREATE OR REPLACE FUNCTION get_branding_config()
RETURNS branding_config AS $$
  SELECT * FROM branding_config ORDER BY updated_at DESC LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

