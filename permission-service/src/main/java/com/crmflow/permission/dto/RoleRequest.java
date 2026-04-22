package com.crmflow.permission.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RoleRequest(
        @NotBlank String name,
        @NotBlank @Pattern(regexp = "^[A-Z][A-Z0-9_]*$") String slug,
        String description
) {}
