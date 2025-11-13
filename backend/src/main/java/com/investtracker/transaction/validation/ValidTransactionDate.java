package com.investtracker.transaction.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = TransactionDateValidator.class)
@Documented
public @interface ValidTransactionDate {
    String message() default "Invalid transaction date";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

