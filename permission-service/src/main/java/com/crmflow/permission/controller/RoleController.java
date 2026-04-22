package com.crmflow.permission.controller;

import com.crmflow.permission.common.ApiResponse;
import com.crmflow.permission.common.TenantContext;
import com.crmflow.permission.dto.RoleRequest;
import com.crmflow.permission.dto.RoleResponse;
import com.crmflow.permission.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/permissions/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoleResponse>>> list() {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.of(service.listByTenant(tenantId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleResponse>> findById(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.of(service.findById(id, tenantId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RoleResponse>> create(@Valid @RequestBody RoleRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        RoleResponse response = service.create(request, tenantId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        service.delete(id, tenantId);
        return ResponseEntity.ok(ApiResponse.of(null, "Role removida com sucesso"));
    }
}
