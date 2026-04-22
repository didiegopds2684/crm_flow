package com.crmflow.tenant.dto;

import com.crmflow.tenant.model.Tenant;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record TenantResponse(
        UUID id,
        String name,
        String slug,
        String plan,
        String status,
        Map<String, Object> settings,
        Instant createdAt
) {
    public static TenantResponse from(Tenant tenant) {
        return new TenantResponse(
                tenant.getId(),
                tenant.getName(),
                tenant.getSlug(),
                tenant.getPlan(),
                tenant.getStatus(),
                tenant.getSettings(),
                tenant.getCreatedAt()
        );
    }
}
