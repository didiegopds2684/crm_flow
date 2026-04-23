package com.crmflow.auth.controller;

import com.crmflow.auth.common.ApiResponse;
import com.crmflow.auth.dto.*;
import com.crmflow.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Auth", description = "Autenticação e gerência de tokens")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Registra novo usuário")
    public ResponseEntity<ApiResponse<UserResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        log.info("Registro: email={}", request.email());
        UserResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(response, "Usuário criado com sucesso"));
    }

    @PostMapping("/login")
    @Operation(summary = "Autentica usuário e retorna tokens")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        log.info("Login: email={}", request.email());
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renova o access token via refresh token")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(
            @Valid @RequestBody RefreshRequest request) {
        TokenResponse response = authService.refresh(request);
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @PostMapping("/logout")
    @Operation(summary = "Invalida o refresh token")
    public ResponseEntity<ApiResponse<Void>> logout(
            @Valid @RequestBody RefreshRequest request) {
        authService.logout(request.refreshToken());
        return ResponseEntity.ok(ApiResponse.ok("Logout realizado com sucesso"));
    }

    @GetMapping("/me")
    @Operation(summary = "Retorna dados do usuário autenticado")
    public ResponseEntity<ApiResponse<UserResponse>> me(
            @AuthenticationPrincipal String userId) {
        UserResponse response = authService.getMe(userId);
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @PatchMapping("/users/{userId}")
    @Operation(summary = "Atualiza nome, email ou senha de um usuário")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserRequest request) {
        UserResponse response = authService.updateUser(userId, request);
        return ResponseEntity.ok(ApiResponse.of(response, "Usuário atualizado com sucesso"));
    }

    @GetMapping("/users/search")
    @Operation(summary = "Busca usuário por email")
    public ResponseEntity<ApiResponse<UserResponse>> findByEmail(@RequestParam String email) {
        UserResponse user = authService.findByEmail(email);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.of(null, "Usuário não encontrado"));
        }
        return ResponseEntity.ok(ApiResponse.of(user));
    }

    @GetMapping("/users")
    @Operation(summary = "Busca múltiplos usuários por IDs")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsersByIds(
            @RequestParam List<UUID> ids) {
        List<UserResponse> users = authService.getUsersByIds(ids);
        return ResponseEntity.ok(ApiResponse.of(users));
    }
}
