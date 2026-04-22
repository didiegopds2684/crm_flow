CREATE TABLE IF NOT EXISTS entity_definitions (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID         NOT NULL,
    name         VARCHAR(100) NOT NULL,
    slug         VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    description  TEXT,
    icon         VARCHAR(50),
    schema       JSONB        NOT NULL,
    is_active    BOOLEAN      NOT NULL DEFAULT true,
    created_by   UUID,
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_entity_def_tenant ON entity_definitions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entity_def_slug   ON entity_definitions(slug);
