# Microsserviços — Responsabilidades e Contratos

## 1. api-gateway (:8080)

**Responsabilidade única**: rotear requisições e validar autenticação.

### O que faz
- Valida JWT em toda requisição (exceto `/auth/**`)
- Extrai `tenantId` e `userId` do token e adiciona nos headers
- Roteia para o serviço correto baseado no path
- Rate limiting por tenant (V2)

### O que NÃO faz
- Não tem banco de dados
- Não faz lógica de negócio
- Não valida permissões além da existência do JWT

### Rotas configuradas
```yaml
routes:
  - id: auth-service
    uri: lb://auth-service
    predicates: Path=/api/v1/auth/**

  - id: tenant-service
    uri: lb://tenant-service
    predicates: Path=/api/v1/tenants/**

  - id: entity-engine
    uri: lb://entity-engine
    predicates: Path=/api/v1/entities/**

  - id: permission-service
    uri: lb://permission-service
    predicates: Path=/api/v1/permissions/**

  - id: analytics-service
    uri: lb://analytics-service
    predicates: Path=/api/v1/analytics/**
```

### Filtros globais
- `JwtAuthFilter` — extrai e valida token, rejeita com 401 se inválido
- `TenantContextFilter` — adiciona `X-Tenant-ID` no header downstream
- `RequestLoggingFilter` — loga todas as requisições (method, path, tenant, latência)

---

## 2. auth-service (:8081)

**Responsabilidade**: autenticação, emissão e revogação de tokens.

### Endpoints
```
POST /api/v1/auth/register     → cria usuário
POST /api/v1/auth/login        → retorna access + refresh token
POST /api/v1/auth/refresh      → renova access token via refresh token
POST /api/v1/auth/logout       → invalida refresh token no Redis
GET  /api/v1/auth/me           → dados do usuário autenticado
```

### Modelo de dados
```sql
-- schema: public
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,  -- BCrypt
    name        VARCHAR(200) NOT NULL,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT now(),
    updated_at  TIMESTAMP DEFAULT now()
);

-- refresh tokens ficam no Redis
-- key: "refresh:<token_hash>"
-- value: user_id
-- TTL: 7 dias
```

### JWT RS256
- Par de chaves gerado no startup se não existir
- Chave privada: `classpath:keys/private.pem`
- Chave pública: `classpath:keys/public.pem` (compartilhada com todos os serviços)
- Access Token TTL: 15 minutos
- Claims: `sub` (userId), `tenant_id`, `roles`, `scopes`, `iat`, `exp`

---

## 3. tenant-service (:8082)

**Responsabilidade**: gerenciar tenants e seus usuários.

### Endpoints
```
POST   /api/v1/tenants                    → cria tenant (SUPER_ADMIN)
GET    /api/v1/tenants                    → lista tenants (SUPER_ADMIN)
GET    /api/v1/tenants/{id}              → busca tenant
PUT    /api/v1/tenants/{id}              → atualiza tenant
DELETE /api/v1/tenants/{id}              → desativa tenant

POST   /api/v1/tenants/{id}/users        → adiciona usuário ao tenant
GET    /api/v1/tenants/{id}/users        → lista usuários do tenant
DELETE /api/v1/tenants/{id}/users/{uid} → remove usuário do tenant
```

### Ação crítica: criação de tenant
Ao criar um tenant, o `TenantSchemaService` executa:
```sql
CREATE SCHEMA IF NOT EXISTS tenant_<slug>;
-- Depois roda migrations Flyway nesse schema:
--   V1__entity_definitions.sql
--   V2__entity_records.sql
--   V3__entity_relationships.sql
```

### Modelo de dados
```sql
-- schema: public
CREATE TABLE tenants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(200) NOT NULL,
    slug        VARCHAR(100) UNIQUE NOT NULL,  -- usado como nome do schema
    plan        VARCHAR(50) DEFAULT 'FREE',    -- FREE | PRO | ENTERPRISE
    status      VARCHAR(50) DEFAULT 'ACTIVE',  -- ACTIVE | SUSPENDED | CANCELLED
    created_at  TIMESTAMP DEFAULT now()
);

CREATE TABLE tenant_users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id),
    user_id     UUID NOT NULL,                 -- referência ao auth-service
    role        VARCHAR(50) NOT NULL,          -- TENANT_ADMIN | MANAGER | OPERATOR | VIEWER
    created_at  TIMESTAMP DEFAULT now(),
    UNIQUE(tenant_id, user_id)
);
```

---

## 4. entity-engine (:8083)

**Responsabilidade**: o coração do sistema. Gerencia schemas dinâmicos e registros.

Ver `.claude/docs/modules/entity-engine.md` para documentação completa.

### Endpoints (resumo)
```
# Schema Management
POST   /api/v1/entities/definitions           → cria entidade
GET    /api/v1/entities/definitions           → lista entidades do tenant
GET    /api/v1/entities/definitions/{slug}    → busca entidade por slug
PUT    /api/v1/entities/definitions/{slug}    → atualiza schema
DELETE /api/v1/entities/definitions/{slug}    → remove entidade

# Records (dinâmico por slug)
POST   /api/v1/entities/{slug}/records        → cria registro
GET    /api/v1/entities/{slug}/records        → lista com filtros
GET    /api/v1/entities/{slug}/records/{id}   → busca por id
PUT    /api/v1/entities/{slug}/records/{id}   → atualiza
DELETE /api/v1/entities/{slug}/records/{id}   → remove
GET    /api/v1/entities/{slug}/records/search → busca full-text
```

---

## 5. permission-service (:8084)

**Responsabilidade**: avaliar permissões RBAC e políticas ABAC.

### Endpoints
```
# Roles
POST /api/v1/permissions/roles              → cria role customizada
GET  /api/v1/permissions/roles              → lista roles do tenant
POST /api/v1/permissions/roles/{id}/users   → atribui role a usuário

# Policies (ABAC)
POST /api/v1/permissions/policies           → cria política
GET  /api/v1/permissions/policies           → lista políticas

# Verificação (chamado internamente pelos outros serviços)
POST /api/v1/permissions/check              → avalia se usuário pode executar ação
```

### Contrato de verificação (usado pelo entity-engine)
```java
// Request
record PermissionCheckRequest(
    UUID userId,
    UUID tenantId,
    String entitySlug,    // ex: "lead"
    String action,        // CREATE | READ | UPDATE | DELETE
    Map<String, Object> recordData  // dados do registro para avaliar ABAC
) {}

// Response
record PermissionCheckResponse(
    boolean allowed,
    List<String> deniedFields  // campos que o usuário não pode ver/editar
) {}
```

---

## 6. analytics-service (:8085)

**Responsabilidade**: consumir eventos e fornecer agregações.

### Consumo de eventos (RabbitMQ)
```
Exchange: crmflow.entities
Queue:    analytics.entity.events
Routing:  entity.record.*  (created, updated, deleted)
```

### Endpoints
```
GET /api/v1/analytics/{slug}/count           → total de registros
GET /api/v1/analytics/{slug}/by-field        → distribuição por campo enum
GET /api/v1/analytics/{slug}/timeseries      → série temporal (por dia/semana/mês)
GET /api/v1/analytics/{slug}/top             → top N por campo numérico
GET /api/v1/analytics/{slug}/export/csv      → exportação assíncrona
GET /api/v1/analytics/{slug}/export/{jobId}  → status/download do export
```

### Modelo de dados
```sql
-- schema: public (analytics é cross-tenant mas filtra por tenant_id)
CREATE TABLE entity_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    entity_slug VARCHAR(100) NOT NULL,
    record_id   UUID NOT NULL,
    action      VARCHAR(20) NOT NULL,  -- CREATED | UPDATED | DELETED
    payload     JSONB,                 -- snapshot do registro no momento do evento
    actor_id    UUID,                  -- user_id que gerou o evento
    occurred_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_entity_events_tenant_slug ON entity_events(tenant_id, entity_slug);
CREATE INDEX idx_entity_events_occurred_at ON entity_events(occurred_at);
```
