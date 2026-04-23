package com.crmflow.auth.dto;

import jakarta.validation.constraints.Size;

// All fields are optional — service only updates what is non-blank.
// @Email removed intentionally: Hibernate Validator rejects empty string, but we treat it as "no change".
public record UpdateUserRequest(
        @Size(min = 2, max = 200) String name,
        @Size(max = 254)          String email,
                                  String currentPassword,
                                  String newPassword
) {}
