package com.investtracker.portfolio.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RebalanceSuggestion {
    private UUID assetId;
    private String assetSymbol;
    private String assetName;
    private BigDecimal currentAllocation;
    private BigDecimal targetAllocation;
    private BigDecimal difference;
    private BigDecimal suggestedAction; // Positive = buy, Negative = sell
    private String action; // "BUY", "SELL", "HOLD"
}

