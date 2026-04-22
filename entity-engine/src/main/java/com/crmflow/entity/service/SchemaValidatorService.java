package com.crmflow.entity.service;

import com.crmflow.entity.exception.SchemaValidationException;
import com.crmflow.entity.exception.SchemaValidationException.ValidationError;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class SchemaValidatorService {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Pattern URL_PATTERN =
            Pattern.compile("^https?://[^\\s]+$");
    private static final Pattern DATE_PATTERN =
            Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");
    private static final Pattern PHONE_PATTERN =
            Pattern.compile("^[+\\d][\\d\\s\\-().]{6,20}$");

    public void validate(Map<String, Object> schema, Map<String, Object> payload) {
        List<ValidationError> errors = new ArrayList<>();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> fields = (List<Map<String, Object>>) schema.get("fields");
        if (fields == null) return;

        for (Map<String, Object> field : fields) {
            String fieldName = (String) field.get("name");
            String fieldType = (String) field.get("type");
            boolean required = Boolean.TRUE.equals(field.get("required"));
            Object value = payload.get(fieldName);

            if (required && value == null) {
                errors.add(new ValidationError(fieldName, "Campo obrigatório"));
                continue;
            }
            if (value == null) continue;

            validateByType(fieldName, fieldType, field, value, errors);
        }

        if (!errors.isEmpty()) {
            throw new SchemaValidationException(errors);
        }
    }

    @SuppressWarnings("unchecked")
    private void validateByType(String fieldName, String type,
                                 Map<String, Object> field, Object value,
                                 List<ValidationError> errors) {
        switch (type.toUpperCase()) {
            case "STRING", "TEXT" -> {
                if (!(value instanceof String s)) {
                    errors.add(new ValidationError(fieldName, "Deve ser texto"));
                    return;
                }
                Map<String, Object> v = (Map<String, Object>) field.get("validations");
                if (v != null) {
                    if (v.containsKey("minLength") && s.length() < toInt(v.get("minLength"))) {
                        errors.add(new ValidationError(fieldName, "Mínimo " + v.get("minLength") + " caracteres"));
                    }
                    if (v.containsKey("maxLength") && s.length() > toInt(v.get("maxLength"))) {
                        errors.add(new ValidationError(fieldName, "Máximo " + v.get("maxLength") + " caracteres"));
                    }
                    if (v.containsKey("pattern") && !s.matches((String) v.get("pattern"))) {
                        errors.add(new ValidationError(fieldName, "Formato inválido"));
                    }
                }
            }
            case "EMAIL" -> {
                if (!(value instanceof String s) || !EMAIL_PATTERN.matcher(s).matches()) {
                    errors.add(new ValidationError(fieldName, "Email inválido"));
                }
            }
            case "URL" -> {
                if (!(value instanceof String s) || !URL_PATTERN.matcher(s).matches()) {
                    errors.add(new ValidationError(fieldName, "URL inválida"));
                }
            }
            case "PHONE" -> {
                if (!(value instanceof String s) || !PHONE_PATTERN.matcher(s).matches()) {
                    errors.add(new ValidationError(fieldName, "Telefone inválido"));
                }
            }
            case "DATE" -> {
                if (!(value instanceof String s) || !DATE_PATTERN.matcher(s).matches()) {
                    errors.add(new ValidationError(fieldName, "Data inválida (esperado: yyyy-MM-dd)"));
                }
            }
            case "NUMBER" -> {
                if (!(value instanceof Number n)) {
                    errors.add(new ValidationError(fieldName, "Deve ser um número"));
                    return;
                }
                Map<String, Object> v = (Map<String, Object>) field.get("validations");
                if (v != null) {
                    double dVal = n.doubleValue();
                    if (v.containsKey("min") && dVal < toDouble(v.get("min"))) {
                        errors.add(new ValidationError(fieldName, "Valor mínimo: " + v.get("min")));
                    }
                    if (v.containsKey("max") && dVal > toDouble(v.get("max"))) {
                        errors.add(new ValidationError(fieldName, "Valor máximo: " + v.get("max")));
                    }
                }
            }
            case "BOOLEAN" -> {
                if (!(value instanceof Boolean)) {
                    errors.add(new ValidationError(fieldName, "Deve ser true ou false"));
                }
            }
            case "ENUM" -> {
                List<String> options = (List<String>) field.get("options");
                if (options == null || !options.contains(value.toString())) {
                    errors.add(new ValidationError(fieldName,
                            "Valor inválido. Opções: " + (options != null ? options : "[]")));
                }
            }
            case "RELATION" -> {
                if (!(value instanceof String s)) {
                    errors.add(new ValidationError(fieldName, "Deve ser um UUID"));
                    return;
                }
                try {
                    java.util.UUID.fromString(s);
                } catch (IllegalArgumentException e) {
                    errors.add(new ValidationError(fieldName, "UUID inválido"));
                }
            }
            default -> {
            }
        }
    }

    private int toInt(Object val) {
        return val instanceof Number n ? n.intValue() : Integer.parseInt(val.toString());
    }

    private double toDouble(Object val) {
        return val instanceof Number n ? n.doubleValue() : Double.parseDouble(val.toString());
    }
}
