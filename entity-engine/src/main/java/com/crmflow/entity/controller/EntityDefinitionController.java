package com.crmflow.entity.controller;

import com.crmflow.entity.common.ApiResponse;
import com.crmflow.entity.common.TenantContext;
import com.crmflow.entity.dto.EntityDefinitionRequest;
import com.crmflow.entity.dto.EntityDefinitionResponse;
import com.crmflow.entity.service.EntityDefinitionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/entities/definitions")
@RequiredArgsConstructor
public class EntityDefinitionController {

    private final EntityDefinitionService service;

    @PostMapping
    public ResponseEntity<ApiResponse<EntityDefinitionResponse>> create(
            @Valid @RequestBody EntityDefinitionRequest request,
            Authentication auth) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = extractUserId(auth);
        EntityDefinitionResponse response = service.create(request, tenantId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EntityDefinitionResponse>>> list() {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.of(service.listByTenant(tenantId)));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<EntityDefinitionResponse>> findBySlug(@PathVariable String slug) {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.of(service.findBySlug(slug, tenantId)));
    }

    @PutMapping("/{slug}")
    public ResponseEntity<ApiResponse<EntityDefinitionResponse>> update(
            @PathVariable String slug,
            @Valid @RequestBody EntityDefinitionRequest request,
            Authentication auth) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = extractUserId(auth);
        return ResponseEntity.ok(ApiResponse.of(service.update(slug, request, tenantId, userId)));
    }

    @DeleteMapping("/{slug}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String slug) {
        UUID tenantId = TenantContext.getTenantId();
        service.delete(slug, tenantId);
        return ResponseEntity.ok(ApiResponse.of(null, "Entidade removida com sucesso"));
    }

    private UUID extractUserId(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof String id) {
            try {
                return UUID.fromString(id);
            } catch (IllegalArgumentException ignored) {}
        }
        return null;
    }
}
