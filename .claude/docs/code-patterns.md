# Padrões de Código — CRM Flow

## Este arquivo é referência de implementação

Cole exemplos daqui ao implementar novos serviços. Mantenha consistência.

---

## DTO — usando Records Java

```java
// Sempre use record para DTOs (imutável, sem Lombok)
public record LoginRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8) String password
) {}

public record LoginResponse(
    String accessToken,
    String refreshToken,
    int expiresIn,
    String tokenType
) {}

// Record com fábrica estática para conversão
public record UserResponse(
    UUID id,
    String email,
    String name,
    Instant createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getName(), user.getCreatedAt());
    }
}
```

---

## Wrapper de resposta padrão

```java
// Usado em TODOS os controllers
public record ApiResponse<T>(
    T data,
    String message,
    boolean success
) {
    public static <T> ApiResponse<T> of(T data) {
        return new ApiResponse<>(data, "OK", true);
    }

    public static <T> ApiResponse<T> of(T data, String message) {
        return new ApiResponse<>(data, message, true);
    }

    public static ApiResponse<Void> ok(String message) {
        return new ApiResponse<>(null, message, true);
    }
}
```

---

## Controller padrão

```java
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        log.info("Login attempt for email: {}", request.email());
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        UserResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
            ApiResponse.of(response, "Usuário criado com sucesso")
        );
    }
}
```

---

## Service padrão

```java
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new InvalidCredentialsException("Credenciais inválidas"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new InvalidCredentialsException("Credenciais inválidas");
        }

        if (!user.isActive()) {
            throw new InvalidCredentialsException("Usuário inativo");
        }

        String accessToken = jwtService.generateAccessToken(user, ...);
        String refreshToken = refreshTokenService.generate(user.getId(), ...);

        log.info("User {} logged in successfully", user.getId());
        return new LoginResponse(accessToken, refreshToken, 900, "Bearer");
    }
}
```

---

## Entity JPA padrão

```java
@Entity
@Table(name = "users", schema = "public")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void onUpdate() { this.updatedAt = Instant.now(); }
}
```

---

## Entity com campo JSONB

```java
@Entity
@Table(name = "entity_records")
@Getter
@Setter
@NoArgsConstructor
@TypeDef(name = "jsonb", typeClass = JsonBinaryType.class)  // hypersistence-utils
public class EntityRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Type(type = "jsonb")
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> data = new HashMap<>();

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
```

---

## GlobalExceptionHandler padrão

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    public record ErrorResponse(String error, String message, int status, Instant timestamp) {}

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(404).body(
            new ErrorResponse("NOT_FOUND", ex.getMessage(), 404, Instant.now())
        );
    }

    @ExceptionHandler(SchemaValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(SchemaValidationException ex) {
        return ResponseEntity.status(400).body(
            new ErrorResponse("VALIDATION_ERROR", ex.getMessage(), 400, Instant.now())
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleBeanValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return ResponseEntity.status(400).body(
            new ErrorResponse("VALIDATION_ERROR", message, 400, Instant.now())
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(AccessDeniedException ex) {
        return ResponseEntity.status(403).body(
            new ErrorResponse("FORBIDDEN", "Acesso negado", 403, Instant.now())
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(500).body(
            new ErrorResponse("INTERNAL_ERROR", "Erro interno do servidor", 500, Instant.now())
        );
    }
}
```

---

## TenantContext — multi-tenancy

```java
// Armazena o tenant da thread atual
public class TenantContext {

    private static final ThreadLocal<UUID> CURRENT_TENANT = new ThreadLocal<>();

    public static void setTenant(UUID tenantId) { CURRENT_TENANT.set(tenantId); }
    public static UUID getTenant() { return CURRENT_TENANT.get(); }
    public static void clear() { CURRENT_TENANT.remove(); }

    public static UUID requireTenant() {
        UUID tenant = CURRENT_TENANT.get();
        if (tenant == null) throw new IllegalStateException("Tenant não definido na thread atual");
        return tenant;
    }
}

// Filtro que popula o contexto
@Component
public class TenantFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws IOException, ServletException {
        String tenantId = request.getHeader("X-Tenant-ID");
        try {
            if (tenantId != null) {
                TenantContext.setTenant(UUID.fromString(tenantId));
            }
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();  // CRÍTICO: sempre limpar
        }
    }
}
```

---

## Feign Client padrão

```java
@FeignClient(
    name = "permission-service",
    url = "${services.permission-service.url}",
    configuration = FeignConfig.class
)
public interface PermissionServiceClient {

    @PostMapping("/api/v1/permissions/check")
    PermissionCheckResponse check(@RequestBody PermissionCheckRequest request);
}

// FeignConfig adiciona o JWT no header de chamadas inter-serviços
@Configuration
public class FeignConfig {
    @Bean
    public RequestInterceptor authInterceptor() {
        return template -> {
            String token = SecurityContextHolder.getContext()
                .getAuthentication()
                .getCredentials().toString();
            template.header("Authorization", "Bearer " + token);
            template.header("X-Tenant-ID", TenantContext.getTenant().toString());
        };
    }
}
```

---

## application.yml padrão de cada serviço

```yaml
spring:
  application:
    name: auth-service   # muda por serviço

  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/crmflow_db}
    username: ${DATABASE_USER:crmflow}
    password: ${DATABASE_PASS:crmflow123}

  jpa:
    hibernate:
      ddl-auto: validate   # nunca create-drop em produção
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        default_schema: public

  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}

  flyway:
    enabled: true
    locations: classpath:db/migration

server:
  port: 8081   # muda por serviço

jwt:
  public-key: ${JWT_PUBLIC_KEY:classpath:keys/public.pem}
  private-key: ${JWT_PRIVATE_KEY:classpath:keys/private.pem}

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics

springdoc:
  swagger-ui:
    path: /swagger-ui
  api-docs:
    path: /v3/api-docs
```
