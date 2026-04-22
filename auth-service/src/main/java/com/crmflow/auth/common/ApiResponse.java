package com.crmflow.auth.common;

public record ApiResponse<T>(T data, String message, boolean success) {

    public static <T> ApiResponse<T> of(T data) {
        return new ApiResponse<>(data, "OK", true);
    }

    public static <T> ApiResponse<T> of(T data, String message) {
        return new ApiResponse<>(data, message, true);
    }

    public static ApiResponse<Void> ok(String message) {
        return new ApiResponse<>(null, message, true);
    }
}
