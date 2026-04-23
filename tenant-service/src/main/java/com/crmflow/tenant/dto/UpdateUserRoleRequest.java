package com.crmflow.tenant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateUserRoleRequest(
        @NotBlank
        @Pattern(regexp = "TENANT_ADMIN|MANAGER|OPERATOR|VIEWER", message = "Role inválida")
        String role
) {}
