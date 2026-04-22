package com.crmflow.permission.service;

import com.crmflow.permission.dto.PermissionCheckRequest;
import com.crmflow.permission.dto.PermissionCheckResponse;
import com.crmflow.permission.model.PermissionPolicy;
import com.crmflow.permission.model.PermissionRole;
import com.crmflow.permission.repository.PermissionPolicyRepository;
import com.crmflow.permission.repository.PermissionRoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RbacEvaluatorServiceTest {

    @Mock private PermissionRoleRepository roleRepository;
    @Mock private PermissionPolicyRepository policyRepository;
    @Mock private JdbcTemplate jdbcTemplate;
    @Mock private RedisTemplate<String, String> stringRedisTemplate;
    @Mock private ValueOperations<String, String> valueOps;

    @InjectMocks
    private RbacEvaluatorService evaluator;

    private UUID userId;
    private UUID tenantId;

    @BeforeEach
    void setUp() {
        userId   = UUID.randomUUID();
        tenantId = UUID.randomUUID();
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get(anyString())).thenReturn(null); // no cache
    }

    private PermissionCheckRequest req(String action) {
        return new PermissionCheckRequest(userId, tenantId, "lead", action, Map.of());
    }

    private PermissionRole role(String slug) {
        PermissionRole r = new PermissionRole();
        r.setId(UUID.randomUUID());
        r.setTenantId(tenantId);
        r.setSlug(slug);
        r.setName(slug);
        r.setSystem(true);
        return r;
    }

    // ──────────────── TENANT_ADMIN ────────────────

    @Test
    void tenant_admin_can_do_anything() {
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), any(), any()))
                .thenReturn("TENANT_ADMIN");

        assertThat(evaluator.evaluate(req("DELETE")).allowed()).isTrue();
        assertThat(evaluator.evaluate(req("CREATE")).allowed()).isTrue();
        assertThat(evaluator.evaluate(req("READ")).allowed()).isTrue();
    }

    // ──────────────── MANAGER ────────────────

    @Test
    void manager_can_create_update_delete_read() {
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), any(), any()))
                .thenReturn("MANAGER");
        when(roleRepository.findBySlugAndTenantId("MANAGER", tenantId))
                .thenReturn(Optional.of(role("MANAGER")));
        when(policyRepository.findApplicable(any(), any(), any(), any()))
                .thenReturn(List.of());

        assertThat(evaluator.evaluate(req("CREATE")).allowed()).isTrue();
        assertThat(evaluator.evaluate(req("UPDATE")).allowed()).isTrue();
        assertThat(evaluator.evaluate(req("DELETE")).allowed()).isTrue();
        assertThat(evaluator.evaluate(req("READ")).allowed()).isTrue();
    }

    // ──────────────── OPERATOR ────────────────

    @Test
    void operator_cannot_delete() {
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), any(), any()))
                .thenReturn("OPERATOR");
        when(roleRepository.findBySlugAndTenantId("OPERATOR", tenantId))
                .thenReturn(Optional.of(role("OPERATOR")));
        when(policyRepository.findApplicable(any(), any(), any(), any()))
                .thenReturn(List.of());

        assertThat(evaluator.evaluate(req("DELETE")).allowed()).isFalse();
        assertThat(evaluator.evaluate(req("CREATE")).allowed()).isTrue();
        assertThat(evaluator.evaluate(req("UPDATE")).allowed()).isTrue();
    }

    // ──────────────── VIEWER ────────────────

    @Test
    void viewer_can_only_read() {
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), any(), any()))
                .thenReturn("VIEWER");
        when(roleRepository.findBySlugAndTenantId("VIEWER", tenantId))
                .thenReturn(Optional.of(role("VIEWER")));
        when(policyRepository.findApplicable(any(), any(), any(), any()))
                .thenReturn(List.of());

        assertThat(evaluator.evaluate(req("READ")).allowed()).isTrue();
        assertThat(evaluator.evaluate(req("CREATE")).allowed()).isFalse();
        assertThat(evaluator.evaluate(req("UPDATE")).allowed()).isFalse();
        assertThat(evaluator.evaluate(req("DELETE")).allowed()).isFalse();
    }

    // ──────────────── No role ────────────────

    @Test
    void user_without_role_is_denied() {
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), any(), any()))
                .thenThrow(org.springframework.dao.EmptyResultDataAccessException.class);

        PermissionCheckResponse response = evaluator.evaluate(req("READ"));
        assertThat(response.allowed()).isFalse();
    }

    // ──────────────── Custom policy overrides built-in ────────────────

    @Test
    void custom_deny_policy_overrides_built_in_allow() {
        PermissionRole managerRole = role("MANAGER");

        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), any(), any()))
                .thenReturn("MANAGER");
        when(roleRepository.findBySlugAndTenantId("MANAGER", tenantId))
                .thenReturn(Optional.of(managerRole));

        PermissionPolicy deny = new PermissionPolicy();
        deny.setEffect("DENY");
        deny.setPriority(10);
        when(policyRepository.findApplicable(any(), any(), eq("lead"), eq("DELETE")))
                .thenReturn(List.of(deny));

        assertThat(evaluator.evaluate(req("DELETE")).allowed()).isFalse();
    }

    @Test
    void custom_allow_policy_grants_viewer_extra_action() {
        PermissionRole viewerRole = role("VIEWER");

        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), any(), any()))
                .thenReturn("VIEWER");
        when(roleRepository.findBySlugAndTenantId("VIEWER", tenantId))
                .thenReturn(Optional.of(viewerRole));

        PermissionPolicy allow = new PermissionPolicy();
        allow.setEffect("ALLOW");
        allow.setPriority(5);
        when(policyRepository.findApplicable(any(), any(), eq("lead"), eq("CREATE")))
                .thenReturn(List.of(allow));

        assertThat(evaluator.evaluate(req("CREATE")).allowed()).isTrue();
    }
}
