package com.crmflow.entity.service;

import com.crmflow.entity.dto.EntityDefinitionRequest;
import com.crmflow.entity.dto.EntityDefinitionResponse;
import com.crmflow.entity.exception.DuplicateEntitySlugException;
import com.crmflow.entity.exception.EntityNotFoundException;
import com.crmflow.entity.mapper.EntityDefinitionMapper;
import com.crmflow.entity.model.EntityDefinition;
import com.crmflow.entity.repository.EntityDefinitionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class EntityDefinitionService {

    private final EntityDefinitionRepository repository;
    private final EntityDefinitionMapper mapper;

    @Transactional
    public EntityDefinitionResponse create(EntityDefinitionRequest request, UUID tenantId, UUID userId) {
        if (repository.existsBySlugAndTenantId(request.slug(), tenantId)) {
            throw new DuplicateEntitySlugException(request.slug());
        }
        EntityDefinition entity = mapper.toEntity(request, tenantId, userId);
        entity = repository.save(entity);
        log.info("Entidade criada: slug={} tenantId={}", request.slug(), tenantId);
        return mapper.toResponse(entity);
    }

    public List<EntityDefinitionResponse> listByTenant(UUID tenantId) {
        return repository.findByTenantIdAndActiveTrue(tenantId)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Cacheable(value = "schemas", key = "#tenantId + ':' + #slug")
    public EntityDefinitionResponse findBySlug(String slug, UUID tenantId) {
        return repository.findBySlugAndTenantIdAndActiveTrue(slug, tenantId)
                .map(mapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Entidade não encontrada: " + slug));
    }

    @Transactional
    @CacheEvict(value = "schemas", key = "#tenantId + ':' + #slug")
    public EntityDefinitionResponse update(String slug, EntityDefinitionRequest request,
                                            UUID tenantId, UUID userId) {
        EntityDefinition entity = repository.findBySlugAndTenantIdAndActiveTrue(slug, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Entidade não encontrada: " + slug));

        entity.setName(request.name());
        entity.setDisplayName(request.displayName());
        entity.setDescription(request.description());
        entity.setIcon(request.icon());
        entity.setSchema(Map.of("fields", request.fields()));

        entity = repository.save(entity);
        log.info("Entidade atualizada: slug={} tenantId={}", slug, tenantId);
        return mapper.toResponse(entity);
    }

    @Transactional
    @CacheEvict(value = "schemas", key = "#tenantId + ':' + #slug")
    public void delete(String slug, UUID tenantId) {
        EntityDefinition entity = repository.findBySlugAndTenantIdAndActiveTrue(slug, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Entidade não encontrada: " + slug));
        entity.setActive(false);
        repository.save(entity);
        log.info("Entidade desativada: slug={} tenantId={}", slug, tenantId);
    }

    // Returns the raw schema map (used by EntityRecordService for validation)
    public Map<String, Object> getSchemaMap(String slug, UUID tenantId) {
        return repository.findBySlugAndTenantIdAndActiveTrue(slug, tenantId)
                .map(EntityDefinition::getSchema)
                .orElseThrow(() -> new EntityNotFoundException("Entidade não encontrada: " + slug));
    }

    public UUID getEntityId(String slug, UUID tenantId) {
        return repository.findBySlugAndTenantIdAndActiveTrue(slug, tenantId)
                .map(EntityDefinition::getId)
                .orElseThrow(() -> new EntityNotFoundException("Entidade não encontrada: " + slug));
    }
}
