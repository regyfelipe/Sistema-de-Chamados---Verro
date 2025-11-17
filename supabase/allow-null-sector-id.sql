-- Script para permitir sector_id NULL na tabela tickets
-- Execute este script se a tabela tickets já existir e você quiser permitir tickets sem setor

-- Remover a constraint NOT NULL do sector_id
ALTER TABLE tickets ALTER COLUMN sector_id DROP NOT NULL;

-- Alterar a foreign key para ON DELETE SET NULL (caso o setor seja deletado)
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_sector_id_fkey;
ALTER TABLE tickets ADD CONSTRAINT tickets_sector_id_fkey 
  FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE SET NULL;

