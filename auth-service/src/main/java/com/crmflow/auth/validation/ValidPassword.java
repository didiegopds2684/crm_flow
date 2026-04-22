package com.crmflow.auth.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = PasswordValidator.class)
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPassword {
    String message() default "Senha deve ter mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 especial (@#$%^&*)";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
