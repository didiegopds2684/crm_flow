package com.crmflow.auth.service;

import com.crmflow.auth.exception.InvalidTokenException;
import com.crmflow.auth.model.User;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private JwtService jwtService;
    private User user;

    @BeforeEach
    void setUp() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        KeyPair keyPair = kpg.generateKeyPair();

        jwtService = new JwtService(
                (RSAPrivateKey) keyPair.getPrivate(),
                (RSAPublicKey) keyPair.getPublic()
        );
        // @Value não é injetado fora do contexto Spring — definimos via reflexão
        ReflectionTestUtils.setField(jwtService, "accessTokenExpiration", 900);

        user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("test@example.com");
        user.setName("Test User");
    }

    @Test
    void generateAndValidate_success() {
        UUID tenantId = UUID.randomUUID();
        String token = jwtService.generateAccessToken(user, tenantId, List.of("USER", "MANAGER"));

        Claims claims = jwtService.validateAndExtract(token);

        assertThat(claims.getSubject()).isEqualTo(user.getId().toString());
        assertThat(claims.get("tenant_id", String.class)).isEqualTo(tenantId.toString());
        assertThat(claims.get("roles", List.class)).containsExactly("USER", "MANAGER");
    }

    @Test
    void validateInvalidToken_throwsException() {
        assertThatThrownBy(() -> jwtService.validateAndExtract("token.invalido.aqui"))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void generateToken_withoutTenant_success() {
        String token = jwtService.generateAccessToken(user, null, List.of("USER"));
        Claims claims = jwtService.validateAndExtract(token);
        assertThat(claims.getSubject()).isEqualTo(user.getId().toString());
    }
}
