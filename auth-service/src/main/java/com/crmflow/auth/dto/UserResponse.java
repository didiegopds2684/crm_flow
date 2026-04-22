package com.crmflow.auth.dto;

import com.crmflow.auth.model.User;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(UUID id, String email, String name, Instant createdAt) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getName(), user.getCreatedAt());
    }
}
