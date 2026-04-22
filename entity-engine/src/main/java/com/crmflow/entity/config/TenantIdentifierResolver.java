package com.crmflow.entity.config;

import com.crmflow.entity.common.TenantContext;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

@Component
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver<String> {

    @Override
    public String resolveCurrentTenantIdentifier() {
        return TenantContext.getSchemaName();
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return false;
    }
}
