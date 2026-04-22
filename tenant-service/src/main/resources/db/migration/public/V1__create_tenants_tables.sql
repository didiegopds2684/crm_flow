CREATE TABLE IF NOT EXISTS public.tenants (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(200) NOT NULL,
    slug       VARCHAR(100) UNIQUE NOT NULL,
    plan       VARCHAR(50)  NOT NULL DEFAULT 'FREE',
    status     VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',
    settings   JSONB        NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_users (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL,
    role       VARCHAR(50) NOT NULL DEFAULT 'OPERATOR',
    created_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user   ON public.tenant_users(user_id);
