package com.crmflow.entity.controller;

import com.crmflow.entity.common.ApiResponse;
import com.crmflow.entity.common.TenantContext;
import com.crmflow.entity.dto.EntityRecordRequest;
import com.crmflow.entity.dto.EntityRecordResponse;
import com.crmflow.entity.dto.PageResponse;
import com.crmflow.entity.service.EntityRecordService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/entities/{slug}/records")
@RequiredArgsConstructor
public class EntityRecordController {

    private final EntityRecordService service;

    @PostMapping
    public ResponseEntity<ApiResponse<EntityRecordResponse>> create(
            @PathVariable String slug,
            @Valid @RequestBody EntityRecordRequest request,
            HttpServletRequest httpRequest) {
        UUID tenantId = TenantContext.getTenantId();
        String auth = httpRequest.getHeader("Authorization");
        EntityRecordResponse response = service.create(slug, request, tenantId, auth);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<EntityRecordResponse>>> list(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sort,
            @RequestParam Map<String, String> allParams) {
        UUID tenantId = TenantContext.getTenantId();
        Map<String, String> filters = allParams.entrySet().stream()
                .filter(e -> !e.getKey().equals("page") && !e.getKey().equals("size")
                             && !e.getKey().equals("sort"))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        PageResponse<EntityRecordResponse> result = service.list(slug, tenantId, filters, sort, page, size);
        return ResponseEntity.ok(ApiResponse.of(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EntityRecordResponse>> findById(
            @PathVariable String slug,
            @PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.of(service.findById(slug, id, tenantId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EntityRecordResponse>> update(
            @PathVariable String slug,
            @PathVariable UUID id,
            @Valid @RequestBody EntityRecordRequest request,
            HttpServletRequest httpRequest) {
        UUID tenantId = TenantContext.getTenantId();
        String auth = httpRequest.getHeader("Authorization");
        return ResponseEntity.ok(ApiResponse.of(service.update(slug, id, request, tenantId, auth)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String slug,
            @PathVariable UUID id,
            HttpServletRequest httpRequest) {
        UUID tenantId = TenantContext.getTenantId();
        String auth = httpRequest.getHeader("Authorization");
        service.delete(slug, id, tenantId, auth);
        return ResponseEntity.ok(ApiResponse.of(null, "Registro removido com sucesso"));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<EntityRecordResponse>>> search(
            @PathVariable String slug,
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.of(service.search(slug, tenantId, q, page, size)));
    }
}
