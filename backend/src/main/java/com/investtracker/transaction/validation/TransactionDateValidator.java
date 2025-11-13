package com.investtracker.transaction.validation;

import com.investtracker.transaction.entity.Transaction.TransactionType;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.LocalDateTime;

public class TransactionDateValidator implements ConstraintValidator<ValidTransactionDate, TransactionDateValidation> {
    
    @Override
    public void initialize(ValidTransactionDate constraintAnnotation) {
    }
    
    @Override
    public boolean isValid(TransactionDateValidation value, ConstraintValidatorContext context) {
        if (value == null || value.getTransactionDate() == null || value.getTransactionType() == null) {
            return true; // Let @NotNull handle null checks
        }
        
        LocalDateTime transactionDate = value.getTransactionDate();
        LocalDateTime now = LocalDateTime.now();
        
        // Most transaction types should not be in the future
        // Except for scheduled/planned transactions (could be extended)
        if (transactionDate.isAfter(now)) {
            // Allow future dates only for certain types (could be extended)
            // For now, reject all future dates
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Transaction date cannot be in the future"
            ).addConstraintViolation();
            return false;
        }
        
        return true;
    }
}

