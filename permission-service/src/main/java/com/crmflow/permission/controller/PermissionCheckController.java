package com.crmflow.permission.controller;

import com.crmflow.permission.common.TenantContext;
import com.crmflow.permission.dto.PermissionCheckRequest;
import com.crmflow.permission.dto.PermissionCheckResponse;
import com.crmflow.permission.service.RbacEvaluatorService;
import com.crmflow.permission.service.TenantSchemaResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/permissions/check")
@RequiredArgsConstructor
@Slf4j
public class PermissionCheckController {

    private final RbacEvaluatorService evaluator;
    private final TenantSchemaResolver schemaResolver;

    // Internal endpoint — called by entity-engine before every write operation.
    // The TenantContext is populated by TenantFilter from the X-Tenant-ID header,
    // but we also accept tenantId in the body to ensure the evaluation uses the
    // correct tenant even when called directly (without going through the gateway).
    @PostMapping
    public ResponseEntity<PermissionCheckResponse> check(@RequestBody PermissionCheckRequest request) {
        // Ensure TenantContext is set for the JPA multi-tenancy resolver
        if (TenantContext.getTenantId() == null && request.tenantId() != null) {
            String schema = schemaResolver.resolve(request.tenantId());
            TenantContext.set(request.tenantId(), schema);
        }

        log.debug("Verificando permissão: userId={} tenant={} entity={} action={}",
                request.userId(), request.tenantId(), request.entitySlug(), request.action());

        PermissionCheckResponse response = evaluator.evaluate(request);
        return ResponseEntity.ok(response);
    }
}
