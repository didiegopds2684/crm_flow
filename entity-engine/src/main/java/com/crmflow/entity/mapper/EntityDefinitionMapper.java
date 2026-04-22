package com.crmflow.entity.mapper;

import com.crmflow.entity.dto.EntityDefinitionRequest;
import com.crmflow.entity.dto.EntityDefinitionResponse;
import com.crmflow.entity.dto.FieldDefinition;
import com.crmflow.entity.model.EntityDefinition;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class EntityDefinitionMapper {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final TypeReference<List<FieldDefinition>> FIELD_LIST =
            new TypeReference<>() {};

    public EntityDefinition toEntity(EntityDefinitionRequest request, UUID tenantId, UUID createdBy) {
        EntityDefinition entity = new EntityDefinition();
        entity.setTenantId(tenantId);
        entity.setName(request.name());
        entity.setSlug(request.slug());
        entity.setDisplayName(request.displayName());
        entity.setDescription(request.description());
        entity.setIcon(request.icon());
        entity.setCreatedBy(createdBy);
        entity.setSchema(Map.of("fields", objectMapper.convertValue(request.fields(), Object.class)));
        return entity;
    }

    public EntityDefinitionResponse toResponse(EntityDefinition entity) {
        List<FieldDefinition> fields = extractFields(entity.getSchema());
        return new EntityDefinitionResponse(
                entity.getId(),
                entity.getTenantId(),
                entity.getName(),
                entity.getSlug(),
                entity.getDisplayName(),
                entity.getDescription(),
                entity.getIcon(),
                fields,
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public List<FieldDefinition> extractFields(Map<String, Object> schema) {
        Object rawFields = schema.get("fields");
        if (rawFields == null) return List.of();
        return objectMapper.convertValue(rawFields, FIELD_LIST);
    }
}
