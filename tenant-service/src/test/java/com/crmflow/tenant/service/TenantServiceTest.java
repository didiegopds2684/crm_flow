package com.crmflow.tenant.service;

import com.crmflow.tenant.dto.CreateTenantRequest;
import com.crmflow.tenant.dto.TenantResponse;
import com.crmflow.tenant.exception.TenantAlreadyExistsException;
import com.crmflow.tenant.exception.TenantNotFoundException;
import com.crmflow.tenant.model.Tenant;
import com.crmflow.tenant.repository.TenantRepository;
import com.crmflow.tenant.repository.TenantUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantServiceTest {

    @Mock
    private TenantRepository tenantRepository;
    @Mock
    private TenantUserRepository tenantUserRepository;
    @Mock
    private TenantSchemaService tenantSchemaService;

    @InjectMocks
    private TenantService tenantService;

    private Tenant tenant;

    @BeforeEach
    void setUp() {
        tenant = new Tenant();
        tenant.setId(UUID.randomUUID());
        tenant.setName("Empresa Acme");
        tenant.setSlug("acme");
        tenant.setPlan("FREE");
        tenant.setStatus("ACTIVE");
    }

    @Test
    void create_success() {
        UUID creatorId = UUID.randomUUID();
        CreateTenantRequest request = new CreateTenantRequest("Empresa Acme", "acme", null);
        when(tenantRepository.existsBySlug("acme")).thenReturn(false);
        when(tenantRepository.save(any(Tenant.class))).thenReturn(tenant);
        doNothing().when(tenantSchemaService).initializeTenantSchema(anyString(), any(UUID.class));
        when(tenantUserRepository.save(any())).thenReturn(null);

        TenantResponse response = tenantService.create(request, creatorId);

        assertThat(response.slug()).isEqualTo("acme");
        assertThat(response.name()).isEqualTo("Empresa Acme");
        verify(tenantSchemaService).initializeTenantSchema("acme", tenant.getId());
        verify(tenantUserRepository).save(any());
    }

    @Test
    void create_duplicateSlug_throwsException() {
        UUID creatorId = UUID.randomUUID();
        CreateTenantRequest request = new CreateTenantRequest("Empresa Acme", "acme", null);
        when(tenantRepository.existsBySlug("acme")).thenReturn(true);

        assertThatThrownBy(() -> tenantService.create(request, creatorId))
                .isInstanceOf(TenantAlreadyExistsException.class)
                .hasMessageContaining("acme");
    }

    @Test
    void findAll_returnsAll() {
        when(tenantRepository.findAll()).thenReturn(List.of(tenant));
        List<TenantResponse> result = tenantService.findAll();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).slug()).isEqualTo("acme");
    }

    @Test
    void findById_notFound_throwsException() {
        UUID id = UUID.randomUUID();
        when(tenantRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tenantService.findById(id))
                .isInstanceOf(TenantNotFoundException.class);
    }

    @Test
    void deactivate_setsStatusCancelled() {
        when(tenantRepository.findById(tenant.getId())).thenReturn(Optional.of(tenant));
        when(tenantRepository.save(any(Tenant.class))).thenReturn(tenant);

        tenantService.deactivate(tenant.getId());

        assertThat(tenant.getStatus()).isEqualTo("CANCELLED");
        verify(tenantRepository).save(tenant);
    }
}
