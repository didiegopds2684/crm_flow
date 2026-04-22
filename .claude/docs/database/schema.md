# Database Schema — CRM Flow

## Estratégia: Schema-per-Tenant

```
PostgreSQL (único banco: crmflow_db)
├── schema: public          → dados globais (tenants, users, analytics events)
├── schema: tenant_acme     → dados do tenant "acme"
├── schema: tenant_foobar   → dados do tenant "foobar"
└── schema: tenant_<slug>   → criado automaticamente ao criar um tenant
```

---

## Schema: public (global)

### users
```sql
CREATE TABLE public.users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    name        VARCHAR(200) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_email ON public.users(email);
```

### tenants
```sql
CREATE TABLE public.tenants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(200) NOT NULL,
    slug        VARCHAR(100) UNIQUE NOT NULL,
    plan        VARCHAR(50)  NOT NULL DEFAULT 'FREE',
    status      VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',
    settings    JSONB        NOT NULL DEFAULT '{}',
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT now()
);
-- slug vira o nome do schema: tenant_<slug>
```

### tenant_users
```sql
CREATE TABLE public.tenant_users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.users(id)   ON DELETE CASCADE,
    role        VARCHAR(50)  NOT NULL DEFAULT 'OPERATOR',
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, user_id)
);
```

### entity_events (analytics)
```sql
CREATE TABLE public.entity_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID         NOT NULL,
    entity_slug VARCHAR(100) NOT NULL,
    record_id   UUID         NOT NULL,
    action      VARCHAR(20)  NOT NULL,  -- CREATED | UPDATED | DELETED
    payload     JSONB,
    actor_id    UUID,
    occurred_at TIMESTAMP    NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_tenant_slug ON public.entity_events(tenant_id, entity_slug);
CREATE INDEX idx_events_occurred    ON public.entity_events(occurred_at DESC);
CREATE INDEX idx_events_payload     ON public.entity_events USING GIN(payload);
```

---

## Schema: tenant_<slug> (por tenant)

Criado automaticamente via `TenantSchemaService` ao registrar um tenant.
O Flyway aplica as migrations abaixo no schema correto.

### entity_definitions
```sql
-- Define as "classes" criadas pelo admin do tenant
CREATE TABLE entity_definitions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID         NOT NULL,
    name         VARCHAR(100) NOT NULL,
    slug         VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    description  TEXT,
    icon         VARCHAR(50),
    schema       JSONB        NOT NULL,
    is_active    BOOLEAN      NOT NULL DEFAULT true,
    created_by   UUID,
    created_at   TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, slug)
);

-- Exemplo de schema JSONB:
-- {
--   "fields": [
--     {
--       "name": "nome",
--       "type": "string",
--       "label": "Nome completo",
--       "required": true,
--       "maxLength": 200
--     },
--     {
--       "name": "status",
--       "type": "enum",
--       "label": "Status",
--       "required": true,
--       "options": ["novo", "qualificado", "convertido", "perdido"]
--     },
--     {
--       "name": "score",
--       "type": "number",
--       "label": "Score",
--       "required": false,
--       "min": 0,
--       "max": 100
--     },
--     {
--       "name": "cliente_id",
--       "type": "relation",
--       "label": "Cliente",
--       "required": false,
--       "relatedEntity": "cliente",
--       "relationType": "MANY_TO_ONE"
--     }
--   ]
-- }
```

### entity_records
```sql
-- Armazena todos os registros de todas as entidades do tenant
CREATE TABLE entity_records (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id   UUID      NOT NULL REFERENCES entity_definitions(id) ON DELETE CASCADE,
    tenant_id   UUID      NOT NULL,
    data        JSONB     NOT NULL DEFAULT '{}',
    created_by  UUID,
    updated_by  UUID,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

-- CRÍTICO: índice GIN para buscas dentro do JSONB
CREATE INDEX idx_records_entity   ON entity_records(entity_id);
CREATE INDEX idx_records_tenant   ON entity_records(tenant_id);
CREATE INDEX idx_records_data_gin ON entity_records USING GIN(data);

-- Exemplo de data JSONB:
-- {
--   "nome": "João Silva",
--   "status": "qualificado",
--   "score": 87,
--   "cliente_id": "uuid-do-cliente"
-- }
```

### entity_relationships
```sql
-- Define relacionamentos entre entidades do mesmo tenant
CREATE TABLE entity_relationships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID         NOT NULL,
    from_entity_id  UUID         NOT NULL REFERENCES entity_definitions(id),
    to_entity_id    UUID         NOT NULL REFERENCES entity_definitions(id),
    field_name      VARCHAR(100) NOT NULL,
    relation_type   VARCHAR(20)  NOT NULL,  -- MANY_TO_ONE | ONE_TO_MANY | MANY_TO_MANY
    cascade_delete  BOOLEAN      NOT NULL DEFAULT false,
    created_at      TIMESTAMP    NOT NULL DEFAULT now()
);
```

### permission_roles
```sql
CREATE TABLE permission_roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID         NOT NULL,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL,
    description TEXT,
    is_system   BOOLEAN      NOT NULL DEFAULT false,  -- roles built-in não podem ser deletadas
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, slug)
);

-- Roles built-in inseridas automaticamente:
-- TENANT_ADMIN, MANAGER, OPERATOR, VIEWER
```

### permission_policies
```sql
-- Políticas ABAC: regras dinâmicas de acesso
CREATE TABLE permission_policies (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID         NOT NULL,
    role_id      UUID         REFERENCES permission_roles(id),
    entity_slug  VARCHAR(100),           -- null = aplica a todas entidades
    action       VARCHAR(20)  NOT NULL,  -- CREATE | READ | UPDATE | DELETE | ALL
    condition    TEXT,                   -- expressão SpEL avaliada em runtime
    effect       VARCHAR(10)  NOT NULL DEFAULT 'ALLOW',  -- ALLOW | DENY
    priority     INTEGER      NOT NULL DEFAULT 0,
    created_at   TIMESTAMP    NOT NULL DEFAULT now()
);

-- Exemplos de condition (SpEL):
-- "record['created_by'] == #userId"
-- "record['score'] >= 70"
-- "#userRoles.contains('MANAGER')"
-- "T(java.time.LocalTime).now().getHour() >= 8 && T(java.time.LocalTime).now().getHour() <= 18"
```

---

## Convenções de migration (Flyway)

```
entity-engine/src/main/resources/db/migration/
├── public/
│   └── V1__create_events_table.sql
└── tenant/
    ├── V1__create_entity_definitions.sql
    ├── V2__create_entity_records.sql
    ├── V3__create_entity_relationships.sql
    └── V4__create_permission_tables.sql
```

As migrations do schema `tenant/` são aplicadas a cada novo schema de tenant
via `TenantSchemaService.initializeTenantSchema(String slug)`.
