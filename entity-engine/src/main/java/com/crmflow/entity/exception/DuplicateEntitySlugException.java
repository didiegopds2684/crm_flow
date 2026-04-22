package com.crmflow.entity.exception;

public class DuplicateEntitySlugException extends RuntimeException {
    public DuplicateEntitySlugException(String slug) {
        super("Já existe uma entidade com o slug: " + slug);
    }
}
