package com.crmflow.permission.service;

import com.crmflow.permission.dto.PolicyRequest;
import com.crmflow.permission.dto.PolicyResponse;
import com.crmflow.permission.exception.RoleNotFoundException;
import com.crmflow.permission.model.PermissionPolicy;
import com.crmflow.permission.repository.PermissionPolicyRepository;
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
public class PolicyService {

    private final PermissionPolicyRepository policyRepository;
    private final PermissionRoleRepository roleRepository;

    public List<PolicyResponse> listByTenant(UUID tenantId) {
        return policyRepository.findByTenantId(tenantId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<PolicyResponse> listByRole(UUID roleId, UUID tenantId) {
        return policyRepository.findByRoleIdAndTenantId(roleId, tenantId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PolicyResponse create(PolicyRequest request, UUID tenantId) {
        roleRepository.findByIdAndTenantId(request.roleId(), tenantId)
                .orElseThrow(() -> new RoleNotFoundException("Role não encontrada: " + request.roleId()));

        PermissionPolicy policy = new PermissionPolicy();
        policy.setTenantId(tenantId);
        policy.setRoleId(request.roleId());
        policy.setEntitySlug(request.entitySlug());
        policy.setAction(request.action().toUpperCase());
        policy.setEffect(request.effect().toUpperCase());
        policy.setPriority(request.priority());
        policy = policyRepository.save(policy);

        log.info("Política criada: role={} entity={} action={} effect={}",
                request.roleId(), request.entitySlug(), request.action(), request.effect());
        return toResponse(policy);
    }

    @Transactional
    public void delete(UUID id, UUID tenantId) {
        PermissionPolicy policy = policyRepository.findById(id)
                .filter(p -> p.getTenantId().equals(tenantId))
                .orElseThrow(() -> new RoleNotFoundException("Política não encontrada: " + id));
        policyRepository.delete(policy);
    }

    private PolicyResponse toResponse(PermissionPolicy p) {
        return new PolicyResponse(p.getId(), p.getTenantId(), p.getRoleId(),
                p.getEntitySlug(), p.getAction(), p.getEffect(), p.getPriority(), p.getCreatedAt());
    }
}
