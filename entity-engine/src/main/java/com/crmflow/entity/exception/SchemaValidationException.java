package com.crmflow.entity.exception;

import java.util.List;

public class SchemaValidationException extends RuntimeException {

    public record ValidationError(String field, String message) {}

    private final List<ValidationError> errors;

    public SchemaValidationException(List<ValidationError> errors) {
        super("Payload inválido: " + errors.size() + " erro(s) de validação");
        this.errors = errors;
    }

    public List<ValidationError> getErrors() {
        return errors;
    }
}
