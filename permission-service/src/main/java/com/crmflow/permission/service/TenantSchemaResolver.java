package com.crmflow.permission.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenantSchemaResolver {

    private final JdbcTemplate jdbcTemplate;
    private final RedisTemplate<String, String> stringRedisTemplate;

    public String resolve(UUID tenantId) {
        String cacheKey = "tenant:schema:" + tenantId;

        String cached = stringRedisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        try {
            String slug = jdbcTemplate.queryForObject(
                    "SELECT slug FROM public.tenants WHERE id = ?::uuid AND status = 'ACTIVE'",
                    String.class, tenantId.toString());

            if (slug == null) {
                throw new IllegalArgumentException("Tenant não encontrado: " + tenantId);
            }

            String schema = "tenant_" + slug;
            stringRedisTemplate.opsForValue().set(cacheKey, schema, Duration.ofMinutes(30));
            return schema;

        } catch (EmptyResultDataAccessException e) {
            throw new IllegalArgumentException("Tenant não encontrado ou inativo: " + tenantId);
        }
    }
}
