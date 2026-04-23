package com.crmflow.auth.service;

import com.crmflow.auth.dto.*;
import com.crmflow.auth.exception.InvalidCredentialsException;
import com.crmflow.auth.exception.UserAlreadyExistsException;
import com.crmflow.auth.model.User;
import com.crmflow.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;

    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new UserAlreadyExistsException("Email já cadastrado: " + request.email());
        }
        User user = new User();
        user.setEmail(request.email().toLowerCase().trim());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setName(request.name().trim());
        User saved = userRepository.save(user);
        log.info("Usuário registrado: id={}, email={}", saved.getId(), saved.getEmail());
        return UserResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email().toLowerCase().trim())
                .orElseThrow(() -> new InvalidCredentialsException("Credenciais inválidas"));

        if (!user.isActive()) {
            throw new InvalidCredentialsException("Usuário inativo");
        }

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new InvalidCredentialsException("Credenciais inválidas");
        }

        String accessToken = jwtService.generateAccessToken(user, null, List.of("USER"));
        String refreshToken = refreshTokenService.generate(user.getId(), null);

        log.info("Login bem-sucedido: userId={}", user.getId());
        return new LoginResponse(accessToken, refreshToken, jwtService.getAccessTokenExpiration(), "Bearer");
    }

    @Transactional(readOnly = true)
    public TokenResponse refresh(RefreshRequest request) {
        RefreshTokenService.TokenData tokenData = refreshTokenService.validate(request.refreshToken());
        User user = userRepository.findById(tokenData.userId())
                .orElseThrow(() -> new InvalidCredentialsException("Usuário não encontrado"));

        if (!user.isActive()) {
            refreshTokenService.revokeByHash(tokenData.tokenHash());
            throw new InvalidCredentialsException("Usuário inativo");
        }

        String accessToken = jwtService.generateAccessToken(user, tokenData.tenantId(), List.of("USER"));
        log.debug("Token renovado para userId={}", user.getId());
        return new TokenResponse(accessToken, jwtService.getAccessTokenExpiration());
    }

    public void logout(String refreshToken) {
        refreshTokenService.revoke(refreshToken);
        log.debug("Logout realizado");
    }

    @Transactional(readOnly = true)
    public UserResponse getMe(String userId) {
        User user = userRepository.findById(java.util.UUID.fromString(userId))
                .orElseThrow(() -> new InvalidCredentialsException("Usuário não encontrado"));
        return UserResponse.from(user);
    }

    public UserResponse updateUser(UUID userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidCredentialsException("Usuário não encontrado"));

        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name().trim());
        }

        if (request.email() != null && !request.email().isBlank()) {
            String newEmail = request.email().toLowerCase().trim();
            if (!newEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                throw new InvalidCredentialsException("Formato de email inválido: " + newEmail);
            }
            if (!newEmail.equals(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new UserAlreadyExistsException("Email já cadastrado: " + newEmail);
            }
            user.setEmail(newEmail);
        }

        if (request.newPassword() != null && !request.newPassword().isBlank()) {
            if (request.currentPassword() == null || !passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
                throw new InvalidCredentialsException("Senha atual incorreta");
            }
            user.setPassword(passwordEncoder.encode(request.newPassword()));
        }

        User saved = userRepository.save(user);
        log.info("Usuário atualizado: id={}", saved.getId());
        return UserResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public UserResponse findByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .map(UserResponse::from)
                .orElse(null);
    }

    public List<UserResponse> getUsersByIds(List<UUID> ids) {
        return userRepository.findAllById(ids)
                .stream()
                .map(UserResponse::from)
                .toList();
    }
}
