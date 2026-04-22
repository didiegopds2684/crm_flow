-- CRM Flow — Inicialização do Banco
-- Executado automaticamente pelo PostgreSQL na primeira inicialização

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- trigram para busca full-text

-- Schema público (dados globais)
-- As tabelas são criadas via Flyway migration em cada serviço

-- Schemas de tenant são criados dinamicamente pelo TenantSchemaService
-- quando um tenant é registrado via API
