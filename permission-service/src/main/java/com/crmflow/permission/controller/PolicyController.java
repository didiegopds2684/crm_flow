package com.crmflow.permission.controller;

import com.crmflow.permission.common.ApiResponse;
import com.crmflow.permission.common.TenantContext;
import com.crmflow.permission.dto.PolicyRequest;
import com.crmflow.permission.dto.PolicyResponse;
import com.crmflow.permission.service.PolicyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/permissions/policies")
@RequiredArgsConstructor
public class PolicyController {

    private final PolicyService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PolicyResponse>>> list() {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.of(service.listByTenant(tenantId)));
    }

    @GetMapping("/role/{roleId}")
    public ResponseEntity<ApiResponse<List<PolicyResponse>>> listByRole(@PathVariable UUID roleId) {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.of(service.listByRole(roleId, tenantId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PolicyResponse>> create(@Valid @RequestBody PolicyRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        PolicyResponse response = service.create(request, tenantId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        service.delete(id, tenantId);
        return ResponseEntity.ok(ApiResponse.of(null, "Política removida com sucesso"));
    }
}
