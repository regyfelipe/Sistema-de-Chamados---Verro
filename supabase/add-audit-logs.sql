-- Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'view', 'login', 'logout', 'export', etc.
  entity_type VARCHAR(50) NOT NULL, -- 'ticket', 'user', 'sector', 'comment', 'attachment', etc.
  entity_id UUID, -- ID da entidade afetada
  description TEXT NOT NULL, -- Descrição da ação
  ip_address INET, -- IP do usuário
  user_agent TEXT, -- User agent do navegador
  metadata JSONB, -- Dados adicionais em JSON
  severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_composite ON audit_logs(user_id, created_at DESC);

-- Tabela de Configuração de Auditoria
CREATE TABLE IF NOT EXISTS audit_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurações padrão
INSERT INTO audit_config (key, value, description) VALUES
  ('retention_days', '365', 'Dias de retenção de logs (padrão: 1 ano)'),
  ('enable_suspicious_alerts', 'true', 'Habilitar alertas de ações suspeitas'),
  ('suspicious_login_attempts', '5', 'Número de tentativas de login falhadas para alerta'),
  ('suspicious_mass_operations', '10', 'Número de operações em massa para alerta'),
  ('log_ip_address', 'true', 'Registrar endereços IP'),
  ('log_user_agent', 'true', 'Registrar user agent')
ON CONFLICT (key) DO NOTHING;

-- Tabela de Alertas de Auditoria
CREATE TABLE IF NOT EXISTS audit_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL, -- 'suspicious_login', 'mass_delete', 'unauthorized_access', etc.
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'warning',
  metadata JSONB,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para alertas
CREATE INDEX IF NOT EXISTS idx_audit_alerts_type ON audit_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_user ON audit_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_resolved ON audit_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_created ON audit_alerts(created_at DESC);

-- Função para limpar logs antigos (baseado na retenção configurada)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  retention_days INTEGER;
  deleted_count INTEGER;
BEGIN
  -- Buscar configuração de retenção
  SELECT value::INTEGER INTO retention_days
  FROM audit_config
  WHERE key = 'retention_days';

  -- Se não encontrar, usar padrão de 365 dias
  IF retention_days IS NULL THEN
    retention_days := 365;
  END IF;

  -- Deletar logs mais antigos que o período de retenção
  DELETE FROM audit_logs
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Desabilitar RLS para desenvolvimento
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_alerts DISABLE ROW LEVEL SECURITY;

-- Para produção, descomente:

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

ALTER TABLE audit_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage audit config" ON audit_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

ALTER TABLE audit_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all audit alerts" ON audit_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

