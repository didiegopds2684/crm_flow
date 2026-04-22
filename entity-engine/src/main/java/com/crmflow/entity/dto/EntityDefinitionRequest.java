package com.crmflow.entity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record EntityDefinitionRequest(
        @NotBlank String name,
        @NotBlank @Pattern(regexp = "^[a-z][a-z0-9_]*$") String slug,
        String displayName,
        String description,
        String icon,
        @NotNull @Size(min = 1) List<FieldDefinition> fields
) {}
