package com.crmflow.entity.service;

import com.crmflow.entity.exception.SchemaValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SchemaValidatorServiceTest {

    private SchemaValidatorService validator;

    @BeforeEach
    void setUp() {
        validator = new SchemaValidatorService();
    }

    private Map<String, Object> schema(List<Map<String, Object>> fields) {
        return Map.of("fields", fields);
    }

    @Test
    void validates_required_string_field() {
        var schema = schema(List.of(Map.of("name", "nome", "type", "STRING", "required", true)));

        assertThatThrownBy(() -> validator.validate(schema, Map.of()))
                .isInstanceOf(SchemaValidationException.class)
                .satisfies(ex -> {
                    var errors = ((SchemaValidationException) ex).getErrors();
                    assert errors.size() == 1;
                    assert errors.get(0).field().equals("nome");
                });
    }

    @Test
    void passes_when_required_field_is_present() {
        var schema = schema(List.of(Map.of("name", "nome", "type", "STRING", "required", true)));
        assertThatCode(() -> validator.validate(schema, Map.of("nome", "João")))
                .doesNotThrowAnyException();
    }

    @Test
    void rejects_invalid_email() {
        var schema = schema(List.of(Map.of("name", "email", "type", "EMAIL", "required", true)));
        assertThatThrownBy(() -> validator.validate(schema, Map.of("email", "not-an-email")))
                .isInstanceOf(SchemaValidationException.class);
    }

    @Test
    void accepts_valid_email() {
        var schema = schema(List.of(Map.of("name", "email", "type", "EMAIL", "required", true)));
        assertThatCode(() -> validator.validate(schema, Map.of("email", "user@example.com")))
                .doesNotThrowAnyException();
    }

    @Test
    void rejects_invalid_enum_value() {
        var schema = schema(List.of(Map.of(
                "name", "status", "type", "ENUM", "required", true,
                "options", List.of("ativo", "inativo"))));
        assertThatThrownBy(() -> validator.validate(schema, Map.of("status", "pendente")))
                .isInstanceOf(SchemaValidationException.class);
    }

    @Test
    void accepts_valid_enum_value() {
        var schema = schema(List.of(Map.of(
                "name", "status", "type", "ENUM", "required", true,
                "options", List.of("ativo", "inativo"))));
        assertThatCode(() -> validator.validate(schema, Map.of("status", "ativo")))
                .doesNotThrowAnyException();
    }

    @Test
    void rejects_number_below_min() {
        var schema = schema(List.of(Map.of(
                "name", "score", "type", "NUMBER", "required", true,
                "validations", Map.of("min", 0, "max", 100))));
        assertThatThrownBy(() -> validator.validate(schema, Map.of("score", -5)))
                .isInstanceOf(SchemaValidationException.class);
    }

    @Test
    void accepts_number_within_range() {
        var schema = schema(List.of(Map.of(
                "name", "score", "type", "NUMBER", "required", true,
                "validations", Map.of("min", 0, "max", 100))));
        assertThatCode(() -> validator.validate(schema, Map.of("score", 75)))
                .doesNotThrowAnyException();
    }

    @Test
    void optional_field_absent_is_valid() {
        var schema = schema(List.of(Map.of("name", "descricao", "type", "TEXT", "required", false)));
        assertThatCode(() -> validator.validate(schema, Map.of()))
                .doesNotThrowAnyException();
    }

    @Test
    void collects_multiple_errors() {
        var schema = schema(List.of(
                Map.of("name", "nome", "type", "STRING", "required", true),
                Map.of("name", "email", "type", "EMAIL", "required", true)));

        assertThatThrownBy(() -> validator.validate(schema, Map.of()))
                .isInstanceOf(SchemaValidationException.class)
                .satisfies(ex -> {
                    var errors = ((SchemaValidationException) ex).getErrors();
                    assert errors.size() == 2;
                });
    }
}
