CREATE TABLE IF NOT EXISTS entity_relationships (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID         NOT NULL,
    from_entity_id UUID         NOT NULL REFERENCES entity_definitions(id),
    to_entity_id   UUID         NOT NULL REFERENCES entity_definitions(id),
    field_name     VARCHAR(100) NOT NULL,
    relation_type  VARCHAR(20)  NOT NULL,
    cascade_delete BOOLEAN      NOT NULL DEFAULT false,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT now()
);
