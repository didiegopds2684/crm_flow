package com.crmflow.tenant.dto;

import jakarta.validation.constraints.Size;

public record UpdateTenantRequest(
        @Size(min = 2, max = 200) String name,
        String plan,
        String status
) {}
