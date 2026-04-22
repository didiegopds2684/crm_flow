package com.crmflow.auth.dto;

public record TokenResponse(String accessToken, int expiresIn) {}
