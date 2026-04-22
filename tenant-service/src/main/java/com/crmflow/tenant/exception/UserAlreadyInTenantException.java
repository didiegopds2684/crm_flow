package com.crmflow.tenant.exception;

public class UserAlreadyInTenantException extends RuntimeException {
    public UserAlreadyInTenantException(String message) {
        super(message);
    }
}
