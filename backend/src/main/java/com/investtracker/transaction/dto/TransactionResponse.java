package com.investtracker.transaction.dto;

import com.investtracker.transaction.entity.Transaction.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private UUID id;
    private UUID portfolioId;
    private UUID assetId;
    private String assetSymbol;
    private String assetName;
    private TransactionType transactionType;
    private BigDecimal quantity;
    private BigDecimal price;
    private BigDecimal fee;
    private LocalDateTime transactionDate;
    private String notes;
    private UUID transferPortfolioId;
    private LocalDateTime createdAt;
}

