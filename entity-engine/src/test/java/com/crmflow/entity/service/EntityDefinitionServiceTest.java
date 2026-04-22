package com.crmflow.entity.service;

import com.crmflow.entity.dto.EntityDefinitionRequest;
import com.crmflow.entity.dto.EntityDefinitionResponse;
import com.crmflow.entity.dto.FieldDefinition;
import com.crmflow.entity.exception.DuplicateEntitySlugException;
import com.crmflow.entity.exception.EntityNotFoundException;
import com.crmflow.entity.mapper.EntityDefinitionMapper;
import com.crmflow.entity.model.EntityDefinition;
import com.crmflow.entity.repository.EntityDefinitionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EntityDefinitionServiceTest {

    @Mock
    private EntityDefinitionRepository repository;

    @Mock
    private EntityDefinitionMapper mapper;

    @InjectMocks
    private EntityDefinitionService service;

    private UUID tenantId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    private EntityDefinitionRequest buildRequest() {
        FieldDefinition field = new FieldDefinition(
                "nome", "STRING", true, "Nome", null, null, null);
        return new EntityDefinitionRequest(
                "Lead", "lead", "Lead", "Entidade de leads", null, List.of(field));
    }

    private EntityDefinition buildEntity() {
        EntityDefinition e = new EntityDefinition();
        e.setId(UUID.randomUUID());
        e.setTenantId(tenantId);
        e.setName("Lead");
        e.setSlug("lead");
        e.setSchema(Map.of("fields", List.of()));
        e.setCreatedAt(Instant.now());
        e.setUpdatedAt(Instant.now());
        return e;
    }

    @Test
    void create_succeeds_when_slug_is_unique() {
        EntityDefinitionRequest request = buildRequest();
        EntityDefinition entity = buildEntity();
        EntityDefinitionResponse expected = new EntityDefinitionResponse(
                entity.getId(), tenantId, "Lead", "lead", null, null, null, List.of(), true,
                Instant.now(), Instant.now());

        when(repository.existsBySlugAndTenantId("lead", tenantId)).thenReturn(false);
        when(mapper.toEntity(request, tenantId, userId)).thenReturn(entity);
        when(repository.save(entity)).thenReturn(entity);
        when(mapper.toResponse(entity)).thenReturn(expected);

        EntityDefinitionResponse result = service.create(request, tenantId, userId);

        assertThat(result.slug()).isEqualTo("lead");
        verify(repository).save(entity);
    }

    @Test
    void create_throws_when_slug_already_exists() {
        when(repository.existsBySlugAndTenantId("lead", tenantId)).thenReturn(true);
        assertThatThrownBy(() -> service.create(buildRequest(), tenantId, userId))
                .isInstanceOf(DuplicateEntitySlugException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void findBySlug_returns_entity_when_found() {
        EntityDefinition entity = buildEntity();
        EntityDefinitionResponse expected = new EntityDefinitionResponse(
                entity.getId(), tenantId, "Lead", "lead", null, null, null, List.of(), true,
                Instant.now(), Instant.now());

        when(repository.findBySlugAndTenantIdAndActiveTrue("lead", tenantId))
                .thenReturn(Optional.of(entity));
        when(mapper.toResponse(entity)).thenReturn(expected);

        EntityDefinitionResponse result = service.findBySlug("lead", tenantId);
        assertThat(result.slug()).isEqualTo("lead");
    }

    @Test
    void findBySlug_throws_when_not_found() {
        when(repository.findBySlugAndTenantIdAndActiveTrue("inexistente", tenantId))
                .thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.findBySlug("inexistente", tenantId))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void delete_deactivates_entity() {
        EntityDefinition entity = buildEntity();
        when(repository.findBySlugAndTenantIdAndActiveTrue("lead", tenantId))
                .thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);

        service.delete("lead", tenantId);

        assertThat(entity.isActive()).isFalse();
        verify(repository).save(entity);
    }

    @Test
    void listByTenant_returns_all_active_entities() {
        EntityDefinition entity = buildEntity();
        EntityDefinitionResponse response = new EntityDefinitionResponse(
                entity.getId(), tenantId, "Lead", "lead", null, null, null, List.of(), true,
                Instant.now(), Instant.now());

        when(repository.findByTenantIdAndActiveTrue(tenantId)).thenReturn(List.of(entity));
        when(mapper.toResponse(entity)).thenReturn(response);

        List<EntityDefinitionResponse> result = service.listByTenant(tenantId);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).slug()).isEqualTo("lead");
    }
}
