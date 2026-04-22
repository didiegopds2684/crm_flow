CREATE TABLE IF NOT EXISTS public.entity_events (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID         NOT NULL,
    entity_slug VARCHAR(100) NOT NULL,
    record_id   UUID         NOT NULL,
    action      VARCHAR(20)  NOT NULL,
    payload     JSONB,
    actor_id    UUID,
    occurred_at TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_tenant_slug ON public.entity_events(tenant_id, entity_slug);
CREATE INDEX IF NOT EXISTS idx_events_occurred    ON public.entity_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_payload     ON public.entity_events USING GIN(payload);
