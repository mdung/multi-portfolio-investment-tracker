package com.investtracker.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioSummaryResponse {
    private BigDecimal totalValue;
    private BigDecimal totalCost;
    private BigDecimal totalPnL;
    private BigDecimal totalPnLPercent;
    private String baseCurrency;
    private List<HoldingResponse> holdings;
    private Map<String, BigDecimal> allocationByAssetType;
    private Map<String, BigDecimal> topAssets;
}

