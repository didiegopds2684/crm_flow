package com.crmflow.entity.service;

import com.crmflow.entity.client.PermissionCheckRequest;
import com.crmflow.entity.client.PermissionCheckResponse;
import com.crmflow.entity.client.PermissionServiceClient;
import com.crmflow.entity.dto.EntityRecordRequest;
import com.crmflow.entity.dto.EntityRecordResponse;
import com.crmflow.entity.dto.PageResponse;
import com.crmflow.entity.exception.EntityNotFoundException;
import com.crmflow.entity.mapper.EntityRecordMapper;
import com.crmflow.entity.model.EntityRecord;
import com.crmflow.entity.repository.EntityRecordRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class EntityRecordService {

    private final EntityRecordRepository repository;
    private final EntityDefinitionService definitionService;
    private final SchemaValidatorService schemaValidator;
    private final DynamicQueryBuilderService queryBuilder;
    private final EventPublisherService eventPublisher;
    private final EntityRecordMapper mapper;
    private final PermissionServiceClient permissionClient;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public EntityRecordResponse create(String entitySlug, EntityRecordRequest request,
                                        UUID tenantId, String authHeader) {
        UUID userId = extractUserId();

        Map<String, Object> schema = definitionService.getSchemaMap(entitySlug, tenantId);
        schemaValidator.validate(schema, request.data());

        checkPermission(userId, tenantId, entitySlug, "CREATE", request.data(), authHeader);

        UUID entityId = definitionService.getEntityId(entitySlug, tenantId);
        EntityRecord record = new EntityRecord();
        record.setEntityId(entityId);
        record.setTenantId(tenantId);
        record.setData(request.data());
        record.setCreatedBy(userId);
        record = repository.save(record);

        eventPublisher.publishCreated(tenantId, entitySlug, record.getId(), record.getData(), userId);
        log.info("Registro criado: entity={} id={} tenantId={}", entitySlug, record.getId(), tenantId);
        return mapper.toResponse(record);
    }

    public PageResponse<EntityRecordResponse> list(String entitySlug, UUID tenantId,
                                                    Map<String, String> filters,
                                                    String sort, int page, int size) {
        UUID entityId = definitionService.getEntityId(entitySlug, tenantId);

        if (filters == null || filters.isEmpty()) {
            Page<EntityRecord> paged = repository.findByEntityIdAndTenantId(
                    entityId, tenantId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
            return toPageResponse(paged.getContent(), page, size,
                    paged.getTotalElements(), paged.getTotalPages());
        }

        return listWithDynamicFilters(entityId, tenantId, filters, sort, page, size);
    }

    @SuppressWarnings("unchecked")
    private PageResponse<EntityRecordResponse> listWithDynamicFilters(UUID entityId, UUID tenantId,
                                                                       Map<String, String> filters,
                                                                       String sort, int page, int size) {
        DynamicQueryBuilderService.QueryResult result = queryBuilder.build(entityId, tenantId, filters, sort, page, size);

        Query dataQuery = entityManager.createNativeQuery(result.sql(), EntityRecord.class);
        Query countQuery = entityManager.createNativeQuery(result.countSql());

        for (int i = 0; i < result.params().size(); i++) {
            dataQuery.setParameter(i + 1, result.params().get(i));
            countQuery.setParameter(i + 1, result.params().get(i));
        }

        List<EntityRecord> records = dataQuery.getResultList();
        long total = ((Number) countQuery.getSingleResult()).longValue();
        int totalPages = (int) Math.ceil((double) total / size);

        return toPageResponse(records, page, size, total, totalPages);
    }

    public EntityRecordResponse findById(String entitySlug, UUID recordId, UUID tenantId) {
        return repository.findByIdAndTenantId(recordId, tenantId)
                .map(mapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Registro não encontrado: " + recordId));
    }

    @Transactional
    public EntityRecordResponse update(String entitySlug, UUID recordId,
                                        EntityRecordRequest request, UUID tenantId,
                                        String authHeader) {
        UUID userId = extractUserId();

        EntityRecord record = repository.findByIdAndTenantId(recordId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Registro não encontrado: " + recordId));

        Map<String, Object> schema = definitionService.getSchemaMap(entitySlug, tenantId);
        schemaValidator.validate(schema, request.data());

        checkPermission(userId, tenantId, entitySlug, "UPDATE", request.data(), authHeader);

        record.setData(request.data());
        record.setUpdatedBy(userId);
        record = repository.save(record);

        eventPublisher.publishUpdated(tenantId, entitySlug, recordId, record.getData(), userId);
        return mapper.toResponse(record);
    }

    @Transactional
    public void delete(String entitySlug, UUID recordId, UUID tenantId, String authHeader) {
        UUID userId = extractUserId();

        if (!repository.existsById(recordId)) {
            throw new EntityNotFoundException("Registro não encontrado: " + recordId);
        }

        checkPermission(userId, tenantId, entitySlug, "DELETE", Map.of(), authHeader);

        repository.deleteByIdAndTenantId(recordId, tenantId);
        eventPublisher.publishDeleted(tenantId, entitySlug, recordId, userId);
        log.info("Registro deletado: entity={} id={} tenantId={}", entitySlug, recordId, tenantId);
    }

    public PageResponse<EntityRecordResponse> search(String entitySlug, UUID tenantId,
                                                      String query, int page, int size) {
        UUID entityId = definitionService.getEntityId(entitySlug, tenantId);
        Page<EntityRecord> paged = repository.fullTextSearch(
                entityId, tenantId, query, PageRequest.of(page, size));
        return toPageResponse(paged.getContent(), page, size,
                paged.getTotalElements(), paged.getTotalPages());
    }

    private void checkPermission(UUID userId, UUID tenantId, String entitySlug,
                                  String action, Map<String, Object> data, String authHeader) {
        if (userId == null || authHeader == null) return;
        try {
            PermissionCheckResponse response = permissionClient.checkPermission(
                    tenantId.toString(), authHeader,
                    new PermissionCheckRequest(userId, tenantId, entitySlug, action, data));
            if (!response.allowed()) {
                throw new SecurityException("Permissão negada para " + action + " em " + entitySlug);
            }
        } catch (SecurityException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Falha na verificação de permissão (fallback permitido): {}", e.getMessage());
        }
    }

    private UUID extractUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof String id) {
            try {
                return UUID.fromString(id);
            } catch (IllegalArgumentException ignored) {}
        }
        return null;
    }

    private PageResponse<EntityRecordResponse> toPageResponse(List<EntityRecord> records,
                                                               int page, int size,
                                                               long total, int totalPages) {
        return new PageResponse<>(
                records.stream().map(mapper::toResponse).toList(),
                page, size, total, totalPages);
    }
}
