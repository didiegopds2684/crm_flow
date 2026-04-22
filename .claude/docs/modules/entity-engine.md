# Entity Engine — Documentação do Módulo

## Responsabilidade

Motor central do CRM Flow. Permite criar entidades, campos, tipos e relacionamentos
em runtime via API, sem alterar código ou banco. Persiste tudo em PostgreSQL JSONB.

---

## Estrutura de pacotes

```
com.crmflow.entity/
  controller/
    EntityDefinitionController.java   # CRUD de schemas
    EntityRecordController.java       # CRUD de registros dinâmicos
  service/
    EntityDefinitionService.java      # regras de negócio de schemas
    EntityRecordService.java          # regras de negócio de registros
    SchemaValidatorService.java       # valida payload contra schema JSONB
    DynamicQueryBuilderService.java   # monta queries JSONB dinamicamente
    RelationshipResolverService.java  # resolve FKs e monta grafo de dados
    EventPublisherService.java        # publica eventos no RabbitMQ
  repository/
    EntityDefinitionRepository.java
    EntityRecordRepository.java       # contém queries JSONB customizadas
  model/
    EntityDefinition.java             # @Entity JPA
    EntityRecord.java                 # @Entity JPA com campo JSONB
  dto/
    EntityDefinitionRequest.java      # record Java
    EntityDefinitionResponse.java     # record Java
    EntityRecordRequest.java          # record Java (data: Map<String, Object>)
    EntityRecordResponse.java         # record Java
    FieldDefinition.java              # record — definição de um campo
    FilterRequest.java                # record — parâmetros de busca
  mapper/
    EntityDefinitionMapper.java
    EntityRecordMapper.java
  exception/
    EntityNotFoundException.java
    SchemaValidationException.java    # lista de erros de validação
    DuplicateEntitySlugException.java
  config/
    RabbitMQConfig.java               # exchanges e queues
  client/
    PermissionServiceClient.java      # Feign — chama permission-service
```

---

## SchemaValidatorService — lógica central

O validador recebe o payload de um registro e valida campo a campo contra o schema JSONB.

### Tipos suportados e validações

```java
public enum FieldType {
    STRING,    // minLength, maxLength, pattern
    EMAIL,     // formato de email + unique
    NUMBER,    // min, max, precision
    BOOLEAN,
    DATE,      // ISO 8601: yyyy-MM-dd
    DATETIME,  // ISO 8601 com timezone
    ENUM,      // valor deve estar em options[]
    RELATION,  // UUID de registro de outra entidade
    TEXT,      // texto longo, maxLength
    URL,       // formato URL
    PHONE      // formato telefone
}
```

### Contrato do validador

```java
public class SchemaValidatorService {

    /**
     * Valida o payload contra o schema da entidade.
     *
     * @param schema    JSONB da entity_definition (campo "schema")
     * @param payload   dados enviados pelo cliente
     * @throws SchemaValidationException lista de erros encontrados
     */
    public void validate(Map<String, Object> schema, Map<String, Object> payload) {
        List<ValidationError> errors = new ArrayList<>();

        List<Map<String, Object>> fields = (List) schema.get("fields");
        for (Map<String, Object> field : fields) {
            String fieldName = (String) field.get("name");
            String fieldType = (String) field.get("type");
            boolean required = Boolean.TRUE.equals(field.get("required"));
            Object value = payload.get(fieldName);

            // 1. Verificar required
            if (required && value == null) {
                errors.add(new ValidationError(fieldName, "Campo obrigatório"));
                continue;
            }
            if (value == null) continue;  // opcional e não enviado: ok

            // 2. Validar por tipo
            validateByType(fieldName, fieldType, field, value, errors);
        }

        if (!errors.isEmpty()) {
            throw new SchemaValidationException(errors);
        }
    }
}
```

---

## DynamicQueryBuilderService — queries JSONB

Monta queries PostgreSQL para filtrar, ordenar e paginar dentro do campo JSONB.

### Operadores de filtro suportados

| Operador  | SQL gerado                              | Exemplo de uso          |
|-----------|-----------------------------------------|-------------------------|
| `eq`      | `data->>'campo' = :value`              | status=eq:ativo         |
| `neq`     | `data->>'campo' != :value`             | status=neq:perdido      |
| `contains`| `data->>'campo' ILIKE :value`          | nome=contains:Silva     |
| `gt`      | `(data->>'campo')::numeric > :value`   | score=gt:70             |
| `gte`     | `(data->>'campo')::numeric >= :value`  | score=gte:70            |
| `lt`      | `(data->>'campo')::numeric < :value`   | score=lt:50             |
| `lte`     | `(data->>'campo')::numeric <= :value`  | score=lte:50            |
| `in`      | `data->>'campo' IN (:values)`          | status=in:novo,ativo    |
| `null`    | `data->>'campo' IS NULL`               | email=null              |
| `notnull` | `data->>'campo' IS NOT NULL`           | email=notnull           |

### Exemplo de query gerada

```
GET /api/v1/entities/lead/records?status=eq:qualificado&score=gte:70&sort=score:desc&page=0&size=20
```
```sql
SELECT * FROM entity_records
WHERE entity_id = :entityId
  AND tenant_id = :tenantId
  AND data->>'status' = 'qualificado'
  AND (data->>'score')::numeric >= 70
ORDER BY (data->>'score')::numeric DESC
LIMIT 20 OFFSET 0;
```

---

## EntityRecordRepository — queries customizadas

```java
public interface EntityRecordRepository extends JpaRepository<EntityRecord, UUID> {

    // Busca com filtro por entidade e tenant
    @Query(value = """
        SELECT * FROM entity_records
        WHERE entity_id = :entityId
          AND tenant_id = :tenantId
        """, nativeQuery = true)
    Page<EntityRecord> findByEntityAndTenant(UUID entityId, UUID tenantId, Pageable pageable);

    // Busca full-text dentro do JSONB (usa índice GIN)
    @Query(value = """
        SELECT * FROM entity_records
        WHERE entity_id = :entityId
          AND tenant_id = :tenantId
          AND data::text ILIKE '%' || :query || '%'
        """, nativeQuery = true)
    Page<EntityRecord> fullTextSearch(UUID entityId, UUID tenantId, String query, Pageable pageable);

    // Busca com operador @> (containment JSONB — mais performático)
    @Query(value = """
        SELECT * FROM entity_records
        WHERE entity_id = :entityId
          AND tenant_id = :tenantId
          AND data @> :filter::jsonb
        """, nativeQuery = true)
    List<EntityRecord> findByJsonContains(UUID entityId, UUID tenantId, String filter);
}
```

---

## RelationshipResolverService — resolução de FKs

Quando um registro tem um campo do tipo `relation`, o resolver busca o registro relacionado
e o incorpora na resposta.

### Comportamento

```
Registro Lead: { "nome": "João", "cliente_id": "uuid-123" }
                                          │
                                          ▼
RelationshipResolver busca entity_records WHERE id = "uuid-123" AND entity = "cliente"
                                          │
                                          ▼
Resposta: {
  "nome": "João",
  "cliente": {              ← objeto completo, não só o ID
    "id": "uuid-123",
    "data": { "nome": "Empresa ABC", "cnpj": "..." }
  }
}
```

### Performance
- Relacionamentos são resolvidos com `IN` (batch, não N+1)
- Resultado é cacheado no Redis com TTL de 5 minutos
- Profundidade máxima: 2 níveis (evita loops)

---

## EventPublisherService — eventos RabbitMQ

Após cada operação de escrita bem-sucedida, publica um evento:

```java
public record EntityEvent(
    UUID tenantId,
    String entitySlug,
    UUID recordId,
    String action,         // CREATED | UPDATED | DELETED
    Map<String, Object> payload,
    UUID actorId,
    Instant occurredAt
) {}
```

```java
// Exchange: crmflow.entities
// Routing key: entity.record.created | entity.record.updated | entity.record.deleted
rabbitTemplate.convertAndSend(
    "crmflow.entities",
    "entity.record." + action.toLowerCase(),
    event
);
```

---

## Fluxo completo: criar um registro

```
POST /api/v1/entities/lead/records
Headers: Authorization: Bearer <jwt>, X-Tenant-ID: <uuid>
Body: { "nome": "João", "status": "novo", "score": 45 }

1. EntityRecordController.create()
   └─ extrai tenantId do contexto
   └─ chama EntityRecordService.create(slug, payload, tenantId, userId)

2. EntityRecordService.create()
   ├─ busca EntityDefinition por slug + tenantId   (com cache Redis)
   ├─ SchemaValidatorService.validate(schema, payload)
   │   ├─ nome: required string ✓
   │   ├─ status: enum, valor "novo" está em options ✓
   │   └─ score: number, 45 entre 0 e 100 ✓
   ├─ PermissionServiceClient.check(userId, tenantId, "lead", "CREATE", payload)
   │   └─ retorna { allowed: true, deniedFields: [] }
   ├─ EntityRecordRepository.save(record)
   └─ EventPublisherService.publish("CREATED", record)

3. Retorna EntityRecordResponse com status 201
```

---

## Cache (Redis)

| Chave                          | Conteúdo                    | TTL     |
|--------------------------------|-----------------------------|---------|
| `schema:{tenantId}:{slug}`     | EntityDefinition completa   | 10 min  |
| `record:{tenantId}:{recordId}` | EntityRecord resolvido      | 5 min   |
| `relations:{tenantId}`         | Lista de relacionamentos    | 10 min  |

Cache é invalidado automaticamente em qualquer operação de escrita.
