package com.crmflow.entity.security;

import com.crmflow.entity.common.TenantContext;
import com.crmflow.entity.service.TenantSchemaResolver;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(2)
public class TenantFilter extends OncePerRequestFilter {

    private final TenantSchemaResolver tenantSchemaResolver;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        try {
            String tenantHeader = request.getHeader("X-Tenant-ID");
            if (tenantHeader != null && !tenantHeader.isBlank()) {
                UUID tenantId = UUID.fromString(tenantHeader);
                String schema = tenantSchemaResolver.resolve(tenantId);
                TenantContext.set(tenantId, schema);
            }
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
