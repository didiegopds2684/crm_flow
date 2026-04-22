package com.crmflow.entity.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(
        name = "permission-service",
        url = "${services.permission-service.url}"
)
public interface PermissionServiceClient {

    @PostMapping("/api/v1/permissions/check")
    PermissionCheckResponse checkPermission(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestHeader("Authorization") String authorization,
            @RequestBody PermissionCheckRequest request
    );
}
