-- Configurar Storage para anexos no Supabase
-- Execute este script no SQL Editor do Supabase

-- Criar bucket de anexos (se não existir)
-- Nota: Você precisa criar o bucket manualmente no Supabase Dashboard:
-- 1. Vá em Storage
-- 2. Clique em "New bucket"
-- 3. Nome: "attachments"
-- 4. Público: false (recomendado)
-- 5. File size limit: 10MB (ou conforme necessário)

-- Política para permitir upload (apenas usuários autenticados)
-- Ajuste conforme suas necessidades de segurança

-- Exemplo de política (execute após criar o bucket):
/*
CREATE POLICY "Users can upload attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Users can view attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'attachments');

CREATE POLICY "Users can delete own attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'attachments');
*/

-- Para desenvolvimento, você pode tornar o bucket público temporariamente
-- Mas NÃO faça isso em produção!

