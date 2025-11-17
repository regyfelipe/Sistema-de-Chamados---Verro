-- Sistema de Automações e Workflows
-- Execute este script após o schema principal

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
  priority INTEGER DEFAULT 0, -- Ordem de execução (menor = primeiro)
  conditions JSONB NOT NULL, -- Condições em formato JSON
  actions JSONB NOT NULL, -- Ações em formato JSON
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger ON automation_rules(trigger_event);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_logs_rule ON automation_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_ticket ON automation_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_executed ON automation_logs(executed_at DESC);

-- Desabilitar RLS para desenvolvimento
ALTER TABLE automation_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs DISABLE ROW LEVEL SECURITY;

-- Para produção, descomente:
/*
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for automation_rules" ON automation_rules FOR ALL USING (true);

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for automation_logs" ON automation_logs FOR ALL USING (true);
*/

-- Exemplos de regras pré-configuradas (opcional)
-- Você pode inserir regras padrão aqui ou criar via interface

