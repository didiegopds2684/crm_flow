CREATE TABLE IF NOT EXISTS entity_records (
    id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id  UUID      NOT NULL REFERENCES entity_definitions(id) ON DELETE CASCADE,
    tenant_id  UUID      NOT NULL,
    data       JSONB     NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_records_entity   ON entity_records(entity_id);
CREATE INDEX IF NOT EXISTS idx_records_tenant   ON entity_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_records_data_gin ON entity_records USING GIN(data);
