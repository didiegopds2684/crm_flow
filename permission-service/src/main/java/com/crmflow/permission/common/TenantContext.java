package com.crmflow.permission.common;

import java.util.UUID;

public final class TenantContext {

    private static final ThreadLocal<TenantInfo> HOLDER = new ThreadLocal<>();

    public record TenantInfo(UUID tenantId, String schemaName) {}

    private TenantContext() {}

    public static void set(UUID tenantId, String schemaName) {
        HOLDER.set(new TenantInfo(tenantId, schemaName));
    }

    public static TenantInfo get() {
        return HOLDER.get();
    }

    public static UUID getTenantId() {
        TenantInfo info = HOLDER.get();
        return info != null ? info.tenantId() : null;
    }

    public static String getSchemaName() {
        TenantInfo info = HOLDER.get();
        return info != null ? info.schemaName() : "public";
    }

    public static void clear() {
        HOLDER.remove();
    }
}
