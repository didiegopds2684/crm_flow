package com.crmflow.tenant.service;

import com.crmflow.tenant.dto.*;
import com.crmflow.tenant.exception.TenantAlreadyExistsException;
import com.crmflow.tenant.exception.TenantNotFoundException;
import com.crmflow.tenant.exception.UserAlreadyInTenantException;
import com.crmflow.tenant.model.Tenant;
import com.crmflow.tenant.model.TenantUser;
import com.crmflow.tenant.repository.TenantRepository;
import com.crmflow.tenant.repository.TenantUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TenantService {

    private final TenantRepository tenantRepository;
    private final TenantUserRepository tenantUserRepository;
    private final TenantSchemaService tenantSchemaService;

    public TenantResponse create(CreateTenantRequest request, UUID creatorId) {
        if (tenantRepository.existsBySlug(request.slug())) {
            throw new TenantAlreadyExistsException("Slug já em uso: " + request.slug());
        }

        Tenant tenant = new Tenant();
        tenant.setName(request.name());
        tenant.setSlug(request.slug());
        tenant.setPlan(request.plan() != null ? request.plan() : "FREE");

        Tenant saved = tenantRepository.save(tenant);

        tenantSchemaService.initializeTenantSchema(saved.getSlug(), saved.getId());

        TenantUser creator = new TenantUser();
        creator.setTenantId(saved.getId());
        creator.setUserId(creatorId);
        creator.setRole("TENANT_ADMIN");
        tenantUserRepository.save(creator);

        log.info("Tenant criado: id={}, slug={}, creatorId={}", saved.getId(), saved.getSlug(), creatorId);
        return TenantResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<TenantResponse> findAll() {
        return tenantRepository.findAll().stream()
                .map(TenantResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TenantResponse findById(UUID id) {
        return tenantRepository.findById(id)
                .map(TenantResponse::from)
                .orElseThrow(() -> new TenantNotFoundException("Tenant não encontrado: " + id));
    }

    public TenantResponse update(UUID id, UpdateTenantRequest request) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new TenantNotFoundException("Tenant não encontrado: " + id));

        if (request.name() != null) tenant.setName(request.name());
        if (request.plan() != null) tenant.setPlan(request.plan());
        if (request.status() != null) tenant.setStatus(request.status());

        return TenantResponse.from(tenantRepository.save(tenant));
    }

    public void deactivate(UUID id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new TenantNotFoundException("Tenant não encontrado: " + id));
        tenant.setStatus("CANCELLED");
        tenantRepository.save(tenant);
        log.info("Tenant desativado: id={}", id);
    }

    public TenantUserResponse addUser(UUID tenantId, AddUserToTenantRequest request) {
        if (!tenantRepository.existsById(tenantId)) {
            throw new TenantNotFoundException("Tenant não encontrado: " + tenantId);
        }
        if (tenantUserRepository.existsByTenantIdAndUserId(tenantId, request.userId())) {
            throw new UserAlreadyInTenantException("Usuário já é membro deste tenant");
        }

        TenantUser tu = new TenantUser();
        tu.setTenantId(tenantId);
        tu.setUserId(request.userId());
        tu.setRole(request.role() != null ? request.role() : "OPERATOR");

        TenantUser saved = tenantUserRepository.save(tu);
        log.info("Usuário adicionado ao tenant: tenantId={}, userId={}", tenantId, request.userId());
        return TenantUserResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<TenantUserResponse> listUsers(UUID tenantId) {
        if (!tenantRepository.existsById(tenantId)) {
            throw new TenantNotFoundException("Tenant não encontrado: " + tenantId);
        }
        return tenantUserRepository.findByTenantId(tenantId).stream()
                .map(TenantUserResponse::from)
                .toList();
    }

    public void removeUser(UUID tenantId, UUID userId) {
        TenantUser tu = tenantUserRepository.findByTenantIdAndUserId(tenantId, userId)
                .orElseThrow(() -> new TenantNotFoundException("Usuário não é membro deste tenant"));
        tenantUserRepository.delete(tu);
        log.info("Usuário removido do tenant: tenantId={}, userId={}", tenantId, userId);
    }
}
