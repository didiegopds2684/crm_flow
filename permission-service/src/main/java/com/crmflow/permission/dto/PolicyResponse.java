package com.crmflow.permission.dto;

import java.time.Instant;
import java.util.UUID;

public record PolicyResponse(
        UUID id,
        UUID tenantId,
        UUID roleId,
        String entitySlug,
        String action,
        String effect,
        int priority,
        Instant createdAt
) {}
