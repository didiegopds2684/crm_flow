package com.crmflow.entity.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.interfaces.RSAPublicKey;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final RSAPublicKey rsaPublicKey;

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(rsaPublicKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUserId(String token) {
        return parseToken(token).getSubject();
    }

    public String extractTenantId(String token) {
        return parseToken(token).get("tenant_id", String.class);
    }
}
