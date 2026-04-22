package com.crmflow.tenant.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    public record ErrorResponse(String error, String message, int status, Instant timestamp) {}

    @ExceptionHandler(TenantNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(TenantNotFoundException ex) {
        return ResponseEntity.status(404).body(
                new ErrorResponse("NOT_FOUND", ex.getMessage(), 404, Instant.now())
        );
    }

    @ExceptionHandler(TenantAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleAlreadyExists(TenantAlreadyExistsException ex) {
        return ResponseEntity.status(409).body(
                new ErrorResponse("CONFLICT", ex.getMessage(), 409, Instant.now())
        );
    }

    @ExceptionHandler(UserAlreadyInTenantException.class)
    public ResponseEntity<ErrorResponse> handleUserAlreadyInTenant(UserAlreadyInTenantException ex) {
        return ResponseEntity.status(409).body(
                new ErrorResponse("CONFLICT", ex.getMessage(), 409, Instant.now())
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleBeanValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return ResponseEntity.status(400).body(
                new ErrorResponse("VALIDATION_ERROR", message, 400, Instant.now())
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(AccessDeniedException ex) {
        return ResponseEntity.status(403).body(
                new ErrorResponse("FORBIDDEN", "Acesso negado", 403, Instant.now())
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(500).body(
                new ErrorResponse("INTERNAL_ERROR", "Erro interno do servidor", 500, Instant.now())
        );
    }
}
