package com.crmflow.permission.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.UUID;

public record PolicyRequest(
        @NotNull UUID roleId,
        String entitySlug,
        @NotBlank @Pattern(regexp = "^(CREATE|READ|UPDATE|DELETE|\\*)$") String action,
        @NotBlank @Pattern(regexp = "^(ALLOW|DENY)$") String effect,
        int priority
) {}
