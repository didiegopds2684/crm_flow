package com.crmflow.tenant.dto;

import com.crmflow.tenant.model.TenantUser;

import java.time.Instant;
import java.util.UUID;

public record TenantUserResponse(UUID id, UUID tenantId, UUID userId, String role, Instant createdAt) {

    public static TenantUserResponse from(TenantUser tu) {
        return new TenantUserResponse(tu.getId(), tu.getTenantId(), tu.getUserId(), tu.getRole(), tu.getCreatedAt());
    }
}
