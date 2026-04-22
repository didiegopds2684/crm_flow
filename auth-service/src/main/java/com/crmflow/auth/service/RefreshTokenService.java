package com.crmflow.auth.service;

import com.crmflow.auth.exception.InvalidTokenException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private static final String KEY_PREFIX = "refresh:";

    private final StringRedisTemplate redisTemplate;

    @Value("${jwt.refresh-token-expiration:604800}")
    private long refreshTokenExpiration;

    public String generate(UUID userId, UUID tenantId) {
        String token = UUID.randomUUID().toString();
        String hash = sha256(token);
        String value = userId + ":" + (tenantId != null ? tenantId : "");
        redisTemplate.opsForValue().set(KEY_PREFIX + hash, value, Duration.ofSeconds(refreshTokenExpiration));
        log.debug("Refresh token gerado para userId={}", userId);
        return token;
    }

    public TokenData validate(String token) {
        String hash = sha256(token);
        String value = redisTemplate.opsForValue().get(KEY_PREFIX + hash);
        if (value == null) {
            throw new InvalidTokenException("Refresh token inválido ou expirado");
        }
        String[] parts = value.split(":");
        UUID userId = UUID.fromString(parts[0]);
        UUID tenantId = parts.length > 1 && !parts[1].isEmpty() ? UUID.fromString(parts[1]) : null;
        return new TokenData(userId, tenantId, hash);
    }

    public void revoke(String token) {
        String hash = sha256(token);
        redisTemplate.delete(KEY_PREFIX + hash);
    }

    public void revokeByHash(String hash) {
        redisTemplate.delete(KEY_PREFIX + hash);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 não disponível", e);
        }
    }

    public record TokenData(UUID userId, UUID tenantId, String tokenHash) {}
}
