package com.crmflow.tenant.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.UUID;

public record AddUserToTenantRequest(
        @NotNull UUID userId,
        @Pattern(regexp = "TENANT_ADMIN|MANAGER|OPERATOR|VIEWER", message = "Role inválida")
        String role
) {}
