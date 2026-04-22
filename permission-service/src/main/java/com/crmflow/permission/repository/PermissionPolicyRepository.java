package com.crmflow.permission.repository;

import com.crmflow.permission.model.PermissionPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PermissionPolicyRepository extends JpaRepository<PermissionPolicy, UUID> {

    List<PermissionPolicy> findByTenantId(UUID tenantId);

    List<PermissionPolicy> findByRoleIdAndTenantId(UUID roleId, UUID tenantId);

    // Finds policies matching a role + entity + action, ordered by priority DESC (highest wins)
    @Query("""
            SELECT p FROM PermissionPolicy p
            WHERE p.tenantId = :tenantId
              AND p.roleId = :roleId
              AND (p.entitySlug = :entitySlug OR p.entitySlug IS NULL)
              AND (p.action = :action OR p.action = '*')
            ORDER BY p.priority DESC
            """)
    List<PermissionPolicy> findApplicable(
            @Param("tenantId") UUID tenantId,
            @Param("roleId") UUID roleId,
            @Param("entitySlug") String entitySlug,
            @Param("action") String action);
}
