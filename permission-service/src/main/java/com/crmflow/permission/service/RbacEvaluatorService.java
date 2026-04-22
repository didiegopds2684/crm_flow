package com.crmflow.permission.service;

import com.crmflow.permission.dto.PermissionCheckRequest;
import com.crmflow.permission.dto.PermissionCheckResponse;
import com.crmflow.permission.model.PermissionPolicy;
import com.crmflow.permission.model.PermissionRole;
import com.crmflow.permission.repository.PermissionPolicyRepository;
import com.crmflow.permission.repository.PermissionRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RbacEvaluatorService {

    private final PermissionRoleRepository roleRepository;
    private final PermissionPolicyRepository policyRepository;
    private final JdbcTemplate jdbcTemplate;
    private final RedisTemplate<String, String> stringRedisTemplate;

    // Built-in permissions for system roles (slug → allowed actions)
    private static final Map<String, Set<String>> BUILT_IN = Map.of(
            "TENANT_ADMIN", Set.of("CREATE", "READ", "UPDATE", "DELETE"),
            "MANAGER",      Set.of("CREATE", "READ", "UPDATE", "DELETE"),
            "OPERATOR",     Set.of("CREATE", "READ", "UPDATE"),
            "VIEWER",       Set.of("READ")
    );

    public PermissionCheckResponse evaluate(PermissionCheckRequest request) {
        UUID userId   = request.userId();
        UUID tenantId = request.tenantId();
        String entity = request.entitySlug();
        String action = request.action().toUpperCase();

        // 1. Resolve the user's role slug within this tenant
        String roleSlug = getUserRoleSlug(userId, tenantId);
        if (roleSlug == null) {
            log.debug("Usuário {} sem role no tenant {} — negado", userId, tenantId);
            return PermissionCheckResponse.deny("Usuário não possui role neste tenant");
        }

        // 2. TENANT_ADMIN bypasses all policy checks
        if ("TENANT_ADMIN".equalsIgnoreCase(roleSlug)) {
            return PermissionCheckResponse.allow();
        }

        // 3. Find the PermissionRole entity to get its UUID for policy lookup
        Optional<PermissionRole> roleOpt = roleRepository.findBySlugAndTenantId(roleSlug, tenantId);
        if (roleOpt.isEmpty()) {
            // Role row exists in tenant_users but not in permission_roles — fall back to built-in
            return evaluateBuiltIn(roleSlug, action);
        }

        UUID roleId = roleOpt.get().getId();

        // 4. Check custom policies (highest priority wins)
        List<PermissionPolicy> policies = policyRepository.findApplicable(tenantId, roleId, entity, action);

        if (!policies.isEmpty()) {
            PermissionPolicy topPolicy = policies.get(0);
            boolean allowed = "ALLOW".equalsIgnoreCase(topPolicy.getEffect());
            String reason = allowed
                    ? "Permitido por política personalizada"
                    : "Negado por política personalizada (prioridade " + topPolicy.getPriority() + ")";
            log.debug("userId={} roleSlug={} entity={} action={} → {}", userId, roleSlug, entity, action, reason);
            return new PermissionCheckResponse(allowed, reason, List.of());
        }

        // 5. No custom policies — fall back to built-in role rules
        return evaluateBuiltIn(roleSlug, action);
    }

    private PermissionCheckResponse evaluateBuiltIn(String roleSlug, String action) {
        Set<String> allowed = BUILT_IN.getOrDefault(roleSlug.toUpperCase(), Set.of());
        if (allowed.contains(action)) {
            return PermissionCheckResponse.allow();
        }
        return PermissionCheckResponse.deny(
                "Role '" + roleSlug + "' não tem permissão para " + action);
    }

    // Resolves the role slug assigned to a user in a tenant from public.tenant_users.
    // Cached in Redis for 5 minutes to avoid repeated DB hits per request.
    private String getUserRoleSlug(UUID userId, UUID tenantId) {
        String cacheKey = "user:role:" + tenantId + ":" + userId;
        String cached = stringRedisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached.isEmpty() ? null : cached;
        }

        try {
            String role = jdbcTemplate.queryForObject(
                    "SELECT role FROM public.tenant_users WHERE tenant_id = ?::uuid AND user_id = ?::uuid",
                    String.class, tenantId.toString(), userId.toString());

            String toCache = role != null ? role : "";
            stringRedisTemplate.opsForValue().set(cacheKey, toCache, Duration.ofMinutes(5));
            return role;

        } catch (EmptyResultDataAccessException e) {
            stringRedisTemplate.opsForValue().set(cacheKey, "", Duration.ofMinutes(5));
            return null;
        }
    }
}
