package com.investtracker.analytics.dto;

import com.investtracker.transaction.dto.TransactionResponse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private BigDecimal totalNetWorth;
    private BigDecimal totalCost;
    private BigDecimal overallPnL;
    private BigDecimal overallPnLPercent;
    private String baseCurrency;
    private List<Map<String, Object>> topPerformingAssets; // {assetSymbol, return, value}
    private List<TransactionResponse> recentTransactions;
    private Integer totalPortfolios;
}

