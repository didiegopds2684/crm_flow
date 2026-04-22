package com.crmflow.permission.dto;

import java.util.List;

public record PermissionCheckResponse(
        boolean allowed,
        String reason,
        List<String> deniedFields
) {
    public static PermissionCheckResponse allow() {
        return new PermissionCheckResponse(true, "Allowed", List.of());
    }

    public static PermissionCheckResponse deny(String reason) {
        return new PermissionCheckResponse(false, reason, List.of());
    }
}
