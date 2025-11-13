package com.investtracker.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiskMetricsResponse {
    private BigDecimal portfolioConcentration; // Top 5 assets percentage
    private Map<String, BigDecimal> topAssetsAllocation;
    private BigDecimal volatility; // Standard deviation of returns
    private BigDecimal sharpeRatio; // Risk-adjusted return
    private String currency;
}

