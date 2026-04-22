# Permission Service — Documentação do Módulo

## Responsabilidade

Avaliar se um usuário pode executar uma ação em uma entidade ou campo.
Implementa dois modelos: RBAC (por roles) e ABAC (por atributos/condições).

---

## Estrutura de pacotes

```
com.crmflow.permission/
  controller/
    RoleController.java
    PolicyController.java
    PermissionCheckController.java   # endpoint interno chamado pelos outros serviços
  service/
    RoleService.java
    PolicyService.java
    PermissionEvaluatorService.java  # orquestra RBAC + ABAC
    RbacEvaluatorService.java        # avalia roles e permissões básicas
    AbacEvaluatorService.java        # avalia condições SpEL dinâmicas
  repository/
    RoleRepository.java
    PolicyRepository.java
  model/
    Role.java
    Policy.java
  dto/
    PermissionCheckRequest.java
    PermissionCheckResponse.java
    RoleRequest.java
    PolicyRequest.java
  engine/
    SpelPolicyEngine.java            # avalia expressões SpEL das políticas ABAC
    PolicyContext.java               # variáveis disponíveis na expressão
```

---

## Hierarquia de roles (RBAC)

```
SUPER_ADMIN   → acesso total à plataforma (cross-tenant)
└── TENANT_ADMIN  → acesso total ao tenant
    └── MANAGER   → leitura + escrita + analytics
        └── OPERATOR  → CRUD de registros (conforme políticas)
            └── VIEWER    → somente leitura
```

### Permissões por role (padrão)

| Action         | TENANT_ADMIN | MANAGER | OPERATOR | VIEWER |
|----------------|:---:|:---:|:---:|:---:|
| entity:create  | ✓ | ✗ | ✗ | ✗ |
| entity:read    | ✓ | ✓ | ✓ | ✓ |
| entity:update  | ✓ | ✗ | ✗ | ✗ |
| entity:delete  | ✓ | ✗ | ✗ | ✗ |
| record:create  | ✓ | ✓ | ✓ | ✗ |
| record:read    | ✓ | ✓ | ✓ | ✓ |
| record:update  | ✓ | ✓ | ✓ | ✗ |
| record:delete  | ✓ | ✓ | ✗ | ✗ |
| analytics:read | ✓ | ✓ | ✗ | ✗ |
| user:manage    | ✓ | ✗ | ✗ | ✗ |

---

## ABAC — Políticas com SpEL

O `AbacEvaluatorService` usa o Spring Expression Language (SpEL) para avaliar
condições dinâmicas definidas pelo admin do tenant.

### Variáveis disponíveis na expressão

```java
public class PolicyContext {
    UUID userId;
    UUID tenantId;
    List<String> userRoles;
    Map<String, Object> record;       // dados do registro sendo acessado
    String action;                    // CREATE | READ | UPDATE | DELETE
    String entitySlug;
    LocalTime currentTime;
    LocalDate currentDate;
}
```

### Exemplos de políticas ABAC

```sql
-- Operador só acessa registros que ele mesmo criou
INSERT INTO permission_policies (tenant_id, role_id, entity_slug, action, condition, effect)
VALUES (:tid, :operatorRoleId, 'lead', 'READ',
        "record['created_by'] == #userId", 'ALLOW');

-- Campo "score" visível somente para Managers
INSERT INTO permission_policies (tenant_id, role_id, entity_slug, action, condition, effect)
VALUES (:tid, :viewerRoleId, 'lead', 'READ',
        "!#userRoles.contains('MANAGER')", 'DENY');
-- deniedFields: ['score']

-- Acesso somente em horário comercial
INSERT INTO permission_policies (tenant_id, role_id, entity_slug, action, condition, effect)
VALUES (:tid, :operatorRoleId, NULL, 'ALL',
        "#currentTime.hour < 8 || #currentTime.hour >= 18", 'DENY');
```

### SpelPolicyEngine

```java
@Service
public class SpelPolicyEngine {

    private final ExpressionParser parser = new SpelExpressionParser();

    public boolean evaluate(String condition, PolicyContext context) {
        StandardEvaluationContext ctx = new StandardEvaluationContext();
        ctx.setVariable("userId", context.getUserId().toString());
        ctx.setVariable("tenantId", context.getTenantId().toString());
        ctx.setVariable("userRoles", context.getUserRoles());
        ctx.setVariable("record", context.getRecord());
        ctx.setVariable("currentTime", context.getCurrentTime());
        ctx.setVariable("currentDate", context.getCurrentDate());

        Expression expression = parser.parseExpression(condition);
        return Boolean.TRUE.equals(expression.getValue(ctx, Boolean.class));
    }
}
```

---

## Contrato do endpoint de verificação

Chamado internamente pelo entity-engine via Feign.

### POST /api/v1/permissions/check

```json
// Request
{
  "userId": "uuid",
  "tenantId": "uuid",
  "entitySlug": "lead",
  "action": "READ",
  "recordData": {
    "nome": "João",
    "status": "ativo",
    "score": 87,
    "created_by": "outro-uuid"
  }
}

// Response
{
  "data": {
    "allowed": true,
    "deniedFields": ["score"]
  },
  "message": "OK",
  "success": true
}
```

---

## Fluxo de avaliação

```
PermissionEvaluatorService.check(request)
│
├─ 1. RBAC: usuário tem role com permissão básica para a action?
│   └─ NÃO → retorna { allowed: false }
│
├─ 2. ABAC: existe alguma policy DENY que se aplica?
│   └─ SIM (effect=DENY) → retorna { allowed: false }
│
├─ 3. ABAC: quais campos estão negados por policies de campo?
│   └─ coleta deniedFields
│
└─ Retorna { allowed: true, deniedFields: [...] }
```

---

## Cache de permissões

Permissões de role (RBAC) são estáticas e cacheadas:
```
Chave Redis: "rbac:{tenantId}:{roleId}"
TTL: 30 minutos
Invalidado quando: role ou policy é alterada
```

Políticas ABAC **não são cacheadas** pois dependem dos dados do registro em tempo real.
