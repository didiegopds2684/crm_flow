package com.crmflow.permission.dto;

import java.time.Instant;
import java.util.UUID;

public record RoleResponse(
        UUID id,
        UUID tenantId,
        String name,
        String slug,
        String description,
        boolean system,
        Instant createdAt
) {}
