package com.investtracker.transaction.validation;

import com.investtracker.transaction.entity.Transaction.TransactionType;

import java.time.LocalDateTime;

public interface TransactionDateValidation {
    LocalDateTime getTransactionDate();
    TransactionType getTransactionType();
}

