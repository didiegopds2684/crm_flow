CREATE TABLE IF NOT EXISTS permission_roles (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID         NOT NULL,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL,
    description TEXT,
    is_system   BOOLEAN      NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS permission_policies (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID         NOT NULL,
    role_id      UUID         REFERENCES permission_roles(id),
    entity_slug  VARCHAR(100),
    action       VARCHAR(20)  NOT NULL,
    condition    TEXT,
    effect       VARCHAR(10)  NOT NULL DEFAULT 'ALLOW',
    priority     INTEGER      NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_policies_tenant_entity ON permission_policies(tenant_id, entity_slug);
CREATE INDEX IF NOT EXISTS idx_policies_role          ON permission_policies(role_id);
