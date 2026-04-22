package com.crmflow.entity.client;

import java.util.List;

public record PermissionCheckResponse(
        boolean allowed,
        List<String> deniedFields
) {
    public static PermissionCheckResponse allowAll() {
        return new PermissionCheckResponse(true, List.of());
    }
}
