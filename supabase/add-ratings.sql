-- Tabela de Avaliações de Satisfação
CREATE TABLE IF NOT EXISTS ticket_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  nps_score INTEGER, -- Calculado: 9-10 = Promotor, 7-8 = Neutro, 0-6 = Detrator
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ticket_id, user_id) -- Uma avaliação por usuário por chamado
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ratings_ticket ON ticket_ratings(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ticket_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rating ON ticket_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_ratings_created ON ticket_ratings(created_at DESC);

-- Desabilitar RLS para desenvolvimento
ALTER TABLE ticket_ratings DISABLE ROW LEVEL SECURITY;

-- Para produção, descomente:
/*
ALTER TABLE ticket_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ratings" ON ticket_ratings
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin', 'atendente')
    )
  );
CREATE POLICY "Users can create own ratings" ON ticket_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON ticket_ratings
  FOR UPDATE USING (auth.uid() = user_id);
*/

