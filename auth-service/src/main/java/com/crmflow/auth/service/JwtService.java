package com.crmflow.auth.service;

import com.crmflow.auth.exception.InvalidTokenException;
import com.crmflow.auth.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class JwtService {

    private final RSAPrivateKey privateKey;
    private final RSAPublicKey publicKey;

    @Value("${jwt.access-token-expiration:900}")
    private int accessTokenExpiration;

    public String generateAccessToken(User user, UUID tenantId, List<String> roles) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("tenant_id", tenantId != null ? tenantId.toString() : null)
                .claim("roles", roles)
                .claim("email", user.getEmail())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(accessTokenExpiration)))
                .signWith(privateKey, Jwts.SIG.RS256)
                .compact();
    }

    public Claims validateAndExtract(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(publicKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException ex) {
            log.debug("Token inválido: {}", ex.getMessage());
            throw new InvalidTokenException("Token inválido ou expirado");
        }
    }

    public int getAccessTokenExpiration() {
        return accessTokenExpiration;
    }
}
