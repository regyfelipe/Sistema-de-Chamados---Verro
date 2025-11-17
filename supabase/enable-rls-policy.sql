-- Script para criar política RLS que permite leitura na tabela users
-- Use esta opção se quiser manter RLS habilitado mas permitir leitura

-- Habilitar RLS (caso não esteja habilitado)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Allow read for all" ON users;
DROP POLICY IF EXISTS "Allow select for authenticated" ON users;

-- Criar política que permite leitura para todos (DESENVOLVIMENTO)
CREATE POLICY "Allow read for all" ON users
  FOR SELECT
  USING (true);

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users';

