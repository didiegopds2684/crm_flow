package com.crmflow.tenant.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenantSchemaService {

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public void initializeTenantSchema(String slug, UUID tenantId) {
        String schemaName = "tenant_" + slug.replace('-', '_');
        createSchema(schemaName);
        runMigrations(schemaName);
        insertBuiltInRoles(schemaName, tenantId);
        log.info("Schema do tenant inicializado: {}", schemaName);
    }

    private void createSchema(String schemaName) {
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS " + schemaName);
        log.debug("Schema criado (ou já existia): {}", schemaName);
    }

    private void runMigrations(String schemaName) {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .schemas(schemaName)
                .locations("classpath:db/migration/tenant")
                .baselineOnMigrate(true)
                .load();
        int applied = flyway.migrate().migrationsExecuted;
        log.debug("Migrations aplicadas no schema {}: {}", schemaName, applied);
    }

    private void insertBuiltInRoles(String schemaName, UUID tenantId) {
        String sql = "INSERT INTO " + schemaName + ".permission_roles " +
                     "(tenant_id, name, slug, is_system) VALUES (?, ?, ?, true) " +
                     "ON CONFLICT (tenant_id, slug) DO NOTHING";

        record BuiltInRole(String name, String slug) {}
        var roles = new BuiltInRole[]{
            new BuiltInRole("Tenant Admin", "TENANT_ADMIN"),
            new BuiltInRole("Manager",      "MANAGER"),
            new BuiltInRole("Operator",     "OPERATOR"),
            new BuiltInRole("Viewer",       "VIEWER")
        };

        for (var role : roles) {
            jdbcTemplate.update(sql, tenantId, role.name(), role.slug());
        }
        log.debug("Roles built-in inseridas para tenantId={}", tenantId);
    }

    public void dropTenantSchema(String slug) {
        String schemaName = "tenant_" + slug.replace('-', '_');
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS " + schemaName + " CASCADE");
        log.info("Schema removido: {}", schemaName);
    }
}
