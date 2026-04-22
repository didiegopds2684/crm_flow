package com.crmflow.entity.repository;

import com.crmflow.entity.model.EntityRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EntityRecordRepository extends JpaRepository<EntityRecord, UUID> {

    Optional<EntityRecord> findByIdAndTenantId(UUID id, UUID tenantId);

    Page<EntityRecord> findByEntityIdAndTenantId(UUID entityId, UUID tenantId, Pageable pageable);

    @Query(value = """
            SELECT * FROM entity_records
            WHERE entity_id = :entityId
              AND tenant_id = :tenantId
              AND data::text ILIKE '%' || :query || '%'
            """, nativeQuery = true)
    Page<EntityRecord> fullTextSearch(
            @Param("entityId") UUID entityId,
            @Param("tenantId") UUID tenantId,
            @Param("query") String query,
            Pageable pageable);

    @Query(value = """
            SELECT * FROM entity_records
            WHERE entity_id = :entityId
              AND tenant_id = :tenantId
              AND data @> CAST(:filter AS jsonb)
            """, nativeQuery = true)
    List<EntityRecord> findByJsonContains(
            @Param("entityId") UUID entityId,
            @Param("tenantId") UUID tenantId,
            @Param("filter") String filter);

    void deleteByIdAndTenantId(UUID id, UUID tenantId);

    long countByEntityIdAndTenantId(UUID entityId, UUID tenantId);
}
