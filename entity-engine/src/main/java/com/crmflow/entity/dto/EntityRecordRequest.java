package com.crmflow.entity.dto;

import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record EntityRecordRequest(
        @NotNull Map<String, Object> data
) {}
