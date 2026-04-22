# Auth Service — Documentação do Módulo

## Responsabilidade

Autenticação de usuários, emissão de JWT RS256, refresh token e gerência de sessões.
É o único serviço que emite tokens — todos os outros apenas validam.

---

## Estrutura de pacotes

```
com.crmflow.auth/
  controller/
    AuthController.java
    UserController.java
  service/
    AuthService.java          # lógica de login/register/logout
    JwtService.java           # emissão e validação de tokens RS256
    RefreshTokenService.java  # gerência de refresh tokens no Redis
    UserService.java          # CRUD de usuários
  repository/
    UserRepository.java
  model/
    User.java
  dto/
    RegisterRequest.java      # record: email, password, name
    LoginRequest.java         # record: email, password
    LoginResponse.java        # record: accessToken, refreshToken, expiresIn
    RefreshRequest.java       # record: refreshToken
    UserResponse.java         # record: id, email, name, createdAt
  security/
    SecurityConfig.java       # configura endpoints públicos e privados
    JwtAuthFilter.java        # valida JWT em cada requisição
  exception/
    InvalidCredentialsException.java
    UserAlreadyExistsException.java
    InvalidTokenException.java
  config/
    RsaKeyConfig.java         # carrega par de chaves RSA do classpath
```

---

## JwtService — implementação RS256

```java
@Service
public class JwtService {

    private final RSAPrivateKey privateKey;
    private final RSAPublicKey publicKey;

    // TTL em minutos
    private static final int ACCESS_TOKEN_TTL = 15;

    public String generateAccessToken(User user, UUID tenantId, List<String> roles) {
        return Jwts.builder()
            .subject(user.getId().toString())
            .claim("tenant_id", tenantId.toString())
            .claim("roles", roles)
            .claim("scopes", buildScopes(roles))
            .issuedAt(new Date())
            .expiration(Date.from(Instant.now().plusSeconds(ACCESS_TOKEN_TTL * 60)))
            .signWith(privateKey, Jwts.SIG.RS256)
            .compact();
    }

    public Claims validateAndExtract(String token) {
        return Jwts.parser()
            .verifyWith(publicKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
```

---

## RefreshTokenService — Redis

```java
// Refresh token é um UUID opaco armazenado no Redis
// Chave: "refresh:{tokenHash}"    (SHA-256 do token)
// Valor: "{userId}:{tenantId}"
// TTL:   7 dias

public class RefreshTokenService {
    public String generate(UUID userId, UUID tenantId) { ... }
    public Optional<TokenData> validate(String token) { ... }
    public void revoke(String token) { ... }
    public void revokeAll(UUID userId) { ... }  // usado no logout de todos os dispositivos
}
```

---

## Endpoints e contratos

### POST /api/v1/auth/register
```json
// Request
{
  "email": "joao@empresa.com",
  "password": "Senha@123",
  "name": "João Silva"
}

// Response 201
{
  "data": {
    "id": "uuid",
    "email": "joao@empresa.com",
    "name": "João Silva",
    "createdAt": "2025-04-22T10:00:00Z"
  },
  "message": "Usuário criado com sucesso",
  "success": true
}
```

### POST /api/v1/auth/login
```json
// Request
{
  "email": "joao@empresa.com",
  "password": "Senha@123"
}

// Response 200
{
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "uuid-opaque-token",
    "expiresIn": 900,
    "tokenType": "Bearer"
  },
  "message": "OK",
  "success": true
}
```

### POST /api/v1/auth/refresh
```json
// Request
{ "refreshToken": "uuid-opaque-token" }

// Response 200
{
  "data": {
    "accessToken": "eyJhbGci...",
    "expiresIn": 900
  },
  "message": "OK",
  "success": true
}
```

---

## Configuração de segurança

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/register",
                                 "/api/v1/auth/login",
                                 "/api/v1/auth/refresh",
                                 "/swagger-ui/**",
                                 "/v3/api-docs/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
```

---

## Validações de senha

```
Mínimo 8 caracteres
Pelo menos 1 maiúscula
Pelo menos 1 minúscula
Pelo menos 1 número
Pelo menos 1 caractere especial (@#$%^&*)
```

Implementado via anotação customizada `@ValidPassword` + `PasswordValidator`.

---

## Chaves RSA — onde ficam

```
auth-service/src/main/resources/keys/
├── private.pem     # Chave privada (NUNCA commitar em repositório público)
└── public.pem      # Chave pública (compartilhada com outros serviços)
```

Em produção, as chaves são injetadas via variável de ambiente:
```
JWT_PRIVATE_KEY=<base64 da chave privada>
JWT_PUBLIC_KEY=<base64 da chave pública>
```

A chave pública é copiada para todos os outros microsserviços no build do Docker.
