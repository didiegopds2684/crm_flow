package com.crmflow.permission.repository;

import com.crmflow.permission.model.PermissionRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PermissionRoleRepository extends JpaRepository<PermissionRole, UUID> {

    List<PermissionRole> findByTenantId(UUID tenantId);

    Optional<PermissionRole> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<PermissionRole> findBySlugAndTenantId(String slug, UUID tenantId);

    boolean existsBySlugAndTenantId(String slug, UUID tenantId);
}
