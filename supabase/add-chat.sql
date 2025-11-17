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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_ticket ON chat_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_general ON chat_messages(created_at DESC) WHERE ticket_id IS NULL;

-- Tabela de Status de Leitura (opcional - para marcar mensagens como lidas)
CREATE TABLE IF NOT EXISTS chat_read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE, -- NULL = chat geral
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ticket_id)
);

-- Índices para status de leitura
CREATE INDEX IF NOT EXISTS idx_chat_read_status_user ON chat_read_status(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_read_status_ticket ON chat_read_status(ticket_id);

-- Desabilitar RLS para desenvolvimento
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_read_status DISABLE ROW LEVEL SECURITY;

-- Para produção, descomente:
/*
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all messages" ON chat_messages
  FOR SELECT USING (true);
CREATE POLICY "Users can insert own messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own messages" ON chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE chat_read_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own read status" ON chat_read_status
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own read status" ON chat_read_status
  FOR ALL USING (auth.uid() = user_id);
*/

-- Habilitar Realtime para chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

