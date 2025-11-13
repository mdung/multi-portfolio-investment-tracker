package com.investtracker.transaction.dto;

import com.investtracker.transaction.entity.Transaction.TransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class TransactionRequest {
    @NotNull(message = "Portfolio ID is required")
    private UUID portfolioId;

    @NotNull(message = "Asset ID is required")
    private UUID assetId;

    @NotNull(message = "Transaction type is required")
    private TransactionType transactionType;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private BigDecimal quantity;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal price;

    private BigDecimal fee = BigDecimal.ZERO;

    @NotNull(message = "Transaction date is required")
    private LocalDateTime transactionDate;

    private String notes;

    private UUID transferPortfolioId; // For TRANSFER_IN/TRANSFER_OUT
}

