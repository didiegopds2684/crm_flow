# CRM Flow — Guia para Claude Code

## O que é este projeto

Plataforma SaaS que permite empresas criarem seus próprios CRMs dinamicamente via API,
sem alterar código ou banco de dados. O núcleo é o **Dynamic Entity Engine**: um motor
que cria entidades, campos, tipos e relacionamentos em runtime usando PostgreSQL JSONB.

Inspirado na arquitetura da Sydle One. Construído para portfólio sênior em Java/Spring Boot.

---

## Leia antes de qualquer tarefa

Antes de implementar qualquer coisa, leia os docs nesta ordem:

1. `.claude/docs/architecture/overview.md` — visão geral e decisões de arquitetura
2. `.claude/docs/architecture/services.md` — os 6 microsserviços e responsabilidades
3. `.claude/docs/database/schema.md` — modelo de dados completo
4. `.claude/docs/modules/<modulo>.md` — doc do módulo que você vai trabalhar

---

## Stack (não mude sem consultar)

| Camada        | Tecnologia                          |
|---------------|-------------------------------------|
| Runtime       | Java 21 (Virtual Threads habilitado)|
| Framework     | Spring Boot 3.3.x                   |
| Build         | Maven (multi-module)                |
| Segurança     | Spring Security 6 + JWT RS256       |
| Persistência  | Spring Data JPA + PostgreSQL 16     |
| JSONB Queries | JPQL nativo + @Query customizado    |
| Cache         | Redis 7 + Spring Cache (@Cacheable) |
| Mensageria    | RabbitMQ + Spring AMQP              |
| Gateway       | Spring Cloud Gateway 4.x            |
| Resiliência   | Resilience4j 2.x                    |
| Docs          | SpringDoc OpenAPI 3 (Swagger UI)    |
| Testes        | JUnit 5 + Mockito + Testcontainers  |
| Containers    | Docker + Docker Compose             |
| Deploy        | Railway                             |
| Frontend      | Next.js 14 + Tailwind CSS           |

---

## Regras de código (siga sempre)

### Estrutura de pacotes por serviço
```
com.crmflow.<service>/
  controller/     # @RestController — só recebe e delega
  service/        # @Service — lógica de negócio
  repository/     # @Repository — acesso a dados
  model/          # @Entity JPA ou POJO
  dto/            # Records Java (imutáveis, sem lombok)
  mapper/         # Conversão model ↔ dto
  exception/      # Exceptions customizadas + GlobalExceptionHandler
  config/         # Beans de configuração
  security/       # Filtros e configs de segurança
```

### Convenções obrigatórias
- **DTOs**: use `record` do Java (sem Lombok)
- **IDs**: sempre `UUID`, nunca Long auto-increment
- **Datas**: sempre `Instant` (UTC) — nunca LocalDateTime sem timezone
- **Exceptions**: sempre lançar exceções tipadas, nunca retornar null
- **Logs**: usar `Slf4j` — nunca `System.out.println`
- **Tenant**: toda query DEVE filtrar por `tenantId` — nunca esquecer
- **Testes**: mínimo de teste unitário para todo `@Service`

### Respostas da API
```java
// Sempre usar este wrapper
public record ApiResponse<T>(T data, String message, boolean success) {
    public static <T> ApiResponse<T> of(T data) {
        return new ApiResponse<>(data, "OK", true);
    }
    public static <T> ApiResponse<T> of(T data, String message) {
        return new ApiResponse<>(data, message, true);
    }
}
```

### Tratamento de erros
```java
// GlobalExceptionHandler retorna sempre:
public record ErrorResponse(String error, String message, int status, Instant timestamp) {}
```

---

## Multi-tenancy (crítico — leia com atenção)

- Cada tenant tem seu próprio **schema PostgreSQL** (schema-per-tenant)
- O tenant é identificado pelo header `X-Tenant-ID` em toda requisição
- O `TenantContext` (ThreadLocal) armazena o tenant da thread atual
- **Toda query JPA deve usar `tenantId`** — o `TenantFilter` popula o contexto mas não é garantia
- Ao criar um tenant, o `TenantSchemaService` executa `CREATE SCHEMA <slug>` automaticamente

---

## Fase atual de desenvolvimento

Consulte `.claude/docs/roadmap.md` para saber em qual fase estamos e o que está pendente.
Ao concluir uma tarefa, atualize o status no roadmap.

---

## Comandos úteis

```bash
# Subir ambiente completo
docker-compose up -d

# Subir só as infras (postgres, redis, rabbit)
docker-compose up -d postgres redis rabbitmq

# Rodar testes de um serviço
cd auth-service && mvn test

# Rodar testes de integração (precisa Docker)
mvn test -P integration

# Build de todos os serviços
mvn clean package -DskipTests

# Ver logs de um serviço
docker-compose logs -f entity-engine
```

---

## Portas locais

| Serviço            | Porta  | Swagger                          |
|--------------------|--------|----------------------------------|
| api-gateway        | 8080   | —                                |
| auth-service       | 8081   | http://localhost:8081/swagger-ui |
| tenant-service     | 8082   | http://localhost:8082/swagger-ui |
| entity-engine      | 8083   | http://localhost:8083/swagger-ui |
| permission-service | 8084   | http://localhost:8084/swagger-ui |
| analytics-service  | 8085   | http://localhost:8085/swagger-ui |
| PostgreSQL         | 5432   | —                                |
| Redis              | 6379   | —                                |
| RabbitMQ           | 5672   | http://localhost:15672           |
| Frontend (Next.js) | 3000   | —                                |
