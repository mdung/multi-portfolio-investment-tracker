package com.investtracker.portfolio.dto;

import lombok.Data;

@Data
public class DuplicatePortfolioRequest {
    private String name; // Optional: if not provided, will use original name + " (Copy)"
    private Boolean copyTransactions = false; // Whether to copy transactions
}

