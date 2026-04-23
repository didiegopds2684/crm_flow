package com.crmflow.tenant.controller;

import com.crmflow.tenant.common.ApiResponse;
import com.crmflow.tenant.dto.*;
import com.crmflow.tenant.service.TenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tenants", description = "Gerenciamento de tenants e seus usuários")
public class TenantController {

    private final TenantService tenantService;

    @PostMapping
    @Operation(summary = "Cria novo tenant e provisiona seu schema PostgreSQL")
    public ResponseEntity<ApiResponse<TenantResponse>> create(
            @Valid @RequestBody CreateTenantRequest request,
            Authentication authentication) {
        log.info("Criando tenant: slug={}", request.slug());
        UUID creatorId = UUID.fromString(authentication.getName());
        TenantResponse response = tenantService.create(request, creatorId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(response, "Tenant criado com sucesso"));
    }

    @GetMapping
    @Operation(summary = "Lista todos os tenants")
    public ResponseEntity<ApiResponse<List<TenantResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.of(tenantService.findAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca tenant por ID")
    public ResponseEntity<ApiResponse<TenantResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.of(tenantService.findById(id)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza dados do tenant")
    public ResponseEntity<ApiResponse<TenantResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTenantRequest request) {
        return ResponseEntity.ok(ApiResponse.of(tenantService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desativa tenant (status CANCELLED)")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable UUID id) {
        tenantService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.ok("Tenant desativado"));
    }

    @PostMapping("/{id}/users")
    @Operation(summary = "Adiciona usuário ao tenant com uma role")
    public ResponseEntity<ApiResponse<TenantUserResponse>> addUser(
            @PathVariable UUID id,
            @Valid @RequestBody AddUserToTenantRequest request) {
        TenantUserResponse response = tenantService.addUser(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(response, "Usuário adicionado ao tenant"));
    }

    @GetMapping("/{id}/users")
    @Operation(summary = "Lista usuários do tenant")
    public ResponseEntity<ApiResponse<List<TenantUserResponse>>> listUsers(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.of(tenantService.listUsers(id)));
    }

    @DeleteMapping("/{id}/users/{userId}")
    @Operation(summary = "Remove usuário do tenant")
    public ResponseEntity<ApiResponse<Void>> removeUser(
            @PathVariable UUID id,
            @PathVariable UUID userId) {
        tenantService.removeUser(id, userId);
        return ResponseEntity.ok(ApiResponse.ok("Usuário removido do tenant"));
    }
}
