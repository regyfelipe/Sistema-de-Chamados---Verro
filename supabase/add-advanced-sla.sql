-- Sistema de SLA Avançado
-- Execute este script após o schema principal

-- Tabela de Configurações de SLA por Setor
CREATE TABLE IF NOT EXISTS sector_sla_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
  sla_hours INTEGER NOT NULL DEFAULT 24,
  escalation_hours INTEGER, -- Horas antes de escalar
  escalation_to UUID REFERENCES users(id) ON DELETE SET NULL, -- Usuário/Setor para escalar
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sector_id, priority)
);

-- Tabela de Business Hours (Horário de Funcionamento)
CREATE TABLE IF NOT EXISTS business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID REFERENCES sectors(id) ON DELETE CASCADE, -- NULL = global
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Domingo, 6 = Sábado
  start_time TIME NOT NULL, -- Ex: 09:00
  end_time TIME NOT NULL, -- Ex: 18:00
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
  is_recurring BOOLEAN DEFAULT FALSE, -- Se é recorrente (ex: Natal sempre em 25/12)
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
  escalation_level INTEGER DEFAULT 1, -- Nível de escalação (1, 2, 3...)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Pausas de SLA (quando o SLA foi pausado e retomado)
CREATE TABLE IF NOT EXISTS sla_pauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  paused_at TIMESTAMP WITH TIME ZONE NOT NULL,
  resumed_at TIMESTAMP WITH TIME ZONE,
  reason TEXT, -- Motivo da pausa (fim de semana, feriado, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sector_sla_config_sector ON sector_sla_config(sector_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_sector ON business_hours(sector_id);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_sector ON holidays(sector_id);
CREATE INDEX IF NOT EXISTS idx_escalations_ticket ON ticket_escalations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_sla_pauses_ticket ON sla_pauses(ticket_id);

-- Desabilitar RLS para desenvolvimento
ALTER TABLE sector_sla_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours DISABLE ROW LEVEL SECURITY;
ALTER TABLE holidays DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_escalations DISABLE ROW LEVEL SECURITY;
ALTER TABLE sla_pauses DISABLE ROW LEVEL SECURITY;

-- Para produção, descomente:

ALTER TABLE sector_sla_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for sector_sla_config" ON sector_sla_config FOR ALL USING (true);

ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for business_hours" ON business_hours FOR ALL USING (true);

ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for holidays" ON holidays FOR ALL USING (true);

ALTER TABLE ticket_escalations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for escalations" ON ticket_escalations FOR ALL USING (true);

ALTER TABLE sla_pauses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for sla_pauses" ON sla_pauses FOR ALL USING (true);


-- Inserir business hours padrão (Segunda a Sexta, 9h às 18h)
INSERT INTO business_hours (sector_id, day_of_week, start_time, end_time, is_active)
SELECT NULL, day, '09:00'::TIME, '18:00'::TIME, true
FROM generate_series(1, 5) AS day
ON CONFLICT (sector_id, day_of_week) DO NOTHING;

