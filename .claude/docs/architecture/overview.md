# Arquitetura Geral — CRM Flow

## Padrão: Microsserviços com Database-per-Service

Cada serviço é independente, tem seu próprio banco (ou schema) e se comunica via:
- **REST síncrono** (Feign Client) — para operações que precisam de resposta imediata
- **RabbitMQ assíncrono** — para eventos que não bloqueiam o fluxo principal

---

## Fluxo de uma requisição

```
Cliente (Browser / App)
    │
    ▼
[API Gateway :8080]
    │  valida JWT (chave pública RS256)
    │  roteia para o serviço correto
    │  propaga headers: X-Tenant-ID, X-User-ID, Authorization
    │
    ├──▶ [Auth Service :8081]
    │
    ├──▶ [Tenant Service :8082]
    │
    ├──▶ [Entity Engine :8083]
    │         │
    │         ├──▶ [Permission Service :8084]  (verifica ABAC antes de retornar dados)
    │         │
    │         └──▶ [RabbitMQ] ──▶ [Analytics Service :8085]
    │
    └──▶ [Permission Service :8084]
```

---

## Decisões de arquitetura (não reverter sem justificativa)

### Por que microsserviços desde o início?
Objetivo de portfólio: demonstrar conhecimento de Spring Cloud, service discovery,
circuit breaker e comunicação inter-serviços. O custo de complexidade é aceito.

### Por que schema-per-tenant e não row-level security?
Row-level security exige filtro em 100% das queries — qualquer esquecimento vaza dados.
Schema-per-tenant dá isolamento estrutural: impossível vazar dados entre tenants por bug.

### Por que JSONB e não EAV (Entity-Attribute-Value)?
EAV em SQL relacional exige JOINs N+1 para reconstruir um registro.
JSONB no PostgreSQL permite busca indexada (índice GIN), armazena o objeto completo
e tem suporte nativo a operadores de busca (`@>`, `?`, `#>>`).

### Por que JWT RS256 (assimétrico) e não HS256 (simétrico)?
Com múltiplos microsserviços, HS256 exige compartilhar o secret em todos os serviços.
RS256 permite que cada serviço valide tokens com a chave pública — sem compartilhar segredo.

### Por que RabbitMQ e não Kafka?
Kafka é superior para alta volumetria. Para este portfólio, RabbitMQ é suficiente,
tem UI administrativa melhor e é mais simples de configurar e demonstrar.

---

## Infraestrutura (Docker Compose)

```yaml
# Resumo dos serviços de infraestrutura
postgres:
  image: postgres:16
  # Um banco, múltiplos schemas (um por tenant + schema público)

redis:
  image: redis:7-alpine
  # Cache de tokens, schemas de entidades, agregações de analytics

rabbitmq:
  image: rabbitmq:3-management
  # Exchanges: crmflow.entities, crmflow.auth, crmflow.tenants
  # Queues: analytics.records, analytics.events
```

---

## Propagação de contexto entre serviços

O API Gateway adiciona os seguintes headers em toda requisição roteada:

```
X-Tenant-ID:  <uuid do tenant>
X-User-ID:    <uuid do usuário>
X-User-Roles: TENANT_ADMIN,MANAGER   (comma-separated)
```

Cada microsserviço extrai esses headers via `@RequestHeader` ou filtro global
e popula o `TenantContext` e `SecurityContext` da thread.

---

## Resiliência entre serviços

Toda chamada Feign entre serviços usa Resilience4j:

```java
@CircuitBreaker(name = "permission-service", fallbackMethod = "defaultAllow")
@Retry(name = "permission-service")
public boolean checkPermission(...) { ... }
```

Configuração em `application.yml` de cada serviço consumidor.

---

## Segurança em camadas

```
Camada 1: API Gateway     → valida JWT está presente e não expirado
Camada 2: Microsserviço   → valida roles (RBAC) via Spring Security
Camada 3: Entity Engine   → filtra campos por políticas ABAC (Permission Service)
Camada 4: Repository      → sempre filtra por tenantId na query
```
