package com.crmflow.entity.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record EntityDefinitionResponse(
        UUID id,
        UUID tenantId,
        String name,
        String slug,
        String displayName,
        String description,
        String icon,
        List<FieldDefinition> fields,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {}
