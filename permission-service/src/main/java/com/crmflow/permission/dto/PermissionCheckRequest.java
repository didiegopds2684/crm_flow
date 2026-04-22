package com.crmflow.permission.dto;

import java.util.Map;
import java.util.UUID;

public record PermissionCheckRequest(
        UUID userId,
        UUID tenantId,
        String entitySlug,
        String action,
        Map<String, Object> recordData
) {}
