package com.crmflow.entity.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record EntityRecordResponse(
        UUID id,
        UUID entityId,
        UUID tenantId,
        Map<String, Object> data,
        UUID createdBy,
        Instant createdAt,
        Instant updatedAt
) {}
