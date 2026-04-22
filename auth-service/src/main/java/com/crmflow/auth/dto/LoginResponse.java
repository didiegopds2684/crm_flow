package com.crmflow.auth.dto;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        int expiresIn,
        String tokenType
) {}
