package com.crmflow.auth.dto;

import com.crmflow.auth.validation.ValidPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @ValidPassword String password,
        @NotBlank @Size(min = 2, max = 200) String name
) {}
