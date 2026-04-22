package com.crmflow.permission.service;

import com.crmflow.permission.dto.RoleRequest;
import com.crmflow.permission.dto.RoleResponse;
import com.crmflow.permission.exception.DuplicateRoleException;
import com.crmflow.permission.exception.RoleNotFoundException;
import com.crmflow.permission.model.PermissionRole;
import com.crmflow.permission.repository.PermissionRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class RoleService {

    private final PermissionRoleRepository repository;

    public List<RoleResponse> listByTenant(UUID tenantId) {
        return repository.findByTenantId(tenantId).stream()
                .map(this::toResponse)
                .toList();
    }

    public RoleResponse findById(UUID id, UUID tenantId) {
        return repository.findByIdAndTenantId(id, tenantId)
                .map(this::toResponse)
                .orElseThrow(() -> new RoleNotFoundException("Role não encontrada: " + id));
    }

    @Transactional
    public RoleResponse create(RoleRequest request, UUID tenantId) {
        if (repository.existsBySlugAndTenantId(request.slug(), tenantId)) {
            throw new DuplicateRoleException(request.slug());
        }
        PermissionRole role = new PermissionRole();
        role.setTenantId(tenantId);
        role.setName(request.name());
        role.setSlug(request.slug());
        role.setDescription(request.description());
        role.setSystem(false);
        role = repository.save(role);
        log.info("Role criada: slug={} tenantId={}", request.slug(), tenantId);
        return toResponse(role);
    }

    @Transactional
    public void delete(UUID id, UUID tenantId) {
        PermissionRole role = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RoleNotFoundException("Role não encontrada: " + id));
        if (role.isSystem()) {
            throw new IllegalArgumentException("Roles de sistema não podem ser removidas");
        }
        repository.delete(role);
        log.info("Role removida: id={} tenantId={}", id, tenantId);
    }

    private RoleResponse toResponse(PermissionRole r) {
        return new RoleResponse(r.getId(), r.getTenantId(), r.getName(),
                r.getSlug(), r.getDescription(), r.isSystem(), r.getCreatedAt());
    }
}
