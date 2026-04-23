package com.crmflow.tenant.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class TenantSchemaServiceTest {

    @Mock
    private DataSource dataSource;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private TenantSchemaService tenantSchemaService;

    @Test
    void dropTenantSchema_executesDropStatement() {
        tenantSchemaService.dropTenantSchema("acme");
        verify(jdbcTemplate).execute(contains("DROP SCHEMA IF EXISTS tenant_acme"));
    }
}
