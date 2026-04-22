package com.crmflow.permission.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "permission_policies")
@Getter
@Setter
@NoArgsConstructor
public class PermissionPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "role_id")
    private UUID roleId;

    @Column(name = "entity_slug")
    private String entitySlug;

    // CREATE | READ | UPDATE | DELETE | *
    @Column(nullable = false)
    private String action;

    // SpEL expression for ABAC (optional, future use)
    private String condition;

    // ALLOW | DENY
    @Column(nullable = false)
    private String effect = "ALLOW";

    @Column(nullable = false)
    private int priority = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
