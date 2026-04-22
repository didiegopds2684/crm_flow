package com.crmflow.permission.exception;

public class DuplicateRoleException extends RuntimeException {
    public DuplicateRoleException(String slug) {
        super("Já existe uma role com o slug: " + slug);
    }
}
