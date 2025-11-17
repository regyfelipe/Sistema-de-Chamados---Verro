-- Script para desabilitar RLS em todas as tabelas (APENAS PARA DESENVOLVIMENTO)
-- ⚠️ NÃO USE EM PRODUÇÃO!

-- Desabilitar RLS em todas as tabelas
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sectors DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE comment_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_ratings DISABLE ROW LEVEL SECURITY;

-- Verificar se foi desabilitado
SELECT 
  tablename, 
  rowsecurity,
  CASE 
    WHEN rowsecurity = false THEN '✅ RLS Desabilitado'
    ELSE '❌ RLS Ainda Habilitado'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'sectors', 'tickets', 'comments', 'ticket_history', 'attachments', 'notifications', 'comment_templates', 'ticket_ratings')
ORDER BY tablename;

