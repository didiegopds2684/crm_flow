package com.crmflow.entity.repository;

import com.crmflow.entity.model.EntityDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EntityDefinitionRepository extends JpaRepository<EntityDefinition, UUID> {

    Optional<EntityDefinition> findBySlugAndTenantIdAndActiveTrue(String slug, UUID tenantId);

    boolean existsBySlugAndTenantId(String slug, UUID tenantId);

    List<EntityDefinition> findByTenantIdAndActiveTrue(UUID tenantId);
}
