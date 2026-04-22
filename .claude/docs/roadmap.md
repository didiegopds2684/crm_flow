# Roadmap — CRM Flow

## Como usar este arquivo

Atualize o status de cada tarefa conforme avança no desenvolvimento.
O Claude Code deve consultar este arquivo para saber o que está feito e o que vem a seguir.

Status:
- `[ ]` Pendente
- `[~]` Em progresso
- `[x]` Concluído

---

## MVP — Fundação (~6 semanas)

### Setup Inicial
- [x] Criar monorepo Maven multi-module (`pom.xml` pai + módulos)
- [x] `docker-compose.yml` com PostgreSQL, Redis, RabbitMQ
- [x] Estrutura de pastas dos 6 microsserviços
- [x] `application.yml` base de cada serviço
- [x] Script de criação do banco (`init.sql`)

### Auth Service
- [x] Modelo `User` + `UserRepository`
- [x] Geração de par de chaves RSA (script `infra/generate-keys.sh`)
- [x] `JwtService` — emissão e validação RS256
- [x] `RefreshTokenService` — Redis
- [x] `AuthController` — `/register`, `/login`, `/refresh`, `/logout`, `/me`
- [x] `SecurityConfig` — endpoints públicos e privados
- [x] `JwtAuthFilter` — valida token em rotas privadas
- [x] Testes unitários: `AuthService`, `JwtService`

### Tenant Service
- [x] Modelo `Tenant` + `TenantUser`
- [x] `TenantSchemaService` — cria schema PostgreSQL ao criar tenant + insere roles built-in
- [x] Migrations Flyway para schema de tenant (public/ e tenant/ separados)
- [x] `TenantController` — CRUD completo + gerência de usuários
- [x] Testes unitários: `TenantService`, `TenantSchemaService`

### API Gateway
- [ ] Configuração Spring Cloud Gateway
- [x] `JwtAuthFilter` — valida JWT e extrai claims
- [x] `TenantContextFilter` — adiciona `X-Tenant-ID` no header
- [x] Rotas para todos os serviços
- [x] `RequestLoggingFilter`

### Entity Engine — Fase 1 (Schemas)
- [x] Modelos: `EntityDefinition`, `EntityRecord`
- [x] `TenantFilter` — popula `TenantContext` da thread
- [x] `EntityDefinitionController` — CRUD de schemas
- [x] `EntityDefinitionService` + validações de schema
- [x] `EntityDefinitionRepository`
- [x] Cache Redis para schemas (`@Cacheable`)
- [x] Testes unitários: `EntityDefinitionService`

### Entity Engine — Fase 2 (Records)
- [x] `EntityRecordController` — endpoints dinâmicos por slug
- [x] `SchemaValidatorService` — validação de payload contra schema JSONB
- [x] `EntityRecordService` — CRUD com validação
- [x] `EntityRecordRepository` — queries JSONB nativas
- [x] `DynamicQueryBuilderService` — filtros dinâmicos
- [x] `EventPublisherService` — publica no RabbitMQ
- [x] Testes unitários: `SchemaValidatorService` (10 testes), `EntityDefinitionService` (6 testes)

### Permission Service (RBAC básico)
- [x] Modelos: `PermissionRole`, `PermissionPolicy`
- [x] Roles built-in inseridas via migration (pelo tenant-service V4)
- [x] `RoleController` + `RoleService` + `PolicyController` + `PolicyService`
- [x] `PermissionCheckController` — endpoint interno POST /api/v1/permissions/check
- [x] `RbacEvaluatorService` — avaliação RBAC + override por políticas customizadas
- [x] Feign Client no entity-engine → permission-service (com fallback Resilience4j)
- [x] Testes unitários: `RbacEvaluatorServiceTest` (7 testes)

### Infraestrutura e Docs
- [ ] `GlobalExceptionHandler` em cada serviço
- [ ] SpringDoc OpenAPI configurado em cada serviço
- [ ] `docker-compose up` sobe tudo sem erros
- [ ] Health check `/actuator/health` em cada serviço
- [ ] README com instruções de setup

---

## V1 — Produto (~6 semanas)

### Entity Engine — Avançado
- [ ] `RelationshipResolverService` — resolve FKs em registros
- [ ] Endpoint de busca full-text (`/records/search`)
- [ ] Paginação avançada com cursor (search_after)
- [ ] Suporte a campo tipo `relation` no SchemaValidator

### Permission Service — ABAC
- [ ] `PolicyController` + `PolicyService`
- [ ] `SpelPolicyEngine` — avaliação de expressões
- [ ] `AbacEvaluatorService` — orquestra políticas
- [ ] `deniedFields` — filtra campos na resposta do entity-engine
- [ ] Testes unitários: `SpelPolicyEngine`, `AbacEvaluatorService`

### Analytics Service
- [ ] Consumer RabbitMQ — `entity.record.*`
- [ ] `EntityEventRepository` — persistência de eventos
- [ ] `AnalyticsController` — endpoints de agregação
- [ ] Endpoint `/count`, `/by-field`, `/timeseries`
- [ ] Cache Redis para agregações
- [ ] Export CSV com Spring Batch
- [ ] Testes unitários: `AnalyticsService`

### Frontend (Next.js 14)
- [~] Setup projeto + Tailwind CSS + shadcn/ui
- [x] Tela de login com chamada ao auth-service
- [x] Dashboard do tenant admin
- [ ] Builder de entidades (lista e cria campos)
- [ ] Listagem dinâmica de registros
- [ ] Formulário dinâmico de criação de registro

### Deploy
- [ ] Dockerfiles para cada serviço
- [ ] Deploy no Railway
- [ ] GitHub Actions — build + push das imagens
- [ ] Variáveis de ambiente configuradas no Railway

---

## V2 — Escala (~6 semanas)

### Resiliência
- [ ] Resilience4j — circuit breaker no entity-engine → permission-service
- [ ] Resilience4j — retry na publicação RabbitMQ
- [ ] Rate limiting por tenant no API Gateway

### Qualidade
- [ ] Testes de integração com Testcontainers (PostgreSQL + Redis)
- [ ] Load tests com k6 (baseline de performance)
- [ ] Audit log — rastreamento de alterações

### Features Avançadas
- [ ] Webhooks — notificação externa em eventos
- [ ] Import/Export de schema entre tenants
- [ ] Analytics avançado — gráficos no frontend
- [ ] Dashboard de analytics com Chart.js

---

## Próxima tarefa recomendada

**Comece aqui → Setup Inicial do monorepo e docker-compose**

Quando iniciar uma tarefa, mude de `[ ]` para `[~]`.
Quando concluir, mude para `[x]` e registre abaixo se houver decisões tomadas.

---

## Decisões tomadas durante o desenvolvimento

> Registre aqui decisões de implementação que divergem do SDD original.

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-04-22 | `entity_events` migration movida para `analytics-service` (não `entity-engine`) | Analytics é quem persiste eventos; entity-engine apenas publica no RabbitMQ |
| 2026-04-22 | `flyway.enabled=false` no `permission-service` | Tabelas de permissão vivem no schema do tenant, criadas pelas migrations V4 do entity-engine |
| 2026-04-22 | Dockerfiles usam `context: .` (root do monorepo) | Necessário para MVN multi-module ter acesso ao parent pom.xml no build Docker |
| 2026-04-22 | Chaves RSA geradas via `infra/generate-keys.sh`; não commitadas (`.gitignore`) | Segurança: chave privada nunca deve estar no repositório |
| 2026-04-22 | entity-engine usa Hibernate SCHEMA multi-tenancy com `MultiTenantConnectionProvider` | Cada request executa `SET search_path TO tenant_<slug>` via `TenantConnectionProvider`; schema resolvido do `public.tenants` via Redis cache por `TenantSchemaResolver` |
| 2026-04-22 | `TenantFilter` em entity-engine resolve tenantId → schemaName consultando `public.tenants` | entity-engine compartilha o mesmo banco; evita chamada inter-serviço para algo imutável |
| 2026-04-22 | Frontend Next.js usa route handlers como BFF para `auth` e `tenants` | Mantém tokens em cookies HttpOnly e centraliza refresh sem expor credenciais ao browser |
