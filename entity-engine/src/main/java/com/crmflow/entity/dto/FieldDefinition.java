package com.crmflow.entity.dto;

import java.util.List;
import java.util.Map;

public record FieldDefinition(
        String name,
        String type,
        boolean required,
        String label,
        Object defaultValue,
        Map<String, Object> validations,
        List<String> options
) {}
